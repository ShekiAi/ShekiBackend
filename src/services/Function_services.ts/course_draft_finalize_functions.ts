// services/Function_services.ts/course_draft_finalize_functions.ts
import { randomUUID } from "crypto";
import { prisma } from "../../db";
import { emitProgress } from "../../realtime/progressEmitter";
import { checkDraftCompleteness, CourseDraft } from "./course_draft_session_functions";

/**
 * Turns an approved draft into a real Course. Wrapped in a single
 * transaction so a failure partway rolls back everything rather than
 * leaving an orphaned half-created course. Lesson/Material rows are
 * deliberately NOT created here — their specs are stashed on
 * Module.pendingLessons / Course.pendingMaterials until a tutor attaches a
 * real video/document (a separate, later "attach" step, out of scope for
 * this feature).
 */
export async function finalizeDraftToCourse(sessionId: string, tutorId: string) {
  const session = await prisma.courseDraftSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found");
  if (session.tutorId !== tutorId) throw new Error("This session does not belong to you");
  if (session.status !== "AWAITING_APPROVAL") {
    throw new Error(
      `Session is "${session.status}", not "AWAITING_APPROVAL" — the assistant needs to confirm the draft is ready before it can be finalized`,
    );
  }

  const draft = session.draftJson as unknown as CourseDraft;
  const problems = checkDraftCompleteness(draft);
  if (problems.length > 0) {
    throw new Error(`Draft is incomplete, can't create the course yet: ${problems.join("; ")}`);
  }

  const now = new Date();
  emitProgress(sessionId, "saving", {});

  const courseId = await prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        id: randomUUID(),
        course_title: draft.course_title!,
        course_short_description: draft.course_short_description || "",
        course_description: draft.course_description || "",
        course_level: draft.course_level || "Beginner",
        course_image: "",
        createdBy: "ShekiAI Course Assistant",
        createdUserId: tutorId,
        status: "DRAFT",
        aiGenerated: true,
        pendingMaterials: draft.materials as any,
        updatedAt: now,
      },
    });

    for (let i = 0; i < draft.modules.length; i++) {
      const m = draft.modules[i];
      await tx.module.create({
        data: {
          id: randomUUID(),
          module_title: m.module_title,
          module_description: m.module_description,
          module_duration: m.module_duration,
          order: m.order ?? 0,
          courseId: course.id,
          pendingLessons: m.lessons as any,
          updatedAt: now,
        },
      });
      emitProgress(sessionId, "module_saved", { module_title: m.module_title, index: i });
    }

    await tx.objectives.create({
      data: {
        id: randomUUID(),
        objective_title1: draft.objectives!.objective_title1,
        objective_title2: draft.objectives!.objective_title2,
        objective_title3: draft.objectives!.objective_title3,
        objective_title4: draft.objectives!.objective_title4,
        objective_title5: draft.objectives!.objective_title5,
        courseId: course.id,
        updatedAt: now,
      },
    });

    for (const q of draft.quizzes) {
      const quiz = await tx.quizzes.create({
        data: {
          id: randomUUID(),
          title: q.title,
          description: q.description,
          duration: q.duration,
          passingScore: q.passingScore,
          maxAttempts: q.maxAttempts,
          courseId: course.id,
          updatedAt: now,
        },
      });

      for (const question of q.questions) {
        await tx.questions.create({
          data: {
            id: randomUUID(),
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            points: question.points ?? 1,
            order: question.order,
            quizId: quiz.id,
            courseId: course.id,
          },
        });
      }
    }

    await tx.courseDraftSession.update({
      where: { id: sessionId },
      data: { status: "FINALIZED", courseId: course.id, updatedAt: now },
    });

    return course.id;
  });

  await prisma.notification.create({
    data: {
      id: randomUUID(),
      title: "Course created",
      message: `Your course "${draft.course_title}" has been created as a draft. Add lesson videos and any documents to publish it.`,
      type: "course_ai_drafted",
      role: "tutor",
      to: tutorId,
      userId: tutorId,
      courseId,
    },
  });

  emitProgress(sessionId, "finalized", { courseId });

  return courseId;
}
