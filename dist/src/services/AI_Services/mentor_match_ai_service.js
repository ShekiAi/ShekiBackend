"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentorMatchAIService = void 0;
// services/AI_Services/mentor_match_ai_service.ts
const groq_1 = require("../../utils/groq_admin/groq");
const mentor_match_tools_1 = require("../../utils/tools/mentor_match_tools");
const prompt_1 = require("../../utils/prompt/prompt");
const progressEmitter_1 = require("../../realtime/progressEmitter");
const malformed_tool_calls_1 = require("../../utils/groq_admin/malformed_tool_calls");
const mentor_match_functions_1 = require("../Function_services.ts/mentor_match_functions");
const course_draft_session_functions_1 = require("../Function_services.ts/course_draft_session_functions");
const MODEL = "llama-3.3-70b-versatile";
const MAX_ROUNDS = 10; // matching needs far fewer tool calls than a full course build
const MAX_COMPLETION_RETRIES = 2;
async function createCompletionWithRetry(messages) {
    let lastError;
    for (let attempt = 0; attempt <= MAX_COMPLETION_RETRIES; attempt++) {
        try {
            return await groq_1.groq.chat.completions.create({
                model: MODEL,
                messages,
                tools: mentor_match_tools_1.getMentorMatchTools,
                tool_choice: "auto",
                temperature: 0.4,
            });
        }
        catch (error) {
            lastError = error;
            if (!(0, malformed_tool_calls_1.isToolUseFailedError)(error))
                throw error;
            const recovered = (0, malformed_tool_calls_1.recoverCompletionFromError)(error);
            if (recovered)
                return recovered;
            if (attempt === MAX_COMPLETION_RETRIES)
                throw error;
        }
    }
    throw lastError;
}
function summarizeState(state) {
    if (!state.studentQuery)
        return "(nothing shared yet)";
    const lines = [`Looking for: ${state.studentQuery}`];
    if (state.candidates?.length) {
        lines.push(`Last search found: ${state.candidates.map((c) => c.name).join(", ")}`);
    }
    if (state.matchedTutor)
        lines.push(`Matched with: ${state.matchedTutor.name} — ${state.matchedTutor.reason}`);
    if (state.noMatchReason)
        lines.push(`No match found: ${state.noMatchReason}`);
    return lines.join("\n");
}
async function getDraftSnapshotGeneric(sessionId) {
    const session = await (0, course_draft_session_functions_1.getSession)(sessionId);
    return session?.draftJson ?? (0, mentor_match_functions_1.emptyMentorMatchState)();
}
async function buildMessages(sessionId, studentName) {
    const state = await getDraftSnapshotGeneric(sessionId);
    const history = await (0, course_draft_session_functions_1.loadMessages)(sessionId);
    const messages = [{ role: "system", content: (0, prompt_1.MENTOR_MATCH_SYSTEM_PROMPT)(studentName, summarizeState(state)) }];
    for (const m of history) {
        if (m.role === "tool") {
            messages.push({ role: "tool", tool_call_id: m.toolCallId, name: m.toolName, content: m.content ?? "" });
        }
        else if (m.role === "assistant" && m.toolArgs) {
            messages.push({ role: "assistant", content: m.content, tool_calls: m.toolArgs });
        }
        else {
            messages.push({ role: m.role, content: m.content ?? "" });
        }
    }
    return messages;
}
async function runTurn(sessionId, studentName) {
    (0, progressEmitter_1.emitProgress)(sessionId, "thinking", {});
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
            const leaked = (0, malformed_tool_calls_1.parseFunctionTag)(message.content);
            if (leaked) {
                message.tool_calls = [leaked];
                message.content = (0, malformed_tool_calls_1.stripFunctionTags)(message.content) || null;
            }
            else {
                finalText = message.content || "";
                await (0, course_draft_session_functions_1.appendMessage)(sessionId, { role: "assistant", content: finalText });
                break;
            }
        }
        if (!message.tool_calls || message.tool_calls.length === 0) {
            break;
        }
        await (0, course_draft_session_functions_1.appendMessage)(sessionId, {
            role: "assistant",
            content: message.content ?? null,
            toolName: message.tool_calls[0]?.function?.name,
            toolArgs: message.tool_calls,
        });
        messages.push(message);
        let terminal = false;
        for (const toolCall of message.tool_calls) {
            let args = {};
            try {
                args = JSON.parse(toolCall.function.arguments || "{}");
            }
            catch {
                // malformed args — fed back to the model via the tool result below
            }
            (0, progressEmitter_1.emitProgress)(sessionId, "tool_call", { tool: toolCall.function.name, args });
            let result;
            try {
                result = await (0, mentor_match_functions_1.applyMentorMatchToolMutation)(sessionId, toolCall.function.name, args);
            }
            catch (error) {
                result = { ok: false, error: error.message };
            }
            if (result?.draftSnapshot) {
                (0, progressEmitter_1.emitProgress)(sessionId, "draft_updated", { state: result.draftSnapshot });
            }
            const toolResultMessage = { role: "tool", tool_call_id: toolCall.id, name: toolCall.function.name, content: JSON.stringify(result) };
            await (0, course_draft_session_functions_1.appendMessage)(sessionId, {
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
                await (0, course_draft_session_functions_1.setSessionStatus)(sessionId, "MATCHED");
                finalText = `I think ${result.matchedTutor.name} would be a great fit — ${result.matchedTutor.reason} I've let them know, and you can start chatting with them now!`;
                terminal = true;
            }
            else if (toolCall.function.name === "no_suitable_tutor_found" && result?.ok) {
                await (0, course_draft_session_functions_1.setSessionStatus)(sessionId, "NO_MATCH");
                finalText = args.reason || "I wasn't able to find a good match just yet — feel free to tell me more, or check back later.";
                terminal = true;
            }
        }
        if (terminal) {
            await (0, course_draft_session_functions_1.appendMessage)(sessionId, { role: "assistant", content: finalText });
            break;
        }
        round++;
    }
    const state = await getDraftSnapshotGeneric(sessionId);
    const session = await (0, course_draft_session_functions_1.getSession)(sessionId);
    // Last line of defense: never let a malformed tool-call tag reach the UI,
    // even if it wasn't parseable enough to execute as a real call.
    if ((0, malformed_tool_calls_1.containsFunctionTag)(finalText)) {
        finalText = (0, malformed_tool_calls_1.stripFunctionTags)(finalText) || "Let me look into that for you.";
    }
    if (finalText) {
        (0, progressEmitter_1.emitProgress)(sessionId, "assistant_reply", { text: finalText });
    }
    return { sessionId, assistantReply: finalText, state, status: session?.status || "ACTIVE", matchedTutor: state.matchedTutor };
}
class MentorMatchAIService {
    static async startSession(studentId, studentName, initialMessage) {
        const session = await (0, course_draft_session_functions_1.createSession)(studentId, "mentor_match", (0, mentor_match_functions_1.emptyMentorMatchState)());
        if (!initialMessage) {
            await (0, course_draft_session_functions_1.appendMessage)(session.id, { role: "assistant", content: prompt_1.MENTOR_MATCH_WELCOME_MESSAGE });
            return { sessionId: session.id, assistantReply: prompt_1.MENTOR_MATCH_WELCOME_MESSAGE, state: (0, mentor_match_functions_1.emptyMentorMatchState)(), status: session.status };
        }
        await (0, course_draft_session_functions_1.appendMessage)(session.id, { role: "user", content: initialMessage });
        return runTurn(session.id, studentName);
    }
    static async continueSession(sessionId, studentId, studentName, userMessage) {
        const session = await (0, course_draft_session_functions_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found");
        if (session.tutorId !== studentId)
            throw new Error("This session does not belong to you");
        if (session.status !== "ACTIVE") {
            throw new Error(`This conversation is ${session.status.toLowerCase()} and can't be continued`);
        }
        await (0, course_draft_session_functions_1.appendMessage)(sessionId, { role: "user", content: userMessage });
        return runTurn(sessionId, studentName);
    }
    static async getSessionState(sessionId, studentId) {
        const session = await (0, course_draft_session_functions_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found");
        if (session.tutorId !== studentId)
            throw new Error("This session does not belong to you");
        const messages = await (0, course_draft_session_functions_1.loadMessages)(sessionId);
        return { session, messages, state: session.draftJson };
    }
    static async listMySessions(studentId) {
        return (0, course_draft_session_functions_1.listSessions)(studentId, "mentor_match");
    }
    static async abandonSession(sessionId, studentId) {
        const session = await (0, course_draft_session_functions_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found");
        if (session.tutorId !== studentId)
            throw new Error("This session does not belong to you");
        return (0, course_draft_session_functions_1.setSessionStatus)(sessionId, "ABANDONED");
    }
}
exports.MentorMatchAIService = MentorMatchAIService;
//# sourceMappingURL=mentor_match_ai_service.js.map