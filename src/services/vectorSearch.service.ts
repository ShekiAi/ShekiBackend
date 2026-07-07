// src/services/vectorSearch.service.ts

import qdrant from "../lib/qdrant";
import { EmbeddingService } from "./embedding.service";

export interface SearchResult {
  type: "course" | "group" | "event" | "mentor";
  id: string;
  title: string;
  description: string;
  score: number;
}

export class VectorSearchService {

  static async search(
    query: string,
    limit: number = 3
  ): Promise<SearchResult[]> {

    // 1. Embed the user's query
    const queryVector = await EmbeddingService.embed(query);

    // 2. Search all four Qdrant collections in parallel
    const [courses, groups, events, mentors] = await Promise.all([
      qdrant.search("courses", {
        vector: queryVector,
        limit,
        with_payload: true,
        score_threshold: 0.5, // only return relevant results
      }),
      qdrant.search("groups", {
        vector: queryVector,
        limit,
        with_payload: true,
        score_threshold: 0.5,
      }),
      qdrant.search("events", {
        vector: queryVector,
        limit,
        with_payload: true,
        score_threshold: 0.5,
      }),
      qdrant.search("mentors", {
        vector: queryVector,
        limit,
        with_payload: true,
        score_threshold: 0.5,
      }),
    ]);

    // 3. Map results with type tags
    const tag = (
      results: any[],
      type: SearchResult["type"]
    ): SearchResult[] =>
      results.map((r) => ({
        type,
        id: r.payload?.originalId as string,
        title: r.payload?.title as string,
        description: r.payload?.description as string,
        score: r.score,
      }));

    const all = [
      ...tag(courses, "course"),
      ...tag(groups,  "group"),
      ...tag(events,  "event"),
      ...tag(mentors, "mentor"),
    ];

    // 4. Sort by score and return top results
    return all
      .filter((r) => r.id) // safety — drop any missing IDs
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }
}