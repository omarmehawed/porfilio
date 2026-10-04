import "server-only";
import { createGoogle } from "@ai-sdk/google";

const DEFAULT_MODEL = "gemini-flash-latest";

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function geminiModelId() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export function geminiModel() {
  const google = createGoogle({ apiKey: process.env.GEMINI_API_KEY });
  return google(geminiModelId());
}
