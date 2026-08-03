import { Request as ExRequest } from "express";
import { Body, Controller, Get, Middlewares, Path, Post, Query, Request, Route, Tags } from "tsoa";
import { APIResponse } from "../interface/ResponseInterface";
import { MentorMatchAIService } from "../services/AI_Services/mentor_match_ai_service";
import { VoiceAIService } from "../services/AI_Services/voice_service";
import { requireServiceKey } from "../middleware/requireServiceKey";
import { audioUpload } from "../middleware/upload";
import { emitProgress } from "../realtime/progressEmitter";

// Same shared-service-key architecture as CourseDraftController — GOYE's
// backend is the sole caller, already having verified the student's
// identity itself. When the AI proposes a match (result.matchedTutor is
// set), GOYE's own proxy is responsible for creating the tutor
// notification and the opening chat message — this service only ever
// touches the shared draft/session tables, never GOYE's Notification or
// PrivateMessage tables directly.
@Middlewares(requireServiceKey)
@Tags("Mentor Match AI")
@Route("ai_v1/mentor-match")
export class MentorMatchController extends Controller {
  @Post("start")
  public async Start(@Body() body: { studentId: string; studentName: string; message?: string }): Promise<APIResponse> {
    try {
      const result = await MentorMatchAIService.startSession(body.studentId, body.studentName, body.message);
      this.setStatus(200);
      return { message: "Session started", data: [result], status: 200, error: [] };
    } catch (error: any) {
      this.setStatus(500);
      return { message: error.message, data: [], status: 500, error: [error.message] };
    }
  }

  @Post("{sessionId}/message")
  public async Message(
    @Path() sessionId: string,
    @Body() body: { studentId: string; studentName: string; message: string },
  ): Promise<APIResponse> {
    try {
      const result = await MentorMatchAIService.continueSession(sessionId, body.studentId, body.studentName, body.message);
      this.setStatus(200);
      return { message: "Success", data: [result], status: 200, error: [] };
    } catch (error: any) {
      emitProgress(sessionId, "error", { message: error.message });
      this.setStatus(400);
      return { message: error.message, data: [], status: 400, error: [error.message] };
    }
  }

  @Post("{sessionId}/voice-message")
  @Middlewares(audioUpload.single("audio"))
  public async VoiceMessage(@Path() sessionId: string, @Request() request: ExRequest): Promise<APIResponse> {
    try {
      const file = (request as any).file as Express.Multer.File | undefined;
      const { studentId, studentName } = request.body as { studentId?: string; studentName?: string };
      if (!file) throw new Error("No audio file provided (expected multipart field 'audio')");
      if (!studentId || !studentName) throw new Error("studentId and studentName are required form fields");

      emitProgress(sessionId, "transcribing", {});
      const transcript = await VoiceAIService.transcribe(file.buffer, file.originalname || "audio.webm");
      emitProgress(sessionId, "transcript_ready", { transcript });

      const result = await MentorMatchAIService.continueSession(sessionId, studentId, studentName, transcript);
      this.setStatus(200);
      return { message: "Success", data: [{ transcript, ...result }], status: 200, error: [] };
    } catch (error: any) {
      emitProgress(sessionId, "error", { message: error.message });
      this.setStatus(400);
      return { message: error.message, data: [], status: 400, error: [error.message] };
    }
  }

  @Get("{sessionId}")
  public async GetSession(@Path() sessionId: string, @Query() studentId: string): Promise<APIResponse> {
    try {
      const result = await MentorMatchAIService.getSessionState(sessionId, studentId);
      this.setStatus(200);
      return { message: "Success", data: [result], status: 200, error: [] };
    } catch (error: any) {
      this.setStatus(404);
      return { message: error.message, data: [], status: 404, error: [error.message] };
    }
  }

  @Get("mine/list")
  public async ListMine(@Query() studentId: string): Promise<APIResponse> {
    try {
      const sessions = await MentorMatchAIService.listMySessions(studentId);
      this.setStatus(200);
      return { message: "Success", data: sessions, status: 200, error: [] };
    } catch (error: any) {
      this.setStatus(500);
      return { message: error.message, data: [], status: 500, error: [error.message] };
    }
  }

  @Post("{sessionId}/abandon")
  public async Abandon(@Path() sessionId: string, @Body() body: { studentId: string }): Promise<APIResponse> {
    try {
      const session = await MentorMatchAIService.abandonSession(sessionId, body.studentId);
      this.setStatus(200);
      return { message: "Session abandoned", data: [session], status: 200, error: [] };
    } catch (error: any) {
      this.setStatus(404);
      return { message: error.message, data: [], status: 404, error: [error.message] };
    }
  }
}
