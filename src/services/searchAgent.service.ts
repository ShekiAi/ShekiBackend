// src/services/searchAgent.service.ts

import { VectorSearchService } from "./vectorSearch.service";
import { SEARCH_AGENT_PROMPT } from "../utils/prompt/prompt";
import { groq } from "../utils/groq_admin/groq";


export class SearchAgentService {

  static async search(userQuery: string) {
    try {
      if (!userQuery?.trim()) {
        throw new Error("Query is required.");
      }

      // 1. Search Qdrant
      const searchResults = await VectorSearchService.search(
        userQuery.trim()
      );

      // 2. Build context for the AI
      const context =
        searchResults.length > 0
          ? `Search results from GOYE database:\n\n${JSON.stringify(
              searchResults,
              null,
              2
            )}`
          : "No results found in the database for this query.";

      // 3. Call Groq
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 1024,
        messages: [
          { role: "system",  content: SEARCH_AGENT_PROMPT },
          { role: "user", content: 
            `User query: "${userQuery}"\n\n${context}` 
          },
        ],
      });

      // 4. Parse and return
      const raw =
        completion.choices[0]?.message?.content || "{}";

      const parsed = JSON.parse(
        raw.replace(/```json/g, "").replace(/```/g, "").trim()
      );

      return {
        message: "Search completed successfully",
        data: parsed,
      };

    } catch (error: any) {
      console.error("SearchAgent error:", error);
      throw new Error(`SearchAgent error: ${error.message}`);
    }
  }
}