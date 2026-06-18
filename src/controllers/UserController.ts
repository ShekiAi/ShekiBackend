import { Controller, Get, Route, Tags } from "tsoa";

@Tags("Authentication")
@Route("auth")
export class UserController extends Controller {
  @Get("health")
  public async health() {
    return {
      message: "Health is check",
    };
  }
}
