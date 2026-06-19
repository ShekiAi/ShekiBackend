import { Controller, Get, Route, Tags } from "tsoa";

@Tags("AI Controller")
@Route("ai_v1")
export class AIController extends Controller {
  @Get("ai-health")
  public async health() {
    return {
      message: "AI Health is check",
    };
  }
}
