"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIServices = void 0;
const groq_1 = require("../../utils/groq_admin/groq");
class AIServices {
    static async SendPropmt(message) {
        const chatCompletion = await groq_1.groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant.", // Optional: sets the assistant's behavior
                },
                {
                    role: "user",
                    content: message,
                },
            ],
            model: "llama-3.3-70b-versatile", // Choose your preferred model
            temperature: 0.5, // Controls randomness (0.0 - 1.0)
            max_completion_tokens: 1024, // Maximum length of the response
        });
        return {
            message: "Prompt sent successfuly",
            data: [chatCompletion.choices[0].message.content || "No response received."],
        };
    }
}
exports.AIServices = AIServices;
//# sourceMappingURL=ai_v1_service.js.map