import { Body, Controller, Get, Post, Route, Tags } from "tsoa";
import { APIResponse } from "../interface/ResponseInterface";
import { AIServices } from "../services/AI_Services/ai_v1_service";

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
  public async TestPrompt(@Body() data: {prompt: string}): Promise<APIResponse> {
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
}
