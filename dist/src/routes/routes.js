"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRoutes = RegisterRoutes;
const runtime_1 = require("@tsoa/runtime");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const UserController_1 = require("./../controllers/UserController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const MentorMatchController_1 = require("./../controllers/MentorMatchController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const CourseDraftController_1 = require("./../controllers/CourseDraftController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const AIController_1 = require("./../controllers/AIController");
const auth_1 = require("./../middleware/auth");
const expressAuthenticationRecasted = auth_1.expressAuthentication;
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const models = {
    "APIResponse": {
        "dataType": "refObject",
        "properties": {
            "message": { "dataType": "string", "required": true },
            "data": { "dataType": "array", "array": { "dataType": "any" }, "required": true },
            "status": { "dataType": "double", "required": true },
            "error": { "dataType": "array", "array": { "dataType": "any" }, "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new runtime_1.ExpressTemplateService(models, { "noImplicitAdditionalProperties": "throw-on-extras", "bodyCoercion": true });
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
function RegisterRoutes(app) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
    const argsUserController_health = {};
    app.get('/auth/health', ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.health)), async function UserController_health(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_health, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'health',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMentorMatchController_Start = {
        body: { "in": "body", "name": "body", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "message": { "dataType": "string" }, "studentName": { "dataType": "string", "required": true }, "studentId": { "dataType": "string", "required": true } } },
    };
    app.post('/ai_v1/mentor-match/start', ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController)), ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController.prototype.Start)), async function MentorMatchController_Start(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_Start, request, response });
            const controller = new MentorMatchController_1.MentorMatchController();
            await templateService.apiHandler({
                methodName: 'Start',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMentorMatchController_Message = {
        sessionId: { "in": "path", "name": "sessionId", "required": true, "dataType": "string" },
        body: { "in": "body", "name": "body", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "message": { "dataType": "string", "required": true }, "studentName": { "dataType": "string", "required": true }, "studentId": { "dataType": "string", "required": true } } },
    };
    app.post('/ai_v1/mentor-match/:sessionId/message', ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController)), ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController.prototype.Message)), async function MentorMatchController_Message(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_Message, request, response });
            const controller = new MentorMatchController_1.MentorMatchController();
            await templateService.apiHandler({
                methodName: 'Message',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMentorMatchController_VoiceMessage = {
        sessionId: { "in": "path", "name": "sessionId", "required": true, "dataType": "string" },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
    };
    app.post('/ai_v1/mentor-match/:sessionId/voice-message', ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController)), ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController.prototype.VoiceMessage)), async function MentorMatchController_VoiceMessage(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_VoiceMessage, request, response });
            const controller = new MentorMatchController_1.MentorMatchController();
            await templateService.apiHandler({
                methodName: 'VoiceMessage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMentorMatchController_GetSession = {
        sessionId: { "in": "path", "name": "sessionId", "required": true, "dataType": "string" },
        studentId: { "in": "query", "name": "studentId", "required": true, "dataType": "string" },
    };
    app.get('/ai_v1/mentor-match/:sessionId', ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController)), ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController.prototype.GetSession)), async function MentorMatchController_GetSession(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_GetSession, request, response });
            const controller = new MentorMatchController_1.MentorMatchController();
            await templateService.apiHandler({
                methodName: 'GetSession',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMentorMatchController_ListMine = {
        studentId: { "in": "query", "name": "studentId", "required": true, "dataType": "string" },
    };
    app.get('/ai_v1/mentor-match/mine/list', ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController)), ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController.prototype.ListMine)), async function MentorMatchController_ListMine(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_ListMine, request, response });
            const controller = new MentorMatchController_1.MentorMatchController();
            await templateService.apiHandler({
                methodName: 'ListMine',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsMentorMatchController_Abandon = {
        sessionId: { "in": "path", "name": "sessionId", "required": true, "dataType": "string" },
        body: { "in": "body", "name": "body", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "studentId": { "dataType": "string", "required": true } } },
    };
    app.post('/ai_v1/mentor-match/:sessionId/abandon', ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController)), ...((0, runtime_1.fetchMiddlewares)(MentorMatchController_1.MentorMatchController.prototype.Abandon)), async function MentorMatchController_Abandon(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_Abandon, request, response });
            const controller = new MentorMatchController_1.MentorMatchController();
            await templateService.apiHandler({
                methodName: 'Abandon',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCourseDraftController_Start = {
        body: { "in": "body", "name": "body", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "message": { "dataType": "string" }, "tutorName": { "dataType": "string", "required": true }, "tutorId": { "dataType": "string", "required": true } } },
    };
    app.post('/ai_v1/course-draft/start', ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController)), ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController.prototype.Start)), async function CourseDraftController_Start(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_Start, request, response });
            const controller = new CourseDraftController_1.CourseDraftController();
            await templateService.apiHandler({
                methodName: 'Start',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCourseDraftController_Message = {
        sessionId: { "in": "path", "name": "sessionId", "required": true, "dataType": "string" },
        body: { "in": "body", "name": "body", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "message": { "dataType": "string", "required": true }, "tutorName": { "dataType": "string", "required": true }, "tutorId": { "dataType": "string", "required": true } } },
    };
    app.post('/ai_v1/course-draft/:sessionId/message', ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController)), ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController.prototype.Message)), async function CourseDraftController_Message(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_Message, request, response });
            const controller = new CourseDraftController_1.CourseDraftController();
            await templateService.apiHandler({
                methodName: 'Message',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCourseDraftController_VoiceMessage = {
        sessionId: { "in": "path", "name": "sessionId", "required": true, "dataType": "string" },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
    };
    app.post('/ai_v1/course-draft/:sessionId/voice-message', ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController)), ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController.prototype.VoiceMessage)), async function CourseDraftController_VoiceMessage(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_VoiceMessage, request, response });
            const controller = new CourseDraftController_1.CourseDraftController();
            await templateService.apiHandler({
                methodName: 'VoiceMessage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCourseDraftController_GetSession = {
        sessionId: { "in": "path", "name": "sessionId", "required": true, "dataType": "string" },
        tutorId: { "in": "query", "name": "tutorId", "required": true, "dataType": "string" },
    };
    app.get('/ai_v1/course-draft/:sessionId', ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController)), ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController.prototype.GetSession)), async function CourseDraftController_GetSession(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_GetSession, request, response });
            const controller = new CourseDraftController_1.CourseDraftController();
            await templateService.apiHandler({
                methodName: 'GetSession',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCourseDraftController_ListMine = {
        tutorId: { "in": "query", "name": "tutorId", "required": true, "dataType": "string" },
    };
    app.get('/ai_v1/course-draft/mine/list', ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController)), ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController.prototype.ListMine)), async function CourseDraftController_ListMine(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_ListMine, request, response });
            const controller = new CourseDraftController_1.CourseDraftController();
            await templateService.apiHandler({
                methodName: 'ListMine',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCourseDraftController_Finalize = {
        sessionId: { "in": "path", "name": "sessionId", "required": true, "dataType": "string" },
        body: { "in": "body", "name": "body", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "tutorId": { "dataType": "string", "required": true } } },
    };
    app.post('/ai_v1/course-draft/:sessionId/finalize', ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController)), ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController.prototype.Finalize)), async function CourseDraftController_Finalize(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_Finalize, request, response });
            const controller = new CourseDraftController_1.CourseDraftController();
            await templateService.apiHandler({
                methodName: 'Finalize',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsCourseDraftController_Abandon = {
        sessionId: { "in": "path", "name": "sessionId", "required": true, "dataType": "string" },
        body: { "in": "body", "name": "body", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "tutorId": { "dataType": "string", "required": true } } },
    };
    app.post('/ai_v1/course-draft/:sessionId/abandon', ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController)), ...((0, runtime_1.fetchMiddlewares)(CourseDraftController_1.CourseDraftController.prototype.Abandon)), async function CourseDraftController_Abandon(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_Abandon, request, response });
            const controller = new CourseDraftController_1.CourseDraftController();
            await templateService.apiHandler({
                methodName: 'Abandon',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAIController_health = {};
    app.get('/ai_v1/ai-health', ...((0, runtime_1.fetchMiddlewares)(AIController_1.AIController)), ...((0, runtime_1.fetchMiddlewares)(AIController_1.AIController.prototype.health)), async function AIController_health(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAIController_health, request, response });
            const controller = new AIController_1.AIController();
            await templateService.apiHandler({
                methodName: 'health',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAIController_TestPrompt = {
        data: { "in": "body", "name": "data", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "prompt": { "dataType": "string", "required": true } } },
    };
    app.post('/ai_v1/test-prompt', ...((0, runtime_1.fetchMiddlewares)(AIController_1.AIController)), ...((0, runtime_1.fetchMiddlewares)(AIController_1.AIController.prototype.TestPrompt)), async function AIController_TestPrompt(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAIController_TestPrompt, request, response });
            const controller = new AIController_1.AIController();
            await templateService.apiHandler({
                methodName: 'TestPrompt',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAIController_TranslateLanguage = {
        data: { "in": "body", "name": "data", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "languageCode": { "dataType": "string", "required": true }, "lang": { "dataType": "string", "required": true }, "text": { "dataType": "string", "required": true } } },
    };
    app.post('/ai_v1/translate-language', ...((0, runtime_1.fetchMiddlewares)(AIController_1.AIController)), ...((0, runtime_1.fetchMiddlewares)(AIController_1.AIController.prototype.TranslateLanguage)), async function AIController_TranslateLanguage(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAIController_TranslateLanguage, request, response });
            const controller = new AIController_1.AIController();
            await templateService.apiHandler({
                methodName: 'TranslateLanguage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAIController_FetchUsers = {};
    app.get('/ai_v1/ai-fetch-users', ...((0, runtime_1.fetchMiddlewares)(AIController_1.AIController)), ...((0, runtime_1.fetchMiddlewares)(AIController_1.AIController.prototype.FetchUsers)), async function AIController_FetchUsers(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAIController_FetchUsers, request, response });
            const controller = new AIController_1.AIController();
            await templateService.apiHandler({
                methodName: 'FetchUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAIController_SearchAgentController = {
        data: { "in": "body", "name": "data", "required": true, "dataType": "nestedObjectLiteral", "nestedProperties": { "query": { "dataType": "string", "required": true } } },
    };
    app.post('/ai_v1/search', ...((0, runtime_1.fetchMiddlewares)(AIController_1.AIController)), ...((0, runtime_1.fetchMiddlewares)(AIController_1.AIController.prototype.SearchAgentController)), async function AIController_SearchAgentController(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAIController_SearchAgentController, request, response });
            const controller = new AIController_1.AIController();
            await templateService.apiHandler({
                methodName: 'SearchAgentController',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
//# sourceMappingURL=routes.js.map