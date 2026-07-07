"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIServices = void 0;
const groq_1 = require("../../utils/groq_admin/groq");
const prompt_1 = require("../../utils/prompt/prompt");
const ai_tools_1 = require("../../utils/tools/ai_tools");
const user_function_1 = require("../Function_services.ts/user_function");
class AIServices {
    // 1. Send Prompt Service
    static async SendPrompt(message) {
        try {
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
    // 2. Language Translation Service
    static async TranslateLang(text, lang, languageCode) {
        try {
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
                message: "Translation sent successfully",
                data: [response],
            };
        }
        catch (error) {
            console.error('Groq API Error:', error);
            throw new Error(`Groq API error: ${error.message || 'Unknown error'}`);
        }
    }
    // 3. Tool Use Service (Fetch Users)
    static async askForUsers() {
        try {
            // Setting up the conversation history for Groq
            const messages = [
                {
                    role: "system",
                    content: prompt_1.AI_FOR_FETCHING_USERS
                },
                {
                    role: "user",
                    content: "List all users in the database"
                }
            ];
            // Step 1: Ask Groq if it needs to use our database tool
            const response = await groq_1.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                tools: ai_tools_1.getUserTools, // Wrapped in an array so TypeScript stays happy!
                tool_choice: "auto"
            });
            const message = response.choices[0].message;
            // Step 2: Check if Groq actually requested to use the tool
            if (message.tool_calls) {
                for (const toolCall of message.tool_calls) {
                    if (toolCall.function.name === "get_users") {
                        // Pull the real data out of your database
                        const users = await (0, user_function_1.getUsers)();
                        // Let's feed the tool request and the database results back to Groq
                        messages.push(message);
                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: "get_users",
                            content: JSON.stringify(users)
                        });
                        // Step 3: Get the final response from Groq summarizing the users
                        const final = await groq_1.groq.chat.completions.create({
                            model: "llama-3.3-70b-versatile",
                            messages: messages
                        });
                        const finalResponse = final.choices[0].message?.content || "No text returned.";
                        return {
                            message: "Successfully fetched and summarized database users!",
                            data: [finalResponse],
                        };
                    }
                }
            }
            // Fallback if Groq decided to just talk instead of calling the tool
            return {
                message: "Processed successfully without needing the tool.",
                data: [message.content || ""],
            };
        }
        catch (error) {
            console.error(" Ah, something went wrong with the Groq tool call:", error);
            throw new Error(`Groq Tool error: ${error.message || "Unknown error"}`);
        }
    }
}
exports.AIServices = AIServices;
//# sourceMappingURL=ai_v1_service.js.map