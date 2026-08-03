// services/AI_Services/course_draft_ai_service.ts
import { groq } from "../../utils/groq_admin/groq";
import { getCourseDraftTools } from "../../utils/tools/course_draft_tools";
import { COURSE_DRAFT_SYSTEM_PROMPT, COURSE_DRAFT_WELCOME_MESSAGE } from "../../utils/prompt/prompt";
import { emitProgress } from "../../realtime/progressEmitter";
import {
  createSession,
  getSession,
  listSessions,
  setSessionStatus,
  appendMessage,
  loadMessages,
  getDraftSnapshot,
  applyToolMutation,
  CourseDraft,
} from "../Function_services.ts/course_draft_session_functions";

const MODEL = "llama-3.3-70b-versatile";
// A full course (2 modules x 2 lessons + objectives + a quiz with a few
// questions) needs ~9-10 individual tool calls even when the tutor asks for
// everything in one message. 8 rounds cut off before the model ever got to
// produce a final conversational reply — verified live: a real request for
// "2 modules, 2 lessons each" correctly built the whole draft (including
// objectives and a quiz the tutor never explicitly asked for, per the
// system prompt) but came back with an empty assistantReply because the
// loop hit the cap mid-build.
const MAX_ROUNDS = 20;
const MAX_COMPLETION_RETRIES = 2;

/**
 * Llama-3.3-70b via Groq occasionally emits a tool call in a malformed
 * text-tag format ("<function=name({...})</function>") instead of the
 * proper structured tool_calls response — Groq's own API rejects this with
 * a 400 "tool_use_failed" before it ever reaches our tool-handling code.
 * This is a known model-output-formatting flake, not a real request error,
 * so retry a couple of times (a fresh sample often succeeds) rather than
 * surfacing it as a hard failure on the first occurrence.
 */
async function createCompletionWithRetry(messages: any[]): Promise<any> {
  let lastError: any;
  for (let attempt = 0; attempt <= MAX_COMPLETION_RETRIES; attempt++) {
    try {
      return await groq.chat.completions.create({
        model: MODEL,
        messages,
        tools: getCourseDraftTools,
        tool_choice: "auto",
        temperature: 0.4,
      });
    } catch (error: any) {
      lastError = error;
      // groq-sdk's APIError wraps the API's own JSON body one level deeper
      // than it looks: error.error is the raw response body, itself shaped
      // {error: {code, message, failed_generation}} — so the real code is
      // at error.error.error.code, not error.error.code. Verified live by
      // dumping Object.keys/JSON of a real captured error; the shallower
      // check below silently never matched, so this retry never actually
      // fired despite looking like it did (the delay was just one normal
      // call, not several).
      const isToolUseFailed =
        error?.error?.error?.code === "tool_use_failed" || error?.error?.code === "tool_use_failed" || error?.code === "tool_use_failed";
      if (!isToolUseFailed || attempt === MAX_COMPLETION_RETRIES) throw error;
    }
  }
  throw lastError;
}

function summarizeDraft(draft: CourseDraft): string {
  if (!draft.course_title && draft.modules.length === 0) return "(nothing drafted yet)";
  const lines: string[] = [];
  if (draft.course_title) lines.push(`Title: ${draft.course_title}`);
  if (draft.course_level) lines.push(`Level: ${draft.course_level}`);
  for (const m of draft.modules) {
    lines.push(`Module [${m.id}] "${m.module_title}" — ${m.lessons.length} lesson(s): ${m.lessons.map((l) => l.lesson_title).join(", ") || "(none yet)"}`);
  }
  if (draft.materials.length) lines.push(`Materials: ${draft.materials.map((mm) => mm.material_title).join(", ")}`);
  for (const q of draft.quizzes) {
    lines.push(`Quiz [${q.id}] "${q.title}" — ${q.questions.length} question(s)`);
  }
  lines.push(`Objectives set: ${draft.objectives ? "yes" : "no"}`);
  return lines.join("\n");
}

/** Reconstructs the Groq messages[] array from persisted CourseDraftMessage rows. */
async function buildMessages(sessionId: string, tutorName: string): Promise<any[]> {
  const draft = await getDraftSnapshot(sessionId);
  const history = await loadMessages(sessionId);

  const messages: any[] = [
    { role: "system", content: COURSE_DRAFT_SYSTEM_PROMPT(tutorName, summarizeDraft(draft)) },
  ];

  for (const m of history) {
    if (m.role === "tool") {
      messages.push({ role: "tool", tool_call_id: m.toolCallId, name: m.toolName, content: m.content ?? "" });
    } else if (m.role === "assistant" && m.toolArgs) {
      // an assistant turn that made tool call(s) — toolArgs stores the full tool_calls array
      messages.push({ role: "assistant", content: m.content, tool_calls: m.toolArgs });
    } else {
      messages.push({ role: m.role, content: m.content ?? "" });
    }
  }

  return messages;
}

interface TurnResult {
  sessionId: string;
  assistantReply: string;
  draft: CourseDraft;
  status: string;
}

/** Runs the bounded tool-calling loop for one user turn. Persists every message as it happens. */
async function runTurn(sessionId: string, tutorName: string): Promise<TurnResult> {
  emitProgress(sessionId, "thinking", {});
  let messages = await buildMessages(sessionId, tutorName);
  let finalText = "";
  let round = 0;

  while (round < MAX_ROUNDS) {
    const response = await createCompletionWithRetry(messages);

    const message = response.choices[0].message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      finalText = message.content || "";
      await appendMessage(sessionId, { role: "assistant", content: finalText });
      break;
    }

    // Persist the assistant's tool-call message so it can be reconstructed next turn.
    await appendMessage(sessionId, {
      role: "assistant",
      content: message.content ?? null,
      toolName: message.tool_calls[0]?.function?.name,
      toolArgs: message.tool_calls as any,
    });
    messages.push(message);

    let readyForReview = false;

    for (const toolCall of message.tool_calls) {
      let args: any = {};
      try {
        args = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        // malformed tool-call arguments — feed the parse failure back to the model
        // rather than crashing the turn, so it can retry with valid JSON.
      }

      emitProgress(sessionId, "tool_call", { tool: toolCall.function.name, args });

      let result: any;
      try {
        result = await applyToolMutation(sessionId, toolCall.function.name, args);
      } catch (error: any) {
        result = { ok: false, error: error.message };
      }

      if (result?.draftSnapshot) {
        emitProgress(sessionId, "draft_updated", { draft: result.draftSnapshot });
      }

      const toolResultMessage = { role: "tool", tool_call_id: toolCall.id, name: toolCall.function.name, content: JSON.stringify(result) };
      await appendMessage(sessionId, {
        role: "tool",
        content: toolResultMessage.content,
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
      });
      messages.push(toolResultMessage);

      if (toolCall.function.name === "mark_ready_for_review" && result?.ok) {
        emitProgress(sessionId, "awaiting_approval", { summary: args.summary });
        finalText = args.summary || "Your course draft is ready for your review!";
        readyForReview = true;
      }
    }

    // mark_ready_for_review is a terminal signal, not a step to keep building
    // on — without this break the model has nothing left to do but repeat
    // the whole build again (verified live: it re-ran the full set_course_overview
    // -> add_module -> add_lesson -> set_objectives -> mark_ready_for_review
    // sequence three times in a row, creating duplicate modules/lessons,
    // before finally issuing a stray remove_module near the round cap).
    if (readyForReview) {
      await appendMessage(sessionId, { role: "assistant", content: finalText });
      break;
    }

    round++;
  }

  const draft = await getDraftSnapshot(sessionId);
  const session = await getSession(sessionId);

  if (finalText) {
    emitProgress(sessionId, "assistant_reply", { text: finalText });
  }

  return { sessionId, assistantReply: finalText, draft, status: session?.status || "ACTIVE" };
}

export class CourseDraftAIService {
  static async startSession(tutorId: string, tutorName: string, initialMessage?: string): Promise<TurnResult> {
    const session = await createSession(tutorId);

    if (!initialMessage) {
      await appendMessage(session.id, { role: "assistant", content: COURSE_DRAFT_WELCOME_MESSAGE });
      const draft = await getDraftSnapshot(session.id);
      return { sessionId: session.id, assistantReply: COURSE_DRAFT_WELCOME_MESSAGE, draft, status: session.status };
    }

    await appendMessage(session.id, { role: "user", content: initialMessage });
    return runTurn(session.id, tutorName);
  }

  static async continueSession(sessionId: string, tutorId: string, tutorName: string, userMessage: string): Promise<TurnResult> {
    const session = await getSession(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.tutorId !== tutorId) throw new Error("This session does not belong to you");
    if (session.status !== "ACTIVE" && session.status !== "AWAITING_APPROVAL") {
      throw new Error(`Session is ${session.status.toLowerCase()} and can't be continued`);
    }

    await appendMessage(sessionId, { role: "user", content: userMessage });
    if (session.status === "AWAITING_APPROVAL") await setSessionStatus(sessionId, "ACTIVE");
    return runTurn(sessionId, tutorName);
  }

  static async getSessionState(sessionId: string, tutorId: string) {
    const session = await getSession(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.tutorId !== tutorId) throw new Error("This session does not belong to you");
    const messages = await loadMessages(sessionId);
    return { session, messages, draft: session.draftJson };
  }

  static async listMySessions(tutorId: string) {
    return listSessions(tutorId);
  }

  static async abandonSession(sessionId: string, tutorId: string) {
    const session = await getSession(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.tutorId !== tutorId) throw new Error("This session does not belong to you");
    return setSessionStatus(sessionId, "ABANDONED");
  }
}
