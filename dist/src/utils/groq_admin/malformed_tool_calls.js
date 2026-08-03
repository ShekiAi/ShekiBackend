"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFunctionTag = parseFunctionTag;
exports.containsFunctionTag = containsFunctionTag;
exports.stripFunctionTags = stripFunctionTags;
exports.isToolUseFailedError = isToolUseFailedError;
exports.failedGenerationOf = failedGenerationOf;
exports.recoverCompletionFromError = recoverCompletionFromError;
// utils/groq_admin/malformed_tool_calls.ts
//
// Llama-3.3-70b via Groq intermittently emits tool calls in the alternate
// native syntax Meta's models were trained on — `<function=name{args}</function>`
// — instead of a structured tool_calls response. This surfaces two different
// ways, and both have been seen live:
//
//   1. Groq REJECTS it with a 400 tool_use_failed, and the offending text
//      comes back in the error's `failed_generation` field.
//   2. Groq ACCEPTS the completion and hands the raw tag back as ordinary
//      assistant `content` — which then rendered verbatim to a real user
//      ("...what kind of guidance you need? <function=search_tutors{...}>").
//
// Case 2 is the nastier one: nothing errors, so without this the garbage
// reaches the UI. Both are handled by parsing the tag back into a real tool
// call. Prompt instructions alone don't fix this (tested live) — it's a
// decoding-level habit, not an instruction-following failure.
const crypto_1 = require("crypto");
const FUNCTION_TAG = /<function=([a-zA-Z_][\w]*)\s*(\{[\s\S]*?\})\s*(?:<\/function>|>)?/;
/** Pulls a tool call out of the malformed tag, or null if there isn't a valid one. */
function parseFunctionTag(text) {
    if (!text)
        return null;
    const match = text.match(FUNCTION_TAG);
    if (!match)
        return null;
    const [, name, argsJson] = match;
    try {
        JSON.parse(argsJson); // only trust it if the args actually parse
    }
    catch {
        return null;
    }
    return { id: `call_${(0, crypto_1.randomUUID)()}`, type: "function", function: { name, arguments: argsJson } };
}
/** True if the text contains a malformed function tag at all. */
function containsFunctionTag(text) {
    return !!text && FUNCTION_TAG.test(text);
}
/** Strips the tag out so whatever real prose surrounded it can still be shown. */
function stripFunctionTags(text) {
    if (!text)
        return "";
    return text.replace(new RegExp(FUNCTION_TAG.source, "g"), "").trim();
}
/**
 * groq-sdk's APIError nests the API's response body one level deeper than it
 * looks: `error.error` IS the body, itself shaped {error: {code, ...}} — so
 * the real fields live at error.error.error.*. Verified by dumping a real
 * captured error; a shallower lookup silently never matches.
 */
function isToolUseFailedError(error) {
    return (error?.error?.error?.code === "tool_use_failed" ||
        error?.error?.code === "tool_use_failed" ||
        error?.code === "tool_use_failed");
}
function failedGenerationOf(error) {
    return error?.error?.error?.failed_generation || error?.error?.failed_generation || error?.failed_generation || "";
}
/** Rebuilds a normal-looking completion response from a rejected generation. */
function recoverCompletionFromError(error) {
    const toolCall = parseFunctionTag(failedGenerationOf(error));
    if (!toolCall)
        return null;
    return { choices: [{ message: { role: "assistant", content: null, tool_calls: [toolCall] } }] };
}
//# sourceMappingURL=malformed_tool_calls.js.map