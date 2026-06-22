"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIServices = void 0;
const groq_1 = require("../../utils/groq_admin/groq");
const prompt_1 = require("../../utils/prompt/prompt");
class AIServices {
    static async SendPrompt(message) {
        try {
            // Validate input
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                throw new Error('Prompt is required and must be a non-empty string');
            }
            const chatCompletion = await groq_1.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: prompt_1.AI_GUIDANCE_PROMPT,
                    },
                    {
                        role: "user",
                        content: message.trim(),
                    },
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                max_completion_tokens: 1024,
            });
            const response = chatCompletion.choices[0]?.message?.content || "No response received.";
            return {
                message: "Prompt sent successfully",
                data: [response],
            };
        }
        catch (error) {
            console.error('Groq API Error:', error);
            throw new Error(`Groq API error: ${error.message || 'Unknown error'}`);
        }
    }
    static async TranslateLang(text, lang, languageCode) {
        try {
            // Validate input
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                throw new Error('Prompt is required and must be a non-empty string');
            }
            const chatCompletion = await groq_1.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: (0, prompt_1.AI_LANGUAGE_TRANSLATOR)(text, lang, languageCode),
                    },
                    {
                        role: "user",
                        content: text.trim(),
                    },
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                max_completion_tokens: 1024,
            });
            const response = chatCompletion.choices[0]?.message?.content || "No response received.";
            return {
                message: "Tranlation sent successfully",
                data: [response],
            };
        }
        catch (error) {
            console.error('Groq API Error:', error);
            throw new Error(`Groq API error: ${error.message || 'Unknown error'}`);
        }
    }
}
exports.AIServices = AIServices;
//# sourceMappingURL=ai_v1_service.js.map