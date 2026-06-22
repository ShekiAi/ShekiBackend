import { ServiceResponse } from "../../interface/ResponseInterface";
import { groq } from "../../utils/groq_admin/groq";
import { AI_GUIDANCE_PROMPT, AI_LANGUAGE_TRANSLATOR } from "../../utils/prompt/prompt";

export class AIServices {
  static async SendPrompt(message: string): Promise<ServiceResponse> {
    try {
      // Validate input
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

  static async TranslateLang(text: string, lang: string, languageCode: string) {
      try {
      // Validate input
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
        message: "Tranlation sent successfully",
        data: [response],
      };
    } catch (error: any) {
      console.error('Groq API Error:', error);
      throw new Error(`Groq API error: ${error.message || 'Unknown error'}`);
    }
  }
}