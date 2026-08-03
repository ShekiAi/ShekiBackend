// services/Function_services.ts/mentor_match_functions.ts
//
// No structured "subject"/"expertise" field exists on User or Course in the
// shared schema — matching is done by feeding the AI each tutor's bio plus
// the titles/descriptions of courses they've authored, and letting it
// reason over that free text rather than a rigid taxonomy.
import { prisma } from "../../db";

export interface MentorMatchState {
  studentQuery?: string;
  candidates?: { id: string; name: string; bio: string | null; church_role: string | null; courseTopics: string[] }[];
  matchedTutor?: { id: string; name: string; reason: string };
  noMatchReason?: string;
}

export function emptyMentorMatchState(): MentorMatchState {
  return {};
}

async function getState(sessionId: string): Promise<MentorMatchState> {
  const session = await prisma.courseDraftSession.findUniqueOrThrow({ where: { id: sessionId } });
  return (session.draftJson as unknown as MentorMatchState) ?? {};
}

async function saveState(sessionId: string, state: MentorMatchState) {
  await prisma.courseDraftSession.update({
    where: { id: sessionId },
    data: { draftJson: state as any, lastActivityAt: new Date(), updatedAt: new Date() },
  });
}

export async function applyMentorMatchToolMutation(sessionId: string, toolName: string, args: any): Promise<any> {
  const state = await getState(sessionId);

  switch (toolName) {
    case "search_tutors": {
      const tutors = await prisma.user.findMany({
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
      const tutor = await prisma.user.findUnique({
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
