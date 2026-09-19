/**
 * Centralized server-only client factory. The request key exists only for the
 * lifetime of one prototype request. It is never persisted by the server.
 */
export function getOpenAIClient(requestKey?: string) {
  const apiKey = requestKey?.trim();
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
            signal: AbortSignal.timeout(12_000),
          });
        } catch {
          throw new OpenAINetworkError();
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

/** Contains only allow-listed provider metadata, never the raw response or request. */
export class OpenAIRequestError extends Error {
  constructor(
    public status: number,
    public code?: string,
    public errorType?: string,
    public param?: string,
  ) {
    super("OpenAI request failed");
    this.name = "OpenAIRequestError";
  }
}

export class OpenAINetworkError extends Error {
  constructor() {
    super("OpenAI network request failed");
    this.name = "OpenAINetworkError";
  }
}

export function temporaryKeyFrom(request: Request) {
  const key = request.headers.get("x-common-openai-key")?.trim();
  return key && key.length <= 256 ? key : undefined;
}
