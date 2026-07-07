// src/services/embedding.service.ts

import { prisma } from "../db";
import qdrant from "../lib/qdrant";
import { GoogleGenAI } from "@google/genai";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
export class EmbeddingService {
// src/services/embedding.service.ts

static async embed(text: string): Promise<number[]> {
  const response = await gemini.models.embedContent({
    model: "gemini-embedding-001",
    contents: text.trim(),
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: 768,
    },
  });

  // Log the full response so we can see the actual structure
  console.log("Gemini response keys:", Object.keys(response));
  console.log("Embeddings field:", JSON.stringify(response).slice(0, 200));

  // Handle both possible response shapes
  const values =
    (response as any).embedding?.values ||
    (response as any).embeddings?.[0]?.values ||
    (response as any).embeddings?.values;

  if (!values || !Array.isArray(values) || values.length === 0) {
    throw new Error(
      `Gemini returned no embedding values. Response: ${JSON.stringify(response).slice(0, 300)}`
    );
  }

  return values as number[];
}

static async upsert(
  collection: string,
  id: string,
  vector: number[],
  payload: Record<string, any>
) {
  const numericId = Math.abs(
    id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  );

  // Validate vector before sending
  if (!vector || !Array.isArray(vector) || vector.length === 0) {
    throw new Error(`Invalid vector for id ${id}: ${JSON.stringify(vector).slice(0, 100)}`);
  }

  console.log(`Upserting id=${numericId} vector length=${vector.length}`);

  await qdrant.upsert(collection, {
    wait: true,
    points: [
      {
        id: numericId,
        vector: vector, // singular — correct per Qdrant JS docs
        payload: { ...payload, originalId: id },
      },
    ],
  });
}

  // ── Embed and store a course ────────────────────────────────
  static async embedCourse(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) return;

    // Use all available text fields for richer embeddings
    const text = [
      course.course_title,
      course.course_short_description,
      course.course_description,
      course.course_level,
    ]
      .filter(Boolean)
      .join(". ");

    const vector = await this.embed(text);

    await this.upsert("courses", course.id, vector, {
      originalId: course.id,
      title: course.course_title,
      description: course.course_short_description,
    });

    console.log(`✓ Embedded course: ${course.course_title}`);
  }

  // ── Embed and store a group ─────────────────────────────────
  static async embedGroup(groupId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) return;

    const text = [
      group.group_title,
      group.group_short_description,
      group.group_description,
    ]
      .filter(Boolean)
      .join(". ");

    const vector = await this.embed(text);

    await this.upsert("groups", group.id, vector, {
      originalId: group.id,
      title: group.group_title,
      description: group.group_short_description,
    });

    console.log(`✓ Embedded group: ${group.group_title}`);
  }

  // ── Embed and store an event ────────────────────────────────
  static async embedEvent(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) return;

    const text = [event.event_name, event.event_description, event.event_type]
      .filter(Boolean)
      .join(". ");

    const vector = await this.embed(text);

    await this.upsert("events", event.id, vector, {
      originalId: event.id,
      title: event.event_name,
      description: event.event_description,
    });

    console.log(`✓ Embedded event: ${event.event_name}`);
  }

  // ── Embed and store a mentor ────────────────────────────────
  // Your User model has no bio or expertise field.
  // We use first_name, last_name, role, level, country, and
  // UserAdditionalData for organisation context.
  static async embedMentor(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserAdditionalData: true, // includes org role and type
      },
    });
    if (!user) return;

    const fullName = `${user.first_name} ${user.last_name}`;

    const text = [
      fullName,
      user.role,
      user.level,
      user.country,
      user.UserAdditionalData?.organization_name,
      user.UserAdditionalData?.organization_role,
      user.UserAdditionalData?.organization_type,
    ]
      .filter(Boolean)
      .join(". ");

    const vector = await this.embed(text);

    await this.upsert("mentors", user.id, vector, {
      originalId: user.id,
      title: fullName,
      description: [
        user.role,
        user.UserAdditionalData?.organization_role,
        user.UserAdditionalData?.organization_name,
      ]
        .filter(Boolean)
        .join(" — "),
    });

    console.log(`✓ Embedded mentor: ${fullName}`);
  }

  // ── Seed all existing data at once ──────────────────────────
  static async embedAll() {
    // For mentors — use ORGANIZATION_OWNER since that is your
    // closest equivalent to a tutor/pastor in the schema
    const [courses, groups, events, mentors] = await Promise.all([
      prisma.course.findMany(),
      prisma.group.findMany(),
      prisma.event.findMany(),
      prisma.user.findMany({
        where: {
          userType: {
            in: ["ORGANIZATION_OWNER", "INVITED_MEMBER"],
          },
        },
      }),
    ]);

    console.log(`Embedding ${courses.length} courses...`);
    for (const c of courses) await this.embedCourse(c.id);

    console.log(`Embedding ${groups.length} groups...`);
    for (const g of groups) await this.embedGroup(g.id);

    console.log(`Embedding ${events.length} events...`);
    for (const e of events) await this.embedEvent(e.id);

    console.log(`Embedding ${mentors.length} mentors...`);
    for (const m of mentors) await this.embedMentor(m.id);

    console.log("✓ All embeddings complete.");
  }
}
