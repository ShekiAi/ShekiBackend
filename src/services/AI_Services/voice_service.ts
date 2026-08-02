// services/AI_Services/voice_service.ts
import { groq } from "../../utils/groq_admin/groq";
import { toFile } from "groq-sdk";

const STT_MODEL = "whisper-large-v3-turbo";
// playai-tts was decommissioned by Groq (confirmed live: the account's
// /models list no longer includes any playai-tts* model at all — only
// canopylabs/orpheus-v1-english + orpheus-arabic-saudi remain for TTS).
// Orpheus is also a better fit for the "sound more human" ask than PlayAI
// was. Valid voices confirmed via a live probe call: autumn, diana, hannah,
// austin, daniel, troy.
const TTS_MODEL = "canopylabs/orpheus-v1-english";
const DEFAULT_VOICE = "autumn";

export class VoiceAIService {
  static async transcribe(buffer: Buffer, filename: string): Promise<string> {
    const file = await toFile(buffer, filename);
    const result = await groq.audio.transcriptions.create({ file, model: STT_MODEL });
    return result.text;
  }

  // Orpheus only supports `wav` output (confirmed live — `mp3` is rejected
  // with "response_format must be one of [wav]").
  static async speak(text: string, voice: string = DEFAULT_VOICE): Promise<Buffer> {
    const response = await groq.audio.speech.create({
      input: text,
      model: TTS_MODEL,
      voice,
      response_format: "wav",
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
