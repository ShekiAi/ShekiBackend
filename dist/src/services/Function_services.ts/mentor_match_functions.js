"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyMentorMatchState = emptyMentorMatchState;
exports.applyMentorMatchToolMutation = applyMentorMatchToolMutation;
// services/Function_services.ts/mentor_match_functions.ts
//
// No structured "subject"/"expertise" field exists on User or Course in the
// shared schema — matching is done by feeding the AI each tutor's bio plus
// the titles/descriptions of courses they've authored, and letting it
// reason over that free text rather than a rigid taxonomy.
const db_1 = require("../../db");
function emptyMentorMatchState() {
    return {};
}
async function getState(sessionId) {
    const session = await db_1.prisma.courseDraftSession.findUniqueOrThrow({ where: { id: sessionId } });
    return session.draftJson ?? {};
}
async function saveState(sessionId, state) {
    await db_1.prisma.courseDraftSession.update({
        where: { id: sessionId },
        data: { draftJson: state, lastActivityAt: new Date(), updatedAt: new Date() },
    });
}
async function applyMentorMatchToolMutation(sessionId, toolName, args) {
    const state = await getState(sessionId);
    switch (toolName) {
        case "search_tutors": {
            const tutors = await db_1.prisma.user.findMany({
                where: { role: { in: ["tutor", "instructor"] } },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    bio: true,
                    church_role: true,
                    Course: { select: { course_title: true, course_short_description: true } },
                },
                take: 25,
            });
            const candidates = tutors.map((t) => ({
                id: t.id,
                name: `${t.first_name} ${t.last_name}`.trim(),
                bio: t.bio,
                church_role: t.church_role,
                courseTopics: t.Course.map((c) => c.course_title),
            }));
            state.studentQuery = args.query;
            state.candidates = candidates;
            await saveState(sessionId, state);
            return { ok: true, candidates, draftSnapshot: state };
        }
        case "propose_match": {
            const tutor = await db_1.prisma.user.findUnique({
                where: { id: args.tutorId },
                select: { id: true, first_name: true, last_name: true, role: true },
            });
            if (!tutor || !["tutor", "instructor"].includes(tutor.role)) {
                return { ok: false, error: "That tutorId doesn't match a real tutor — pick one from your search_tutors results.", draftSnapshot: state };
            }
            state.matchedTutor = { id: tutor.id, name: `${tutor.first_name} ${tutor.last_name}`.trim(), reason: args.reason };
            await saveState(sessionId, state);
            return { ok: true, matchedTutor: state.matchedTutor, draftSnapshot: state };
        }
        case "no_suitable_tutor_found": {
            state.noMatchReason = args.reason;
            await saveState(sessionId, state);
            return { ok: true, draftSnapshot: state };
        }
        default:
            return { ok: false, error: `Unknown tool: ${toolName}` };
    }
}
//# sourceMappingURL=mentor_match_functions.js.map