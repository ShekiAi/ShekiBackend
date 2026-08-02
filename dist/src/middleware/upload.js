"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioUpload = void 0;
// middleware/upload.ts
const multer_1 = __importDefault(require("multer"));
const ALLOWED_MIME_PREFIXES = ["audio/"];
const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15MB — comfortably above a few minutes of spoken tutor input
exports.audioUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: MAX_AUDIO_BYTES },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_PREFIXES.some((prefix) => file.mimetype.startsWith(prefix))) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Only audio files are accepted.`));
        }
    },
});
//# sourceMappingURL=upload.js.map