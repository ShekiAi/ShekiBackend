import { ServiceResponse } from "../../interface/ResponseInterface";
import { groq } from "../../utils/groq_admin/groq";
import { AI_FOR_FETCHING_USERS, AI_GUIDANCE_PROMPT, AI_LANGUAGE_TRANSLATOR } from "../../utils/prompt/prompt";
import { getUserTools } from "../../utils/tools/ai_tools";
import { getUsers } from "../Function_services.ts/user_function";

export class AIServices {
  
  // 1. Send Prompt Service
  static async SendPrompt(message: string): Promise<ServiceResponse> {
    try {
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new Error('Prompt is required and must be a non-empty string');
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: AI_GUIDANCE_PROMPT,
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
    } catch (error: any) {
      console.error('Groq API Error:', error);
      throw new Error(`Groq API error: ${error.message || 'Unknown error'}`);
    }
  }

  // 2. Language Translation Service
  static async TranslateLang(text: string, lang: string, languageCode: string): Promise<ServiceResponse> {
    try {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Prompt is required and must be a non-empty string');
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: AI_LANGUAGE_TRANSLATOR(text, lang, languageCode),
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
    } catch (error: any) {
      console.error('Groq API Error:', error);
      throw new Error(`Groq API error: ${error.message || 'Unknown error'}`);
    }
  }

  // 3. Tool Use Service (Fetch Users)
 static async askForUsers(): Promise<ServiceResponse> {
  try {
    // Setting up the conversation history for Groq
    const messages: any[] = [
      { 
        role: "system", 
        content: AI_FOR_FETCHING_USERS
      },
      { 
        role: "user", 
        content: "List all users in the database" 
      }
    ];

    // Step 1: Ask Groq if it needs to use our database tool
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      tools: getUserTools, // Wrapped in an array so TypeScript stays happy!
      tool_choice: "auto"
    });

    const message = response.choices[0].message;

    // Step 2: Check if Groq actually requested to use the tool
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.function.name === "get_users") {
          
          // Pull the real data out of your database
          const users = await getUsers();
          
          // Let's feed the tool request and the database results back to Groq
          messages.push(message);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: "get_users",
            content: JSON.stringify(users)
          });

          // Step 3: Get the final response from Groq summarizing the users
          const final = await groq.chat.completions.create({
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

  } catch (error: any) {
    console.error(" Ah, something went wrong with the Groq tool call:", error);
    throw new Error(`Groq Tool error: ${error.message || "Unknown error"}`);
  }
}
}