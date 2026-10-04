import "server-only";
import { generateText, Output, type ModelMessage } from "ai";
import { extractText, getDocumentProxy } from "unpdf";
import { cvInstructions, cvSchema, type CvData } from "@/lib/ai/cv-schema";
import { geminiModel, geminiModelId } from "@/lib/ai/gemini";

export const MAX_CV_PAGES = 8;
const MIN_TEXT_LENGTH = 200;
const MAX_TEXT_LENGTH = 60_000;

export type PdfInfo = { pages: number; text: string };

export async function inspectPdf(bytes: Uint8Array): Promise<PdfInfo> {
  // pdf.js may transfer the buffer it is given, so it gets its own copy.
  const pdf = await getDocumentProxy(bytes.slice());
  const { text } = await extractText(pdf, { mergePages: true });
  return { pages: pdf.numPages, text: text.replace(/[ \t]+/g, " ").trim().slice(0, MAX_TEXT_LENGTH) };
}

export type ParseUsage = { model: string; inputTokens: number; outputTokens: number; attempts: number };

export class CvParseError extends Error {
  constructor(
    message: string,
    readonly usage: ParseUsage,
  ) {
    super(message);
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 500);
  return "Unknown error";
}

function usageOf(source: unknown) {
  const usage = (source as { usage?: { inputTokens?: number; outputTokens?: number } } | null)?.usage;
  return { input: usage?.inputTokens ?? 0, output: usage?.outputTokens ?? 0 };
}

/**
 * Sends the PDF to Gemini; on any failure retries once, using the extracted text when there is
 * enough of it (a different input often fixes a bad first answer), otherwise the PDF again.
 */
export async function parseCv(bytes: Uint8Array, info: PdfInfo): Promise<{ data: CvData; usage: ParseUsage }> {
  const usage: ParseUsage = { model: geminiModelId(), inputTokens: 0, outputTokens: 0, attempts: 0 };
  const fromPdf: ModelMessage[] = [
    {
      role: "user",
      content: [
        { type: "text", text: "Extract the CV in this PDF." },
        { type: "file", data: bytes, mediaType: "application/pdf", filename: "cv.pdf" },
      ],
    },
  ];
  const fromText: ModelMessage[] = [
    {
      role: "user",
      content: `Extract the CV below. It was extracted from a PDF, so layout may be lost.\n\n<cv>\n${info.text}\n</cv>`,
    },
  ];
  const inputs = [fromPdf, info.text.length >= MIN_TEXT_LENGTH ? fromText : fromPdf];

  let lastError = "";
  for (const messages of inputs) {
    usage.attempts += 1;
    try {
      const result = await generateText({
        model: geminiModel(),
        instructions: cvInstructions,
        messages,
        output: Output.object({ schema: cvSchema }),
        temperature: 0,
        maxRetries: 1,
      });
      const tokens = usageOf(result);
      usage.inputTokens += tokens.input;
      usage.outputTokens += tokens.output;
      const checked = cvSchema.safeParse(result.output);
      if (checked.success) return { data: checked.data, usage };
      lastError = "The model returned data that does not match the CV schema.";
    } catch (error) {
      const tokens = usageOf(error);
      usage.inputTokens += tokens.input;
      usage.outputTokens += tokens.output;
      lastError = errorMessage(error);
    }
  }
  throw new CvParseError(lastError, usage);
}
