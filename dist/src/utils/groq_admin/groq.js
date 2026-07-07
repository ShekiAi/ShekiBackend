"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groq = void 0;
const groq_sdk_1 = require("groq-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
exports.groq = new groq_sdk_1.Groq({
    apiKey: process.env.GROQ_API_KEY // Store your key in the .env file
});
//# sourceMappingURL=groq.js.map