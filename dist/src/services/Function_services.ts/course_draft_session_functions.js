"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDraftCompleteness = checkDraftCompleteness;
exports.emptyDraft = emptyDraft;
exports.createSession = createSession;
exports.getSession = getSession;
exports.listSessions = listSessions;
exports.setSessionStatus = setSessionStatus;
exports.appendMessage = appendMessage;
exports.loadMessages = loadMessages;
exports.getDraftSnapshot = getDraftSnapshot;
exports.applyToolMutation = applyToolMutation;
// services/Function_services.ts/course_draft_session_functions.ts
//
// Plain persistence + draft-mutation functions backing the course-draft
// tool-calling loop. Mirrors this codebase's existing convention (see
// user_function.ts) of thin, direct Prisma-wrapping async functions.
const crypto_1 = require("crypto");
const db_1 = require("../../db");
/**
 * Structural completeness — separate from anything the model "feels" is
 * done. Shared by mark_ready_for_review (blocks the status transition so
 * the model has to go back and fill gaps) and finalizeDraftToCourse
 * (defense-in-depth: refuses to persist an incomplete draft even if it
 * somehow reached AWAITING_APPROVAL some other way).
 */
function checkDraftCompleteness(draft) {
    const problems = [];
    if (!draft.course_title)
        problems.push("course_title is missing");
    if (draft.modules.length === 0) {
        problems.push("at least one module is required");
    }
    else {
        for (const m of draft.modules) {
            if (m.lessons.length === 0)
                problems.push(`module "${m.module_title}" has no lessons yet`);
        }
    }
    if (!draft.objectives) {
        problems.push("objectives have not been set (all 5 are required)");
    }
    else {
        for (const key of ["objective_title1", "objective_title2", "objective_title3", "objective_title4", "objective_title5"]) {
            if (!draft.objectives[key])
                problems.push(`objectives.${key} is missing`);
        }
    }
    for (const q of draft.quizzes) {
        if (q.questions.length === 0)
            problems.push(`quiz "${q.title}" has no questions yet`);
    }
    return problems;
}
function emptyDraft() {
    return {
        modules: [],
        materials: [],
        quizzes: [],
        _nextIds: { module: 1, lesson: 1, material: 1, quiz: 1, question: 1 },
    };
}
async function createSession(tutorId) {
    return db_1.prisma.courseDraftSession.create({
        data: {
            id: (0, crypto_1.randomUUID)(),
            tutorId,
            status: "ACTIVE",
            draftJson: emptyDraft(),
            updatedAt: new Date(),
        },
    });
}
async function getSession(sessionId) {
    return db_1.prisma.courseDraftSession.findUnique({ where: { id: sessionId } });
}
async function listSessions(tutorId) {
    return db_1.prisma.courseDraftSession.findMany({
        where: { tutorId },
        orderBy: { lastActivityAt: "desc" },
    });
}
async function setSessionStatus(sessionId, status) {
    return db_1.prisma.courseDraftSession.update({
        where: { id: sessionId },
        data: { status, lastActivityAt: new Date(), updatedAt: new Date() },
    });
}
async function appendMessage(sessionId, message) {
    await db_1.prisma.courseDraftSession.update({
        where: { id: sessionId },
        data: { lastActivityAt: new Date(), updatedAt: new Date() },
    });
    return db_1.prisma.courseDraftMessage.create({
        data: {
            id: (0, crypto_1.randomUUID)(),
            sessionId,
            role: message.role,
            content: message.content ?? null,
            toolCallId: message.toolCallId,
            toolName: message.toolName,
            toolArgs: message.toolArgs,
            audioUrl: message.audioUrl,
        },
    });
}
async function loadMessages(sessionId) {
    return db_1.prisma.courseDraftMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
    });
}
async function getDraftSnapshot(sessionId) {
    const session = await db_1.prisma.courseDraftSession.findUniqueOrThrow({ where: { id: sessionId } });
    return session.draftJson;
}
async function saveDraft(sessionId, draft) {
    await db_1.prisma.courseDraftSession.update({
        where: { id: sessionId },
        data: { draftJson: draft, lastActivityAt: new Date(), updatedAt: new Date() },
    });
}
/**
 * Applies one tool call to a session's draft and returns the result that
 * should be fed back to the model as the tool's output. Every mutation is
 * read-modify-write against the session row directly — safe for this
 * feature's access pattern (one tutor, one active conversation at a time),
 * not designed for concurrent writers to the same session.
 */
async function applyToolMutation(sessionId, toolName, args) {
    const draft = await getDraftSnapshot(sessionId);
    switch (toolName) {
        case "set_course_overview": {
            draft.course_title = args.course_title ?? draft.course_title;
            draft.course_short_description = args.course_short_description ?? draft.course_short_description;
            draft.course_description = args.course_description ?? draft.course_description;
            draft.course_level = args.course_level ?? draft.course_level;
            await saveDraft(sessionId, draft);
            return { ok: true, draftSnapshot: draft };
        }
        case "add_module": {
            const id = `m${draft._nextIds.module++}`;
            draft.modules.push({
                id,
                module_title: args.module_title,
                module_description: args.module_description,
                module_duration: args.module_duration,
                order: args.order ?? draft.modules.length,
                lessons: [],
            });
            await saveDraft(sessionId, draft);
            return { ok: true, moduleDraftId: id, draftSnapshot: draft };
        }
        case "update_module": {
            const module_ = draft.modules.find((m) => m.id === args.moduleDraftId);
            if (!module_)
                return { ok: false, error: `No module with id ${args.moduleDraftId}` };
            if (args.module_title !== undefined)
                module_.module_title = args.module_title;
            if (args.module_description !== undefined)
                module_.module_description = args.module_description;
            if (args.module_duration !== undefined)
                module_.module_duration = args.module_duration;
            if (args.order !== undefined)
                module_.order = args.order;
            await saveDraft(sessionId, draft);
            return { ok: true, draftSnapshot: draft };
        }
        case "add_lesson": {
            const module_ = draft.modules.find((m) => m.id === args.moduleDraftId);
            if (!module_)
                return { ok: false, error: `No module with id ${args.moduleDraftId}` };
            const id = `l${draft._nextIds.lesson++}`;
            module_.lessons.push({
                id,
                lesson_title: args.lesson_title,
                suggested_video_brief: args.suggested_video_brief,
                duration: args.duration,
                order: args.order ?? module_.lessons.length,
            });
            await saveDraft(sessionId, draft);
            return { ok: true, lessonDraftId: id, draftSnapshot: draft };
        }
        case "add_material": {
            const id = `mat${draft._nextIds.material++}`;
            draft.materials.push({
                id,
                material_title: args.material_title,
                material_description: args.material_description,
                material_pages: args.material_pages,
                suggested_content_brief: args.suggested_content_brief,
            });
            await saveDraft(sessionId, draft);
            return { ok: true, materialDraftId: id, draftSnapshot: draft };
        }
        case "set_objectives": {
            draft.objectives = {
                objective_title1: args.objective_title1,
                objective_title2: args.objective_title2,
                objective_title3: args.objective_title3,
                objective_title4: args.objective_title4,
                objective_title5: args.objective_title5,
            };
            await saveDraft(sessionId, draft);
            return { ok: true, draftSnapshot: draft };
        }
        case "add_quiz": {
            const id = `q${draft._nextIds.quiz++}`;
            draft.quizzes.push({
                id,
                title: args.title,
                description: args.description,
                duration: args.duration,
                passingScore: args.passingScore,
                maxAttempts: args.maxAttempts,
                questions: [],
            });
            await saveDraft(sessionId, draft);
            return { ok: true, quizDraftId: id, draftSnapshot: draft };
        }
        case "add_quiz_question": {
            const quiz = draft.quizzes.find((q) => q.id === args.quizDraftId);
            if (!quiz)
                return { ok: false, error: `No quiz with id ${args.quizDraftId}` };
            const id = `qq${draft._nextIds.question++}`;
            quiz.questions.push({
                id,
                question: args.question,
                options: args.options,
                correctAnswer: args.correctAnswer,
                explanation: args.explanation,
                points: args.points,
                order: args.order ?? quiz.questions.length,
            });
            await saveDraft(sessionId, draft);
            return { ok: true, questionDraftId: id, draftSnapshot: draft };
        }
        case "remove_module": {
            draft.modules = draft.modules.filter((m) => m.id !== args.moduleDraftId);
            await saveDraft(sessionId, draft);
            return { ok: true, draftSnapshot: draft };
        }
        case "remove_lesson": {
            const module_ = draft.modules.find((m) => m.id === args.moduleDraftId);
            if (module_)
                module_.lessons = module_.lessons.filter((l) => l.id !== args.lessonDraftId);
            await saveDraft(sessionId, draft);
            return { ok: true, draftSnapshot: draft };
        }
        case "remove_quiz_question": {
            const quiz = draft.quizzes.find((q) => q.id === args.quizDraftId);
            if (quiz)
                quiz.questions = quiz.questions.filter((q) => q.id !== args.questionDraftId);
            await saveDraft(sessionId, draft);
            return { ok: true, draftSnapshot: draft };
        }
        case "get_draft_snapshot": {
            return { ok: true, draftSnapshot: draft };
        }
        case "mark_ready_for_review": {
            const problems = checkDraftCompleteness(draft);
            if (problems.length > 0) {
                return { ok: false, error: `Not ready yet — still missing: ${problems.join("; ")}`, draftSnapshot: draft };
            }
            await setSessionStatus(sessionId, "AWAITING_APPROVAL");
            return { ok: true, summary: args.summary, draftSnapshot: draft };
        }
        default:
            return { ok: false, error: `Unknown tool: ${toolName}` };
    }
}
//# sourceMappingURL=course_draft_session_functions.js.map