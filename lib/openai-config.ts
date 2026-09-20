/** Browser-only prototype storage. Never store or log the value itself. */
export const OPENAI_SESSION_KEY = "common_openai_api_key";
export const OPENAI_KEY_HEADER = "x-common-openai-key";

export type HeartLetterMode = "demo" | "live" | "fallback";
export type HeartLetterFallbackReason = "no_api_key" | "openai_error" | "timeout" | "schema_error";
