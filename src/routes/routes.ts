/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserController } from './../controllers/UserController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MentorMatchController } from './../controllers/MentorMatchController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CourseDraftController } from './../controllers/CourseDraftController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AIController } from './../controllers/AIController';
import { expressAuthentication } from './../middleware/auth';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "APIResponse": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "data": {"dataType":"array","array":{"dataType":"any"},"required":true},
            "status": {"dataType":"double","required":true},
            "error": {"dataType":"array","array":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsUserController_health: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/auth/health',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.health)),

            async function UserController_health(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_health, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'health',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMentorMatchController_Start: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"studentName":{"dataType":"string","required":true},"studentId":{"dataType":"string","required":true}}},
        };
        app.post('/ai_v1/mentor-match/start',
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController)),
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController.prototype.Start)),

            async function MentorMatchController_Start(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_Start, request, response });

                const controller = new MentorMatchController();

              await templateService.apiHandler({
                methodName: 'Start',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMentorMatchController_Message: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true},"studentName":{"dataType":"string","required":true},"studentId":{"dataType":"string","required":true}}},
        };
        app.post('/ai_v1/mentor-match/:sessionId/message',
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController)),
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController.prototype.Message)),

            async function MentorMatchController_Message(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_Message, request, response });

                const controller = new MentorMatchController();

              await templateService.apiHandler({
                methodName: 'Message',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMentorMatchController_VoiceMessage: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/ai_v1/mentor-match/:sessionId/voice-message',
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController)),
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController.prototype.VoiceMessage)),

            async function MentorMatchController_VoiceMessage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_VoiceMessage, request, response });

                const controller = new MentorMatchController();

              await templateService.apiHandler({
                methodName: 'VoiceMessage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMentorMatchController_GetSession: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                studentId: {"in":"query","name":"studentId","required":true,"dataType":"string"},
        };
        app.get('/ai_v1/mentor-match/:sessionId',
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController)),
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController.prototype.GetSession)),

            async function MentorMatchController_GetSession(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_GetSession, request, response });

                const controller = new MentorMatchController();

              await templateService.apiHandler({
                methodName: 'GetSession',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMentorMatchController_ListMine: Record<string, TsoaRoute.ParameterSchema> = {
                studentId: {"in":"query","name":"studentId","required":true,"dataType":"string"},
        };
        app.get('/ai_v1/mentor-match/mine/list',
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController)),
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController.prototype.ListMine)),

            async function MentorMatchController_ListMine(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_ListMine, request, response });

                const controller = new MentorMatchController();

              await templateService.apiHandler({
                methodName: 'ListMine',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMentorMatchController_Abandon: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"studentId":{"dataType":"string","required":true}}},
        };
        app.post('/ai_v1/mentor-match/:sessionId/abandon',
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController)),
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController.prototype.Abandon)),

            async function MentorMatchController_Abandon(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_Abandon, request, response });

                const controller = new MentorMatchController();

              await templateService.apiHandler({
                methodName: 'Abandon',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMentorMatchController_Document: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/ai_v1/mentor-match/:sessionId/document',
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController)),
            ...(fetchMiddlewares<RequestHandler>(MentorMatchController.prototype.Document)),

            async function MentorMatchController_Document(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMentorMatchController_Document, request, response });

                const controller = new MentorMatchController();

              await templateService.apiHandler({
                methodName: 'Document',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseDraftController_Start: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"tutorName":{"dataType":"string","required":true},"tutorId":{"dataType":"string","required":true}}},
        };
        app.post('/ai_v1/course-draft/start',
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController)),
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController.prototype.Start)),

            async function CourseDraftController_Start(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_Start, request, response });

                const controller = new CourseDraftController();

              await templateService.apiHandler({
                methodName: 'Start',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseDraftController_Message: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true},"tutorName":{"dataType":"string","required":true},"tutorId":{"dataType":"string","required":true}}},
        };
        app.post('/ai_v1/course-draft/:sessionId/message',
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController)),
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController.prototype.Message)),

            async function CourseDraftController_Message(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_Message, request, response });

                const controller = new CourseDraftController();

              await templateService.apiHandler({
                methodName: 'Message',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseDraftController_VoiceMessage: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/ai_v1/course-draft/:sessionId/voice-message',
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController)),
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController.prototype.VoiceMessage)),

            async function CourseDraftController_VoiceMessage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_VoiceMessage, request, response });

                const controller = new CourseDraftController();

              await templateService.apiHandler({
                methodName: 'VoiceMessage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseDraftController_GetSession: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                tutorId: {"in":"query","name":"tutorId","required":true,"dataType":"string"},
        };
        app.get('/ai_v1/course-draft/:sessionId',
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController)),
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController.prototype.GetSession)),

            async function CourseDraftController_GetSession(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_GetSession, request, response });

                const controller = new CourseDraftController();

              await templateService.apiHandler({
                methodName: 'GetSession',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseDraftController_ListMine: Record<string, TsoaRoute.ParameterSchema> = {
                tutorId: {"in":"query","name":"tutorId","required":true,"dataType":"string"},
        };
        app.get('/ai_v1/course-draft/mine/list',
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController)),
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController.prototype.ListMine)),

            async function CourseDraftController_ListMine(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_ListMine, request, response });

                const controller = new CourseDraftController();

              await templateService.apiHandler({
                methodName: 'ListMine',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseDraftController_Finalize: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"tutorId":{"dataType":"string","required":true}}},
        };
        app.post('/ai_v1/course-draft/:sessionId/finalize',
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController)),
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController.prototype.Finalize)),

            async function CourseDraftController_Finalize(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_Finalize, request, response });

                const controller = new CourseDraftController();

              await templateService.apiHandler({
                methodName: 'Finalize',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseDraftController_Abandon: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"tutorId":{"dataType":"string","required":true}}},
        };
        app.post('/ai_v1/course-draft/:sessionId/abandon',
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController)),
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController.prototype.Abandon)),

            async function CourseDraftController_Abandon(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_Abandon, request, response });

                const controller = new CourseDraftController();

              await templateService.apiHandler({
                methodName: 'Abandon',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCourseDraftController_Document: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/ai_v1/course-draft/:sessionId/document',
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController)),
            ...(fetchMiddlewares<RequestHandler>(CourseDraftController.prototype.Document)),

            async function CourseDraftController_Document(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCourseDraftController_Document, request, response });

                const controller = new CourseDraftController();

              await templateService.apiHandler({
                methodName: 'Document',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAIController_health: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/ai_v1/ai-health',
            ...(fetchMiddlewares<RequestHandler>(AIController)),
            ...(fetchMiddlewares<RequestHandler>(AIController.prototype.health)),

            async function AIController_health(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAIController_health, request, response });

                const controller = new AIController();

              await templateService.apiHandler({
                methodName: 'health',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAIController_TestPrompt: Record<string, TsoaRoute.ParameterSchema> = {
                data: {"in":"body","name":"data","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"prompt":{"dataType":"string","required":true}}},
        };
        app.post('/ai_v1/test-prompt',
            ...(fetchMiddlewares<RequestHandler>(AIController)),
            ...(fetchMiddlewares<RequestHandler>(AIController.prototype.TestPrompt)),

            async function AIController_TestPrompt(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAIController_TestPrompt, request, response });

                const controller = new AIController();

              await templateService.apiHandler({
                methodName: 'TestPrompt',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAIController_TranslateLanguage: Record<string, TsoaRoute.ParameterSchema> = {
                data: {"in":"body","name":"data","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"languageCode":{"dataType":"string","required":true},"lang":{"dataType":"string","required":true},"text":{"dataType":"string","required":true}}},
        };
        app.post('/ai_v1/translate-language',
            ...(fetchMiddlewares<RequestHandler>(AIController)),
            ...(fetchMiddlewares<RequestHandler>(AIController.prototype.TranslateLanguage)),

            async function AIController_TranslateLanguage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAIController_TranslateLanguage, request, response });

                const controller = new AIController();

              await templateService.apiHandler({
                methodName: 'TranslateLanguage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAIController_FetchUsers: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/ai_v1/ai-fetch-users',
            ...(fetchMiddlewares<RequestHandler>(AIController)),
            ...(fetchMiddlewares<RequestHandler>(AIController.prototype.FetchUsers)),

            async function AIController_FetchUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAIController_FetchUsers, request, response });

                const controller = new AIController();

              await templateService.apiHandler({
                methodName: 'FetchUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAIController_SearchAgentController: Record<string, TsoaRoute.ParameterSchema> = {
                data: {"in":"body","name":"data","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"query":{"dataType":"string","required":true}}},
        };
        app.post('/ai_v1/search',
            ...(fetchMiddlewares<RequestHandler>(AIController)),
            ...(fetchMiddlewares<RequestHandler>(AIController.prototype.SearchAgentController)),

            async function AIController_SearchAgentController(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAIController_SearchAgentController, request, response });

                const controller = new AIController();

              await templateService.apiHandler({
                methodName: 'SearchAgentController',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
