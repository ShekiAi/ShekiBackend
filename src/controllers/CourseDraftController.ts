import { Request as ExRequest } from "express";
import { Body, Controller, Get, Middlewares, Path, Post, Query, Request, Route, Tags } from "tsoa";
import { APIResponse } from "../interface/ResponseInterface";
import { CourseDraftAIService } from "../services/AI_Services/course_draft_ai_service";
import { VoiceAIService } from "../services/AI_Services/voice_service";
import { finalizeDraftToCourse } from "../services/Function_services.ts/course_draft_finalize_functions";
import { requireServiceKey } from "../middleware/requireServiceKey";
import { audioUpload } from "../middleware/upload";
import { emitProgress } from "../realtime/progressEmitter";

// Gated by a shared X-Service-Key header (requireServiceKey) rather than a
// per-tutor JWT: GOYE's own backend is the caller here (confirmed
// architecture), and it has already verified the tutor's identity via its
// own auth before making this request — tutorId is trusted from the body
// because only GOYE's backend, holding the shared key, can reach this
// controller at all.
@Middlewares(requireServiceKey)
@Tags("Course Draft AI")
@Route("ai_v1/course-draft")
export class CourseDraftController extends Controller {
  @Post("start")
  public async Start(
    @Body() body: { tutorId: string; tutorName: string; message?: string },
  ): Promise<APIResponse> {
    try {
      const result = await CourseDraftAIService.startSession(body.tutorId, body.tutorName, body.message);
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
    @Body() body: { tutorId: string; tutorName: string; message: string },
  ): Promise<APIResponse> {
    try {
      const result = await CourseDraftAIService.continueSession(sessionId, body.tutorId, body.tutorName, body.message);
      this.setStatus(200);
      return { message: "Success", data: [result], status: 200, error: [] };
    } catch (error: any) {
      emitProgress(sessionId, "error", { message: error.message });
      this.setStatus(400);
      return { message: error.message, data: [], status: 400, error: [error.message] };
    }
  }

  // multipart/form-data: fields "tutorId", "tutorName", file field "audio".
  // Not routed through tsoa's @Body() (that path assumes JSON) — the upload
  // middleware parses the multipart body itself, so tutorId/tutorName are
  // read straight off req.body here.
  @Post("{sessionId}/voice-message")
  @Middlewares(audioUpload.single("audio"))
  public async VoiceMessage(@Path() sessionId: string, @Request() request: ExRequest): Promise<APIResponse> {
    try {
      const file = (request as any).file as Express.Multer.File | undefined;
      const { tutorId, tutorName } = request.body as { tutorId?: string; tutorName?: string };
      if (!file) throw new Error("No audio file provided (expected multipart field 'audio')");
      if (!tutorId || !tutorName) throw new Error("tutorId and tutorName are required form fields");

      emitProgress(sessionId, "transcribing", {});
      const transcript = await VoiceAIService.transcribe(file.buffer, file.originalname || "audio.webm");
      emitProgress(sessionId, "transcript_ready", { transcript });

      const result = await CourseDraftAIService.continueSession(sessionId, tutorId, tutorName, transcript);
      this.setStatus(200);
      return { message: "Success", data: [{ transcript, ...result }], status: 200, error: [] };
    } catch (error: any) {
      emitProgress(sessionId, "error", { message: error.message });
      this.setStatus(400);
      return { message: error.message, data: [], status: 400, error: [error.message] };
    }
  }

  @Get("{sessionId}")
  public async GetSession(@Path() sessionId: string, @Query() tutorId: string): Promise<APIResponse> {
    try {
      const result = await CourseDraftAIService.getSessionState(sessionId, tutorId);
      this.setStatus(200);
      return { message: "Success", data: [result], status: 200, error: [] };
    } catch (error: any) {
      this.setStatus(404);
      return { message: error.message, data: [], status: 404, error: [error.message] };
    }
  }

  @Get("mine/list")
  public async ListMine(@Query() tutorId: string): Promise<APIResponse> {
    try {
      const sessions = await CourseDraftAIService.listMySessions(tutorId);
      this.setStatus(200);
      return { message: "Success", data: sessions, status: 200, error: [] };
    } catch (error: any) {
      this.setStatus(500);
      return { message: error.message, data: [], status: 500, error: [error.message] };
    }
  }

  @Post("{sessionId}/finalize")
  public async Finalize(@Path() sessionId: string, @Body() body: { tutorId: string }): Promise<APIResponse> {
    try {
      const courseId = await finalizeDraftToCourse(sessionId, body.tutorId);
      this.setStatus(200);
      return { message: "Course created", data: [{ courseId }], status: 200, error: [] };
    } catch (error: any) {
      emitProgress(sessionId, "error", { message: error.message });
      this.setStatus(400);
      return { message: error.message, data: [], status: 400, error: [error.message] };
    }
  }

  @Post("{sessionId}/abandon")
  public async Abandon(@Path() sessionId: string, @Body() body: { tutorId: string }): Promise<APIResponse> {
    try {
      const session = await CourseDraftAIService.abandonSession(sessionId, body.tutorId);
      this.setStatus(200);
      return { message: "Session abandoned", data: [session], status: 200, error: [] };
    } catch (error: any) {
      this.setStatus(404);
      return { message: error.message, data: [], status: 404, error: [error.message] };
    }
  }
}
