// services/AI_Services/mentor_match_ai_service.ts
import { groq } from "../../utils/groq_admin/groq";
import { getMentorMatchTools } from "../../utils/tools/mentor_match_tools";
import { MENTOR_MATCH_SYSTEM_PROMPT, MENTOR_MATCH_WELCOME_MESSAGE } from "../../utils/prompt/prompt";
import { emitProgress } from "../../realtime/progressEmitter";
import { applyMentorMatchToolMutation, MentorMatchState, emptyMentorMatchState } from "../Function_services.ts/mentor_match_functions";
import { randomUUID } from "crypto";
import { createSession, getSession, listSessions, setSessionStatus, appendMessage, loadMessages } from "../Function_services.ts/course_draft_session_functions";

const MODEL = "llama-3.3-70b-versatile";
const MAX_ROUNDS = 10; // matching needs far fewer tool calls than a full course build
const MAX_COMPLETION_RETRIES = 2;

// Llama-3.3-70b via Groq sometimes lapses into an alternate native
// tool-call syntax Meta's own models were trained on —
// `<function=name{args}</function>` — which Groq's API itself rejects as
// tool_use_failed before it ever reaches application code. As a second
// line of defense beyond retrying, parse the rejected generation and
// recover the real tool call directly rather than losing the turn.
//
// NOTE: groq-sdk's APIError nests the API's own JSON body one level
// deeper than it looks — error.error is the raw response body, itself
// shaped {error: {code, message, failed_generation}} — so the real
// fields live at error.error.error.*, not error.error.*. Verified live by
// dumping a captured error's actual JSON; a shallower check here (or in
// the retry-detection below) silently never matches.
function tryRecoverMalformedToolCall(error: any): any | null {
  const raw: string = error?.error?.error?.failed_generation || error?.error?.failed_generation || error?.failed_generation || "";
  const match = raw.match(/<function=([a-zA-Z_][\w]*)\s*(\{[\s\S]*?\})\s*<\/function>/);
  if (!match) return null;

  const [, name, argsJson] = match;
  try {
    JSON.parse(argsJson); // validate before trusting it
  } catch {
    return null;
  }

  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [{ id: `call_${randomUUID()}`, type: "function", function: { name, arguments: argsJson } }],
        },
      },
    ],
  };
}

async function createCompletionWithRetry(messages: any[]): Promise<any> {
  let lastError: any;
  for (let attempt = 0; attempt <= MAX_COMPLETION_RETRIES; attempt++) {
    try {
      return await groq.chat.completions.create({
        model: MODEL,
        messages,
        tools: getMentorMatchTools,
        tool_choice: "auto",
        temperature: 0.4,
      });
    } catch (error: any) {
      lastError = error;
      const isToolUseFailed =
        error?.error?.error?.code === "tool_use_failed" || error?.error?.code === "tool_use_failed" || error?.code === "tool_use_failed";
      if (!isToolUseFailed) throw error;

      const recovered = tryRecoverMalformedToolCall(error);
      if (recovered) return recovered;

      if (attempt === MAX_COMPLETION_RETRIES) throw error;
    }
  }
  throw lastError;
}

function summarizeState(state: MentorMatchState): string {
  if (!state.studentQuery) return "(nothing shared yet)";
  const lines: string[] = [`Looking for: ${state.studentQuery}`];
  if (state.candidates?.length) {
    lines.push(`Last search found: ${state.candidates.map((c) => c.name).join(", ")}`);
  }
  if (state.matchedTutor) lines.push(`Matched with: ${state.matchedTutor.name} — ${state.matchedTutor.reason}`);
  if (state.noMatchReason) lines.push(`No match found: ${state.noMatchReason}`);
  return lines.join("\n");
}

async function getDraftSnapshotGeneric(sessionId: string): Promise<MentorMatchState> {
  const session = await getSession(sessionId);
  return (session?.draftJson as unknown as MentorMatchState) ?? emptyMentorMatchState();
}

async function buildMessages(sessionId: string, studentName: string): Promise<any[]> {
  const state = await getDraftSnapshotGeneric(sessionId);
  const history = await loadMessages(sessionId);

  const messages: any[] = [{ role: "system", content: MENTOR_MATCH_SYSTEM_PROMPT(studentName, summarizeState(state)) }];

  for (const m of history) {
    if (m.role === "tool") {
      messages.push({ role: "tool", tool_call_id: m.toolCallId, name: m.toolName, content: m.content ?? "" });
    } else if (m.role === "assistant" && m.toolArgs) {
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
  state: MentorMatchState;
  status: string;
  matchedTutor?: { id: string; name: string; reason: string };
}

async function runTurn(sessionId: string, studentName: string): Promise<TurnResult> {
  emitProgress(sessionId, "thinking", {});
  let messages = await buildMessages(sessionId, studentName);
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

    await appendMessage(sessionId, {
      role: "assistant",
      content: message.content ?? null,
      toolName: message.tool_calls[0]?.function?.name,
      toolArgs: message.tool_calls as any,
    });
    messages.push(message);

    let terminal = false;

    for (const toolCall of message.tool_calls) {
      let args: any = {};
      try {
        args = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        // malformed args — fed back to the model via the tool result below
      }

      emitProgress(sessionId, "tool_call", { tool: toolCall.function.name, args });

      let result: any;
      try {
        result = await applyMentorMatchToolMutation(sessionId, toolCall.function.name, args);
      } catch (error: any) {
        result = { ok: false, error: error.message };
      }

      if (result?.draftSnapshot) {
        emitProgress(sessionId, "draft_updated", { state: result.draftSnapshot });
      }

      const toolResultMessage = { role: "tool", tool_call_id: toolCall.id, name: toolCall.function.name, content: JSON.stringify(result) };
      await appendMessage(sessionId, {
        role: "tool",
        content: toolResultMessage.content,
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
      });
      messages.push(toolResultMessage);

      // Both propose_match and no_suitable_tutor_found are terminal, same
      // reasoning as course-drafting's mark_ready_for_review: without
      // stopping here the model just keeps calling tools with nothing left
      // to usefully do.
      if (toolCall.function.name === "propose_match" && result?.ok) {
        await setSessionStatus(sessionId, "MATCHED");
        finalText = `I think ${result.matchedTutor.name} would be a great fit — ${result.matchedTutor.reason} I've let them know, and you can start chatting with them now!`;
        terminal = true;
      } else if (toolCall.function.name === "no_suitable_tutor_found" && result?.ok) {
        await setSessionStatus(sessionId, "NO_MATCH");
        finalText = args.reason || "I wasn't able to find a good match just yet — feel free to tell me more, or check back later.";
        terminal = true;
      }
    }

    if (terminal) {
      await appendMessage(sessionId, { role: "assistant", content: finalText });
      break;
    }

    round++;
  }

  const state = await getDraftSnapshotGeneric(sessionId);
  const session = await getSession(sessionId);

  if (finalText) {
    emitProgress(sessionId, "assistant_reply", { text: finalText });
  }

  return { sessionId, assistantReply: finalText, state, status: session?.status || "ACTIVE", matchedTutor: state.matchedTutor };
}

export class MentorMatchAIService {
  static async startSession(studentId: string, studentName: string, initialMessage?: string): Promise<TurnResult> {
    const session = await createSession(studentId, "mentor_match", emptyMentorMatchState());

    if (!initialMessage) {
      await appendMessage(session.id, { role: "assistant", content: MENTOR_MATCH_WELCOME_MESSAGE });
      return { sessionId: session.id, assistantReply: MENTOR_MATCH_WELCOME_MESSAGE, state: emptyMentorMatchState(), status: session.status };
    }

    await appendMessage(session.id, { role: "user", content: initialMessage });
    return runTurn(session.id, studentName);
  }

  static async continueSession(sessionId: string, studentId: string, studentName: string, userMessage: string): Promise<TurnResult> {
    const session = await getSession(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.tutorId !== studentId) throw new Error("This session does not belong to you");
    if (session.status !== "ACTIVE") {
      throw new Error(`This conversation is ${session.status.toLowerCase()} and can't be continued`);
    }

    await appendMessage(sessionId, { role: "user", content: userMessage });
    return runTurn(sessionId, studentName);
  }

  static async getSessionState(sessionId: string, studentId: string) {
    const session = await getSession(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.tutorId !== studentId) throw new Error("This session does not belong to you");
    const messages = await loadMessages(sessionId);
    return { session, messages, state: session.draftJson };
  }

  static async listMySessions(studentId: string) {
    return listSessions(studentId, "mentor_match");
  }

  static async abandonSession(sessionId: string, studentId: string) {
    const session = await getSession(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.tutorId !== studentId) throw new Error("This session does not belong to you");
    return setSessionStatus(sessionId, "ABANDONED");
  }
}
