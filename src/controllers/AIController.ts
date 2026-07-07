import { Body, Controller, Get, Post, Route, Tags } from "tsoa";
import { APIResponse } from "../interface/ResponseInterface";
import { AIServices } from "../services/AI_Services/ai_v1_service";
import { SearchAgentService } from "../services/searchAgent.service";

@Tags("AI Controller")
@Route("ai_v1")
export class AIController extends Controller {
  @Get("ai-health")
  public async health() {
    return {
      message: "AI Health is check",
    };
  }

  @Post("test-prompt")
  public async TestPrompt(
    @Body() data: { prompt: string },
  ): Promise<APIResponse> {
    try {
      const promptData = await AIServices.SendPrompt(data.prompt);

      return {
        message: "Success",
        data: [promptData],
        status: 200,
        error: [],
      };
    } catch (error: any) {
      return {
        message: error.message,
        data: [],
        status: 500,
        error: [error],
      };
    }
  }

  @Post("translate-language")
  public async TranslateLanguage(
    @Body() data: { text: string; lang: string; languageCode: string },
  ): Promise<APIResponse> {
    try {
      const promptData = await AIServices.TranslateLang(
        data.text,
        data.lang,
        data.languageCode,
      );

      return {
        message: "Success",
        data: [promptData],
        status: 200,
        error: [],
      };
    } catch (error: any) {
      return {
        message: error.message,
        data: [],
        status: 500,
        error: [error],
      };
    }
  }

  @Get("/ai-fetch-users")
  public async FetchUsers(): Promise<APIResponse> {
    try {
      const res = await AIServices.askForUsers();
      return {
        message: "Success",
        data: [res],
        status: 200,
        error: [],
      };
    } catch (error: any) {
      this.setStatus(500);
      return {
        message: error.message,
        data: [],
        status: 500,
        error: [error],
      };
    }
  }

  @Post("/search")
  public async SearchAgentController(
    @Body() data: { query: string },
  ): Promise<APIResponse> {
    try {
      if (!data.query) {
        return {
          message: "Please type something",
          data: [],
          status: 400,
          error: [],
        };
      }

      const result = await SearchAgentService.search(data.query);
      return {
        message: "Success",
        data: [result],
        status: 200,
        error: [],
      };
    } catch (error: any) {
      return {
        message: error.message,
        data: [],
        status: 500,
        error: [error],
      };
    }
  }
}
