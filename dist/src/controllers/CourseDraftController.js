"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseDraftController = void 0;
const tsoa_1 = require("tsoa");
const course_draft_ai_service_1 = require("../services/AI_Services/course_draft_ai_service");
const voice_service_1 = require("../services/AI_Services/voice_service");
const course_draft_finalize_functions_1 = require("../services/Function_services.ts/course_draft_finalize_functions");
const requireServiceKey_1 = require("../middleware/requireServiceKey");
const upload_1 = require("../middleware/upload");
const progressEmitter_1 = require("../realtime/progressEmitter");
// Gated by a shared X-Service-Key header (requireServiceKey) rather than a
// per-tutor JWT: GOYE's own backend is the caller here (confirmed
// architecture), and it has already verified the tutor's identity via its
// own auth before making this request — tutorId is trusted from the body
// because only GOYE's backend, holding the shared key, can reach this
// controller at all.
let CourseDraftController = class CourseDraftController extends tsoa_1.Controller {
    async Start(body) {
        try {
            const result = await course_draft_ai_service_1.CourseDraftAIService.startSession(body.tutorId, body.tutorName, body.message);
            this.setStatus(200);
            return { message: "Session started", data: [result], status: 200, error: [] };
        }
        catch (error) {
            this.setStatus(500);
            return { message: error.message, data: [], status: 500, error: [error.message] };
        }
    }
    async Message(sessionId, body) {
        try {
            const result = await course_draft_ai_service_1.CourseDraftAIService.continueSession(sessionId, body.tutorId, body.tutorName, body.message);
            this.setStatus(200);
            return { message: "Success", data: [result], status: 200, error: [] };
        }
        catch (error) {
            (0, progressEmitter_1.emitProgress)(sessionId, "error", { message: error.message });
            this.setStatus(400);
            return { message: error.message, data: [], status: 400, error: [error.message] };
        }
    }
    // multipart/form-data: fields "tutorId", "tutorName", file field "audio".
    // Not routed through tsoa's @Body() (that path assumes JSON) — the upload
    // middleware parses the multipart body itself, so tutorId/tutorName are
    // read straight off req.body here.
    async VoiceMessage(sessionId, request) {
        try {
            const file = request.file;
            const { tutorId, tutorName } = request.body;
            if (!file)
                throw new Error("No audio file provided (expected multipart field 'audio')");
            if (!tutorId || !tutorName)
                throw new Error("tutorId and tutorName are required form fields");
            (0, progressEmitter_1.emitProgress)(sessionId, "transcribing", {});
            const transcript = await voice_service_1.VoiceAIService.transcribe(file.buffer, file.originalname || "audio.webm");
            (0, progressEmitter_1.emitProgress)(sessionId, "transcript_ready", { transcript });
            const result = await course_draft_ai_service_1.CourseDraftAIService.continueSession(sessionId, tutorId, tutorName, transcript);
            this.setStatus(200);
            return { message: "Success", data: [{ transcript, ...result }], status: 200, error: [] };
        }
        catch (error) {
            (0, progressEmitter_1.emitProgress)(sessionId, "error", { message: error.message });
            this.setStatus(400);
            return { message: error.message, data: [], status: 400, error: [error.message] };
        }
    }
    async GetSession(sessionId, tutorId) {
        try {
            const result = await course_draft_ai_service_1.CourseDraftAIService.getSessionState(sessionId, tutorId);
            this.setStatus(200);
            return { message: "Success", data: [result], status: 200, error: [] };
        }
        catch (error) {
            this.setStatus(404);
            return { message: error.message, data: [], status: 404, error: [error.message] };
        }
    }
    async ListMine(tutorId) {
        try {
            const sessions = await course_draft_ai_service_1.CourseDraftAIService.listMySessions(tutorId);
            this.setStatus(200);
            return { message: "Success", data: sessions, status: 200, error: [] };
        }
        catch (error) {
            this.setStatus(500);
            return { message: error.message, data: [], status: 500, error: [error.message] };
        }
    }
    async Finalize(sessionId, body) {
        try {
            const courseId = await (0, course_draft_finalize_functions_1.finalizeDraftToCourse)(sessionId, body.tutorId);
            this.setStatus(200);
            return { message: "Course created", data: [{ courseId }], status: 200, error: [] };
        }
        catch (error) {
            (0, progressEmitter_1.emitProgress)(sessionId, "error", { message: error.message });
            this.setStatus(400);
            return { message: error.message, data: [], status: 400, error: [error.message] };
        }
    }
    async Abandon(sessionId, body) {
        try {
            const session = await course_draft_ai_service_1.CourseDraftAIService.abandonSession(sessionId, body.tutorId);
            this.setStatus(200);
            return { message: "Session abandoned", data: [session], status: 200, error: [] };
        }
        catch (error) {
            this.setStatus(404);
            return { message: error.message, data: [], status: 404, error: [error.message] };
        }
    }
};
exports.CourseDraftController = CourseDraftController;
__decorate([
    (0, tsoa_1.Post)("start"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CourseDraftController.prototype, "Start", null);
__decorate([
    (0, tsoa_1.Post)("{sessionId}/message"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseDraftController.prototype, "Message", null);
__decorate([
    (0, tsoa_1.Post)("{sessionId}/voice-message"),
    (0, tsoa_1.Middlewares)(upload_1.audioUpload.single("audio")),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseDraftController.prototype, "VoiceMessage", null);
__decorate([
    (0, tsoa_1.Get)("{sessionId}"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CourseDraftController.prototype, "GetSession", null);
__decorate([
    (0, tsoa_1.Get)("mine/list"),
    __param(0, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CourseDraftController.prototype, "ListMine", null);
__decorate([
    (0, tsoa_1.Post)("{sessionId}/finalize"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseDraftController.prototype, "Finalize", null);
__decorate([
    (0, tsoa_1.Post)("{sessionId}/abandon"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseDraftController.prototype, "Abandon", null);
exports.CourseDraftController = CourseDraftController = __decorate([
    (0, tsoa_1.Middlewares)(requireServiceKey_1.requireServiceKey),
    (0, tsoa_1.Tags)("Course Draft AI"),
    (0, tsoa_1.Route)("ai_v1/course-draft")
], CourseDraftController);
//# sourceMappingURL=CourseDraftController.js.map