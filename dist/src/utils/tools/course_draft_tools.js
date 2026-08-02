"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseDraftTools = void 0;
// utils/tools/course_draft_tools.ts
//
// Tools the course-drafting assistant can call. Every one of these only
// mutates CourseDraftSession.draftJson (an in-progress, unpersisted draft) —
// none of them ever writes to the real Course/Module/Lesson/Objectives/
// quizzes/questions tables. Real persistence only happens through the
// explicit /finalize endpoint once a tutor approves the draft, so a
// hallucinated tool call can never create garbage production data.
exports.getCourseDraftTools = [
    {
        type: "function",
        function: {
            name: "set_course_overview",
            description: "Set or update the course's title, descriptions, and level.",
            parameters: {
                type: "object",
                properties: {
                    course_title: { type: "string" },
                    course_short_description: { type: "string" },
                    course_description: { type: "string" },
                    course_level: { type: "string", description: "e.g. Beginner, Intermediate, Advanced" },
                },
                required: ["course_title"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_module",
            description: "Add a new module (a section/unit) to the course. Returns a moduleDraftId to use when adding lessons to it.",
            parameters: {
                type: "object",
                properties: {
                    module_title: { type: "string" },
                    module_description: { type: "string" },
                    module_duration: { type: "string", description: "e.g. '2 hours', '45 minutes'" },
                    order: { type: "number" },
                },
                required: ["module_title", "module_description", "module_duration"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "update_module",
            description: "Update fields on an existing module by its moduleDraftId.",
            parameters: {
                type: "object",
                properties: {
                    moduleDraftId: { type: "string" },
                    module_title: { type: "string" },
                    module_description: { type: "string" },
                    module_duration: { type: "string" },
                    order: { type: "number" },
                },
                required: ["moduleDraftId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_lesson",
            description: "Add a lesson to a module. This never produces a real video — suggested_video_brief is guidance for what the tutor should film later, never a real lesson_video URL.",
            parameters: {
                type: "object",
                properties: {
                    moduleDraftId: { type: "string" },
                    lesson_title: { type: "string" },
                    suggested_video_brief: { type: "string", description: "What the tutor should cover on camera for this lesson." },
                    duration: { type: "number", description: "Estimated minutes." },
                    order: { type: "number" },
                },
                required: ["moduleDraftId", "lesson_title", "suggested_video_brief"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_material",
            description: "Add a supplementary material (a document/handout) to the course. Never produces a real document — suggested_content_brief is guidance for what the tutor should write later.",
            parameters: {
                type: "object",
                properties: {
                    material_title: { type: "string" },
                    material_description: { type: "string" },
                    material_pages: { type: "number" },
                    suggested_content_brief: { type: "string" },
                },
                required: ["material_title", "suggested_content_brief"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "set_objectives",
            description: "Set the course's 5 learning objectives. Always exactly 5 — pad with reasonable objectives or combine ideas if the tutor gives fewer.",
            parameters: {
                type: "object",
                properties: {
                    objective_title1: { type: "string" },
                    objective_title2: { type: "string" },
                    objective_title3: { type: "string" },
                    objective_title4: { type: "string" },
                    objective_title5: { type: "string" },
                },
                required: ["objective_title1", "objective_title2", "objective_title3", "objective_title4", "objective_title5"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_quiz",
            description: "Add a quiz to the course. Returns a quizDraftId to use when adding questions to it.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    duration: { type: "number", description: "Minutes allowed to complete the quiz." },
                    passingScore: { type: "number", description: "Percentage required to pass, e.g. 70." },
                    maxAttempts: { type: "number" },
                },
                required: ["title"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "add_quiz_question",
            description: "Add a multiple-choice question to a quiz.",
            parameters: {
                type: "object",
                properties: {
                    quizDraftId: { type: "string" },
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" }, description: "The answer choices." },
                    correctAnswer: { type: "string", description: "Must exactly match one of the options." },
                    explanation: { type: "string" },
                    points: { type: "number" },
                    order: { type: "number" },
                },
                required: ["quizDraftId", "question", "options", "correctAnswer"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "remove_module",
            description: "Remove a module (and its lessons) from the draft by its moduleDraftId.",
            parameters: {
                type: "object",
                properties: { moduleDraftId: { type: "string" } },
                required: ["moduleDraftId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "remove_lesson",
            description: "Remove a single lesson from a module by its lessonDraftId.",
            parameters: {
                type: "object",
                properties: {
                    moduleDraftId: { type: "string" },
                    lessonDraftId: { type: "string" },
                },
                required: ["moduleDraftId", "lessonDraftId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "remove_quiz_question",
            description: "Remove a single question from a quiz by its questionDraftId.",
            parameters: {
                type: "object",
                properties: {
                    quizDraftId: { type: "string" },
                    questionDraftId: { type: "string" },
                },
                required: ["quizDraftId", "questionDraftId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_draft_snapshot",
            description: "Get the current full state of the course draft so far. Use this to re-orient yourself, especially at the start of a resumed conversation.",
            parameters: { type: "object", properties: {}, required: [] },
        },
    },
    {
        type: "function",
        function: {
            name: "mark_ready_for_review",
            description: "Call this ONLY when the tutor has explicitly confirmed the draft looks good and is ready to be created as a real course. This does not create the course itself — it just signals the draft is ready for the tutor's final approval step.",
            parameters: {
                type: "object",
                properties: {
                    summary: { type: "string", description: "A short human-readable summary of the finished draft." },
                },
                required: ["summary"],
            },
        },
    },
];
//# sourceMappingURL=course_draft_tools.js.map