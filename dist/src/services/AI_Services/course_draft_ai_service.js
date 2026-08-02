"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseDraftAIService = void 0;
// services/AI_Services/course_draft_ai_service.ts
const groq_1 = require("../../utils/groq_admin/groq");
const course_draft_tools_1 = require("../../utils/tools/course_draft_tools");
const prompt_1 = require("../../utils/prompt/prompt");
const progressEmitter_1 = require("../../realtime/progressEmitter");
const course_draft_session_functions_1 = require("../Function_services.ts/course_draft_session_functions");
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
async function createCompletionWithRetry(messages) {
    let lastError;
    for (let attempt = 0; attempt <= MAX_COMPLETION_RETRIES; attempt++) {
        try {
            return await groq_1.groq.chat.completions.create({
                model: MODEL,
                messages,
                tools: course_draft_tools_1.getCourseDraftTools,
                tool_choice: "auto",
                temperature: 0.4,
            });
        }
        catch (error) {
            lastError = error;
            const isToolUseFailed = error?.error?.code === "tool_use_failed" || error?.code === "tool_use_failed";
            if (!isToolUseFailed || attempt === MAX_COMPLETION_RETRIES)
                throw error;
        }
    }
    throw lastError;
}
function summarizeDraft(draft) {
    if (!draft.course_title && draft.modules.length === 0)
        return "(nothing drafted yet)";
    const lines = [];
    if (draft.course_title)
        lines.push(`Title: ${draft.course_title}`);
    if (draft.course_level)
        lines.push(`Level: ${draft.course_level}`);
    for (const m of draft.modules) {
        lines.push(`Module [${m.id}] "${m.module_title}" — ${m.lessons.length} lesson(s): ${m.lessons.map((l) => l.lesson_title).join(", ") || "(none yet)"}`);
    }
    if (draft.materials.length)
        lines.push(`Materials: ${draft.materials.map((mm) => mm.material_title).join(", ")}`);
    for (const q of draft.quizzes) {
        lines.push(`Quiz [${q.id}] "${q.title}" — ${q.questions.length} question(s)`);
    }
    lines.push(`Objectives set: ${draft.objectives ? "yes" : "no"}`);
    return lines.join("\n");
}
/** Reconstructs the Groq messages[] array from persisted CourseDraftMessage rows. */
async function buildMessages(sessionId, tutorName) {
    const draft = await (0, course_draft_session_functions_1.getDraftSnapshot)(sessionId);
    const history = await (0, course_draft_session_functions_1.loadMessages)(sessionId);
    const messages = [
        { role: "system", content: (0, prompt_1.COURSE_DRAFT_SYSTEM_PROMPT)(tutorName, summarizeDraft(draft)) },
    ];
    for (const m of history) {
        if (m.role === "tool") {
            messages.push({ role: "tool", tool_call_id: m.toolCallId, name: m.toolName, content: m.content ?? "" });
        }
        else if (m.role === "assistant" && m.toolArgs) {
            // an assistant turn that made tool call(s) — toolArgs stores the full tool_calls array
            messages.push({ role: "assistant", content: m.content, tool_calls: m.toolArgs });
        }
        else {
            messages.push({ role: m.role, content: m.content ?? "" });
        }
    }
    return messages;
}
/** Runs the bounded tool-calling loop for one user turn. Persists every message as it happens. */
async function runTurn(sessionId, tutorName) {
    (0, progressEmitter_1.emitProgress)(sessionId, "thinking", {});
    let messages = await buildMessages(sessionId, tutorName);
    let finalText = "";
    let round = 0;
    while (round < MAX_ROUNDS) {
        const response = await createCompletionWithRetry(messages);
        const message = response.choices[0].message;
        if (!message.tool_calls || message.tool_calls.length === 0) {
            finalText = message.content || "";
            await (0, course_draft_session_functions_1.appendMessage)(sessionId, { role: "assistant", content: finalText });
            break;
        }
        // Persist the assistant's tool-call message so it can be reconstructed next turn.
        await (0, course_draft_session_functions_1.appendMessage)(sessionId, {
            role: "assistant",
            content: message.content ?? null,
            toolName: message.tool_calls[0]?.function?.name,
            toolArgs: message.tool_calls,
        });
        messages.push(message);
        let readyForReview = false;
        for (const toolCall of message.tool_calls) {
            let args = {};
            try {
                args = JSON.parse(toolCall.function.arguments || "{}");
            }
            catch {
                // malformed tool-call arguments — feed the parse failure back to the model
                // rather than crashing the turn, so it can retry with valid JSON.
            }
            (0, progressEmitter_1.emitProgress)(sessionId, "tool_call", { tool: toolCall.function.name, args });
            let result;
            try {
                result = await (0, course_draft_session_functions_1.applyToolMutation)(sessionId, toolCall.function.name, args);
            }
            catch (error) {
                result = { ok: false, error: error.message };
            }
            if (result?.draftSnapshot) {
                (0, progressEmitter_1.emitProgress)(sessionId, "draft_updated", { draft: result.draftSnapshot });
            }
            const toolResultMessage = { role: "tool", tool_call_id: toolCall.id, name: toolCall.function.name, content: JSON.stringify(result) };
            await (0, course_draft_session_functions_1.appendMessage)(sessionId, {
                role: "tool",
                content: toolResultMessage.content,
                toolCallId: toolCall.id,
                toolName: toolCall.function.name,
            });
            messages.push(toolResultMessage);
            if (toolCall.function.name === "mark_ready_for_review" && result?.ok) {
                (0, progressEmitter_1.emitProgress)(sessionId, "awaiting_approval", { summary: args.summary });
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
            await (0, course_draft_session_functions_1.appendMessage)(sessionId, { role: "assistant", content: finalText });
            break;
        }
        round++;
    }
    const draft = await (0, course_draft_session_functions_1.getDraftSnapshot)(sessionId);
    const session = await (0, course_draft_session_functions_1.getSession)(sessionId);
    if (finalText) {
        (0, progressEmitter_1.emitProgress)(sessionId, "assistant_reply", { text: finalText });
    }
    return { sessionId, assistantReply: finalText, draft, status: session?.status || "ACTIVE" };
}
class CourseDraftAIService {
    static async startSession(tutorId, tutorName, initialMessage) {
        const session = await (0, course_draft_session_functions_1.createSession)(tutorId);
        if (!initialMessage) {
            await (0, course_draft_session_functions_1.appendMessage)(session.id, { role: "assistant", content: prompt_1.COURSE_DRAFT_WELCOME_MESSAGE });
            const draft = await (0, course_draft_session_functions_1.getDraftSnapshot)(session.id);
            return { sessionId: session.id, assistantReply: prompt_1.COURSE_DRAFT_WELCOME_MESSAGE, draft, status: session.status };
        }
        await (0, course_draft_session_functions_1.appendMessage)(session.id, { role: "user", content: initialMessage });
        return runTurn(session.id, tutorName);
    }
    static async continueSession(sessionId, tutorId, tutorName, userMessage) {
        const session = await (0, course_draft_session_functions_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found");
        if (session.tutorId !== tutorId)
            throw new Error("This session does not belong to you");
        if (session.status !== "ACTIVE" && session.status !== "AWAITING_APPROVAL") {
            throw new Error(`Session is ${session.status.toLowerCase()} and can't be continued`);
        }
        await (0, course_draft_session_functions_1.appendMessage)(sessionId, { role: "user", content: userMessage });
        if (session.status === "AWAITING_APPROVAL")
            await (0, course_draft_session_functions_1.setSessionStatus)(sessionId, "ACTIVE");
        return runTurn(sessionId, tutorName);
    }
    static async getSessionState(sessionId, tutorId) {
        const session = await (0, course_draft_session_functions_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found");
        if (session.tutorId !== tutorId)
            throw new Error("This session does not belong to you");
        const messages = await (0, course_draft_session_functions_1.loadMessages)(sessionId);
        return { session, messages, draft: session.draftJson };
    }
    static async listMySessions(tutorId) {
        return (0, course_draft_session_functions_1.listSessions)(tutorId);
    }
    static async abandonSession(sessionId, tutorId) {
        const session = await (0, course_draft_session_functions_1.getSession)(sessionId);
        if (!session)
            throw new Error("Session not found");
        if (session.tutorId !== tutorId)
            throw new Error("This session does not belong to you");
        return (0, course_draft_session_functions_1.setSessionStatus)(sessionId, "ABANDONED");
    }
}
exports.CourseDraftAIService = CourseDraftAIService;
//# sourceMappingURL=course_draft_ai_service.js.map