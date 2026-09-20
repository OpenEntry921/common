import "server-only";
import { HEART_LETTER_MODEL, OPENAI_TIMEOUT_MS } from "@/lib/heart-letter-ai";

/**
 * Centralized server-only client factory. Secrets are read exclusively from
 * the server process and are never accepted from a browser request.
 */
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    responses: {
      async create(payload: unknown) {
        let response: Response;
        try {
          response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
          });
        } catch (error) {
          throw new OpenAINetworkError(error instanceof DOMException && error.name === "TimeoutError");
        }
        if (!response.ok) {
          let code: string | undefined;
          let type: string | undefined;
          let param: string | undefined;
          try {
            const metadata: unknown = await response.json();
            if (metadata && typeof metadata === "object" && "error" in metadata) {
              const providerError = metadata.error;
              if (providerError && typeof providerError === "object") {
                code = safeErrorField("code" in providerError ? providerError.code : undefined);
                type = safeErrorField("type" in providerError ? providerError.type : undefined);
                param = safeErrorField("param" in providerError ? providerError.param : undefined);
              }
            }
          } catch { /* A non-JSON error body has no safe metadata. */ }
          throw new OpenAIRequestError(
            response.status,
            code,
            type,
            param,
            parseRetryAfter(response.headers.get("retry-after")),
          );
        }
        const data = await response.json() as { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };
        const output_text = data.output_text ?? data.output?.flatMap(item => item.content ?? []).find(item => item.type === "output_text")?.text ?? "";
        return { output_text };
      },
    },
  };
}

function safeErrorField(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9_.:-]{1,100}$/.test(value) ? value : undefined;
}

function parseRetryAfter(value: string | null) {
  if (!value) return undefined;
  const seconds = Number(value);
  const milliseconds = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(value) - Date.now();
  // Do not let an upstream header hold a user request open indefinitely.
  return Number.isFinite(milliseconds) && milliseconds >= 0 && milliseconds <= 10_000
    ? Math.ceil(milliseconds)
    : undefined;
}

/** Contains only allow-listed provider metadata, never the raw response or request. */
export class OpenAIRequestError extends Error {
  constructor(
    public status: number,
    public code?: string,
    public errorType?: string,
    public param?: string,
    public retryAfterMs?: number,
  ) {
    super("OpenAI request failed");
    this.name = "OpenAIRequestError";
  }
}

export class OpenAINetworkError extends Error {
  constructor(public timedOut = false) {
    super("OpenAI network request failed");
    this.name = "OpenAINetworkError";
  }
}

export function openAIModel() {
  return HEART_LETTER_MODEL;
}
