"use strict";
// src/services/vectorSearch.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorSearchService = void 0;
const qdrant_1 = __importDefault(require("../lib/qdrant"));
const embedding_service_1 = require("./embedding.service");
class VectorSearchService {
    static async search(query, limit = 3) {
        // 1. Embed the user's query
        const queryVector = await embedding_service_1.EmbeddingService.embed(query);
        // 2. Search all four Qdrant collections in parallel
        const [courses, groups, events, mentors] = await Promise.all([
            qdrant_1.default.search("courses", {
                vector: queryVector,
                limit,
                with_payload: true,
                score_threshold: 0.5, // only return relevant results
            }),
            qdrant_1.default.search("groups", {
                vector: queryVector,
                limit,
                with_payload: true,
                score_threshold: 0.5,
            }),
            qdrant_1.default.search("events", {
                vector: queryVector,
                limit,
                with_payload: true,
                score_threshold: 0.5,
            }),
            qdrant_1.default.search("mentors", {
                vector: queryVector,
                limit,
                with_payload: true,
                score_threshold: 0.5,
            }),
        ]);
        // 3. Map results with type tags
        const tag = (results, type) => results.map((r) => ({
            type,
            id: r.payload?.originalId,
            title: r.payload?.title,
            description: r.payload?.description,
            score: r.score,
        }));
        const all = [
            ...tag(courses, "course"),
            ...tag(groups, "group"),
            ...tag(events, "event"),
            ...tag(mentors, "mentor"),
        ];
        // 4. Sort by score and return top results
        return all
            .filter((r) => r.id) // safety — drop any missing IDs
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    }
}
exports.VectorSearchService = VectorSearchService;
//# sourceMappingURL=vectorSearch.service.js.map