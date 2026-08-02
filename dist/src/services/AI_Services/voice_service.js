"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAIService = void 0;
// services/AI_Services/voice_service.ts
const groq_1 = require("../../utils/groq_admin/groq");
const groq_sdk_1 = require("groq-sdk");
const STT_MODEL = "whisper-large-v3-turbo";
// playai-tts was decommissioned by Groq (confirmed live: the account's
// /models list no longer includes any playai-tts* model at all — only
// canopylabs/orpheus-v1-english + orpheus-arabic-saudi remain for TTS).
// Orpheus is also a better fit for the "sound more human" ask than PlayAI
// was. Valid voices confirmed via a live probe call: autumn, diana, hannah,
// austin, daniel, troy.
const TTS_MODEL = "canopylabs/orpheus-v1-english";
const DEFAULT_VOICE = "autumn";
class VoiceAIService {
    static async transcribe(buffer, filename) {
        const file = await (0, groq_sdk_1.toFile)(buffer, filename);
        const result = await groq_1.groq.audio.transcriptions.create({ file, model: STT_MODEL });
        return result.text;
    }
    // Orpheus only supports `wav` output (confirmed live — `mp3` is rejected
    // with "response_format must be one of [wav]").
    static async speak(text, voice = DEFAULT_VOICE) {
        const response = await groq_1.groq.audio.speech.create({
            input: text,
            model: TTS_MODEL,
            voice,
            response_format: "wav",
        });
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}
exports.VoiceAIService = VoiceAIService;
//# sourceMappingURL=voice_service.js.map