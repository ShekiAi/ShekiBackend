// utils/documents/extract_text.ts
//
// Turns an uploaded document into plain text so the assistant can actually
// reason about its contents. Deliberately conservative: anything we can't
// read cleanly is reported as an error the tutor/student can understand,
// rather than feeding the model binary noise it would then hallucinate over.
const MAX_CHARS = 20000; // keeps a long document from blowing the context window

export interface ExtractedDocument {
  text: string;
  truncated: boolean;
}

export async function extractDocumentText(
  buffer: Buffer,
  filename: string,
  mimetype: string,
): Promise<ExtractedDocument> {
  const lower = (filename || "").toLowerCase();
  let text = "";

  if (mimetype === "application/pdf" || lower.endsWith(".pdf")) {
    // pdf-parse's entry point runs a debug harness when imported by path,
    // so require the package root and tolerate either export shape.
    const mod: any = require("pdf-parse");
    const pdfParse = typeof mod === "function" ? mod : mod.default ?? mod.pdf;
    const parsed = await pdfParse(buffer);
    text = parsed?.text ?? "";
  } else if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const mammoth: any = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    text = result?.value ?? "";
  } else if (mimetype.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md")) {
    text = buffer.toString("utf8");
  } else if (lower.endsWith(".doc")) {
    // Legacy binary .doc isn't a zip archive, so mammoth can't read it.
    throw new Error("Older .doc files aren't supported — please save it as .docx or PDF and try again.");
  } else {
    throw new Error("I can read PDF, DOCX, TXT and MD files — please try one of those.");
  }

  text = text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (!text) {
    throw new Error("I couldn't find any readable text in that file — if it's a scanned image, a typed version would work better.");
  }

  return {
    text: text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text,
    truncated: text.length > MAX_CHARS,
  };
}
