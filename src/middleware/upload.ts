// middleware/upload.ts
import multer from "multer";

const ALLOWED_MIME_PREFIXES = ["audio/"];
const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15MB — comfortably above a few minutes of spoken tutor input

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_PREFIXES.some((prefix) => file.mimetype.startsWith(prefix))) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Only audio files are accepted.`));
    }
  },
});

const MAX_DOC_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_DOC_EXT = /\.(pdf|docx|doc|txt|md)$/i;

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOC_BYTES },
  fileFilter: (_req, file, cb) => {
    // Trust the extension as well as the mimetype — browsers report
    // inconsistent types for .md/.docx, and rejecting on mimetype alone
    // turned away legitimate files.
    if (ALLOWED_DOC_EXT.test(file.originalname || "")) cb(null, true);
    else cb(new Error("Please upload a PDF, DOCX, TXT or MD file."));
  },
});
