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
exports.MentorMatchController = void 0;
const tsoa_1 = require("tsoa");
const mentor_match_ai_service_1 = require("../services/AI_Services/mentor_match_ai_service");
const voice_service_1 = require("../services/AI_Services/voice_service");
const requireServiceKey_1 = require("../middleware/requireServiceKey");
const upload_1 = require("../middleware/upload");
const progressEmitter_1 = require("../realtime/progressEmitter");
const extract_text_1 = require("../utils/documents/extract_text");
// Same shared-service-key architecture as CourseDraftController — GOYE's
// backend is the sole caller, already having verified the student's
// identity itself. When the AI proposes a match (result.matchedTutor is
// set), GOYE's own proxy is responsible for creating the tutor
// notification and the opening chat message — this service only ever
// touches the shared draft/session tables, never GOYE's Notification or
// PrivateMessage tables directly.
let MentorMatchController = class MentorMatchController extends tsoa_1.Controller {
    async Start(body) {
        try {
            const result = await mentor_match_ai_service_1.MentorMatchAIService.startSession(body.studentId, body.studentName, body.message);
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
            const result = await mentor_match_ai_service_1.MentorMatchAIService.continueSession(sessionId, body.studentId, body.studentName, body.message);
            this.setStatus(200);
            return { message: "Success", data: [result], status: 200, error: [] };
        }
        catch (error) {
            (0, progressEmitter_1.emitProgress)(sessionId, "error", { message: error.message });
            this.setStatus(400);
            return { message: error.message, data: [], status: 400, error: [error.message] };
        }
    }
    async VoiceMessage(sessionId, request) {
        try {
            const file = request.file;
            const { studentId, studentName } = request.body;
            if (!file)
                throw new Error("No audio file provided (expected multipart field 'audio')");
            if (!studentId || !studentName)
                throw new Error("studentId and studentName are required form fields");
            (0, progressEmitter_1.emitProgress)(sessionId, "transcribing", {});
            const transcript = await voice_service_1.VoiceAIService.transcribe(file.buffer, file.originalname || "audio.webm");
            (0, progressEmitter_1.emitProgress)(sessionId, "transcript_ready", { transcript });
            const result = await mentor_match_ai_service_1.MentorMatchAIService.continueSession(sessionId, studentId, studentName, transcript);
            this.setStatus(200);
            return { message: "Success", data: [{ transcript, ...result }], status: 200, error: [] };
        }
        catch (error) {
            (0, progressEmitter_1.emitProgress)(sessionId, "error", { message: error.message });
            this.setStatus(400);
            return { message: error.message, data: [], status: 400, error: [error.message] };
        }
    }
    async GetSession(sessionId, studentId) {
        try {
            const result = await mentor_match_ai_service_1.MentorMatchAIService.getSessionState(sessionId, studentId);
            this.setStatus(200);
            return { message: "Success", data: [result], status: 200, error: [] };
        }
        catch (error) {
            this.setStatus(404);
            return { message: error.message, data: [], status: 404, error: [error.message] };
        }
    }
    async ListMine(studentId) {
        try {
            const sessions = await mentor_match_ai_service_1.MentorMatchAIService.listMySessions(studentId);
            this.setStatus(200);
            return { message: "Success", data: sessions, status: 200, error: [] };
        }
        catch (error) {
            this.setStatus(500);
            return { message: error.message, data: [], status: 500, error: [error.message] };
        }
    }
    async Abandon(sessionId, body) {
        try {
            const session = await mentor_match_ai_service_1.MentorMatchAIService.abandonSession(sessionId, body.studentId);
            this.setStatus(200);
            return { message: "Session abandoned", data: [session], status: 200, error: [] };
        }
        catch (error) {
            this.setStatus(404);
            return { message: error.message, data: [], status: 404, error: [error.message] };
        }
    }
    // The document's text is fed in as the user's own turn, so the assistant
    // treats it as context they provided rather than something it invented.
    async Document(sessionId, request) {
        try {
            const file = request.file;
            const { studentId, studentName } = request.body;
            if (!file)
                throw new Error("No document provided (expected multipart field 'document')");
            if (!studentId || !studentName)
                throw new Error("studentId and studentName are required form fields");
            (0, progressEmitter_1.emitProgress)(sessionId, "reading_document", { filename: file.originalname });
            const { text, truncated } = await (0, extract_text_1.extractDocumentText)(file.buffer, file.originalname || "", file.mimetype);
            const preamble = `I'm sharing a document called "${file.originalname}"${truncated ? " (only the first part is included, it's a long one)" : ""}. Here are its contents:

${text}`;
            const result = await mentor_match_ai_service_1.MentorMatchAIService.continueSession(sessionId, studentId, studentName, preamble);
            this.setStatus(200);
            return { message: "Success", data: [{ filename: file.originalname, truncated, ...result }], status: 200, error: [] };
        }
        catch (error) {
            (0, progressEmitter_1.emitProgress)(sessionId, "error", { message: error.message });
            this.setStatus(400);
            return { message: error.message, data: [], status: 400, error: [error.message] };
        }
    }
};
exports.MentorMatchController = MentorMatchController;
__decorate([
    (0, tsoa_1.Post)("start"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MentorMatchController.prototype, "Start", null);
__decorate([
    (0, tsoa_1.Post)("{sessionId}/message"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MentorMatchController.prototype, "Message", null);
__decorate([
    (0, tsoa_1.Post)("{sessionId}/voice-message"),
    (0, tsoa_1.Middlewares)(upload_1.audioUpload.single("audio")),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MentorMatchController.prototype, "VoiceMessage", null);
__decorate([
    (0, tsoa_1.Get)("{sessionId}"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MentorMatchController.prototype, "GetSession", null);
__decorate([
    (0, tsoa_1.Get)("mine/list"),
    __param(0, (0, tsoa_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MentorMatchController.prototype, "ListMine", null);
__decorate([
    (0, tsoa_1.Post)("{sessionId}/abandon"),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MentorMatchController.prototype, "Abandon", null);
__decorate([
    (0, tsoa_1.Post)("{sessionId}/document"),
    (0, tsoa_1.Middlewares)(upload_1.documentUpload.single("document")),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MentorMatchController.prototype, "Document", null);
exports.MentorMatchController = MentorMatchController = __decorate([
    (0, tsoa_1.Middlewares)(requireServiceKey_1.requireServiceKey),
    (0, tsoa_1.Tags)("Mentor Match AI"),
    (0, tsoa_1.Route)("ai_v1/mentor-match")
], MentorMatchController);
//# sourceMappingURL=MentorMatchController.js.map