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
exports.AIController = void 0;
const tsoa_1 = require("tsoa");
const ai_v1_service_1 = require("../services/AI_Services/ai_v1_service");
let AIController = class AIController extends tsoa_1.Controller {
    async health() {
        return {
            message: "AI Health is check",
        };
    }
    async TestPrompt(data) {
        try {
            const promptData = await ai_v1_service_1.AIServices.SendPrompt(data.prompt);
            return {
                message: "Success",
                data: [promptData],
                status: 200,
                error: [],
            };
        }
        catch (error) {
            return {
                message: error.message,
                data: [],
                status: 500,
                error: [error],
            };
        }
    }
    async TranslateLanguage(data) {
        try {
            const promptData = await ai_v1_service_1.AIServices.TranslateLang(data.text, data.lang, data.languageCode);
            return {
                message: "Success",
                data: [promptData],
                status: 200,
                error: [],
            };
        }
        catch (error) {
            return {
                message: error.message,
                data: [],
                status: 500,
                error: [error],
            };
        }
    }
};
exports.AIController = AIController;
__decorate([
    (0, tsoa_1.Get)("ai-health"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AIController.prototype, "health", null);
__decorate([
    (0, tsoa_1.Post)("test-prompt"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "TestPrompt", null);
__decorate([
    (0, tsoa_1.Post)("translate-language"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "TranslateLanguage", null);
exports.AIController = AIController = __decorate([
    (0, tsoa_1.Tags)("AI Controller"),
    (0, tsoa_1.Route)("ai_v1")
], AIController);
//# sourceMappingURL=AIController.js.map