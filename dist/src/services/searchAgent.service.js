"use strict";
// src/services/searchAgent.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchAgentService = void 0;
const vectorSearch_service_1 = require("./vectorSearch.service");
const prompt_1 = require("../utils/prompt/prompt");
const groq_1 = require("../utils/groq_admin/groq");
class SearchAgentService {
    static async search(userQuery) {
        try {
            if (!userQuery?.trim()) {
                throw new Error("Query is required.");
            }
            // 1. Search Qdrant
            const searchResults = await vectorSearch_service_1.VectorSearchService.search(userQuery.trim());
            // 2. Build context for the AI
            const context = searchResults.length > 0
                ? `Search results from GOYE database:\n\n${JSON.stringify(searchResults, null, 2)}`
                : "No results found in the database for this query.";
            // 3. Call Groq
            const completion = await groq_1.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                temperature: 0.3,
                max_tokens: 1024,
                messages: [
                    { role: "system", content: prompt_1.SEARCH_AGENT_PROMPT },
                    { role: "user", content: `User query: "${userQuery}"\n\n${context}`
                    },
                ],
            });
            // 4. Parse and return
            const raw = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
            return {
                message: "Search completed successfully",
                data: parsed,
            };
        }
        catch (error) {
            console.error("SearchAgent error:", error);
            throw new Error(`SearchAgent error: ${error.message}`);
        }
    }
}
exports.SearchAgentService = SearchAgentService;
//# sourceMappingURL=searchAgent.service.js.map