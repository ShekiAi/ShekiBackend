// services/AI_Services/mentor_match_ai_service.ts
import { groq } from "../../utils/groq_admin/groq";
import { getMentorMatchTools } from "../../utils/tools/mentor_match_tools";
import { MENTOR_MATCH_SYSTEM_PROMPT, MENTOR_MATCH_WELCOME_MESSAGE } from "../../utils/prompt/prompt";
import { emitProgress } from "../../realtime/progressEmitter";
import {
  containsFunctionTag,
  isToolUseFailedError,
  parseFunctionTag,
  recoverCompletionFromError,
  stripFunctionTags,
} from "../../utils/groq_admin/malformed_tool_calls";
import { applyMentorMatchToolMutation, MentorMatchState, emptyMentorMatchState } from "../Function_services.ts/mentor_match_functions";
import { createSession, getSession, listSessions, setSessionStatus, appendMessage, loadMessages } from "../Function_services.ts/course_draft_session_functions";

const MODEL = "llama-3.3-70b-versatile";
const MAX_ROUNDS = 10; // matching needs far fewer tool calls than a full course build
const MAX_COMPLETION_RETRIES = 2;

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
      if (!isToolUseFailedError(error)) throw error;

      const recovered = recoverCompletionFromError(error);
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
      // The model sometimes writes a tool call as plain prose instead of
      // calling it (Groq passes this through rather than erroring) — that raw
      // tag reached a real user's screen. Treat it as the call it meant to be.
      const leaked = parseFunctionTag(message.content);
      if (leaked) {
        message.tool_calls = [leaked];
        message.content = stripFunctionTags(message.content) || null;
      } else {
        finalText = message.content || "";
        await appendMessage(sessionId, { role: "assistant", content: finalText });
        break;
      }
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
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

  // Last line of defense: never let a malformed tool-call tag reach the UI,
  // even if it wasn't parseable enough to execute as a real call.
  if (containsFunctionTag(finalText)) {
    finalText = stripFunctionTags(finalText) || "Let me look into that for you.";
  }

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
