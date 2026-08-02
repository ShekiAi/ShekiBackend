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
