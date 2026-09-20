import "server-only";

import { HEART_LETTER_INSTRUCTIONS } from "@/lib/heart-letter";

export const HEART_LETTER_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-5.6";
export const OPENAI_TIMEOUT_MS = 12_000;
export const HEART_LETTER_MAX_OUTPUT_TOKENS = 1000;

export const HEART_LETTER_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    empathy: { type: "string" }, scriptureReference: { type: "string" }, scriptureShortText: { type: "string" },
    scriptureType: { type: "string", enum: ["jesus", "bible"] }, scriptureContext: { type: "string" },
    reflection: { type: "string" }, suggestedAction: { type: "string" }, followUpQuestion: { type: "string" },
  },
  required: ["empathy", "scriptureReference", "scriptureShortText", "scriptureType", "scriptureContext", "reflection", "suggestedAction", "followUpQuestion"],
} as const;

export function heartLetterRequest(input: { role: "user" | "assistant"; content: string }[], instructions = HEART_LETTER_INSTRUCTIONS) {
  return {
    model: HEART_LETTER_MODEL,
    instructions,
    input,
    text: { format: { type: "json_schema", name: "heart_letter", strict: true, schema: HEART_LETTER_OUTPUT_SCHEMA } },
    max_output_tokens: HEART_LETTER_MAX_OUTPUT_TOKENS,
  };
}

export function isHeartLetterOutput(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const output = value as Record<string, unknown>;
  return HEART_LETTER_OUTPUT_SCHEMA.required.every(key => typeof output[key] === "string") &&
    ["jesus", "bible"].includes(String(output.scriptureType));
}
