/**
 * Centralized server-only client factory. The request key exists only for the
 * lifetime of one prototype request. Production should remove browser-supplied
 * keys and use a hosting-provider secret (OPENAI_API_KEY) exclusively.
 */
export function getOpenAIClient(requestKey?: string) {
  const apiKey = requestKey?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    responses: {
      async create(payload: unknown) {
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12_000),
        });
        if (!response.ok) throw new Error("OpenAI request failed");
        const data = await response.json() as { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };
        const output_text = data.output_text ?? data.output?.flatMap(item => item.content ?? []).find(item => item.type === "output_text")?.text ?? "";
        return { output_text };
      },
    },
  };
}

export function temporaryKeyFrom(request: Request) {
  const key = request.headers.get("x-common-openai-key")?.trim();
  return key && key.length <= 256 ? key : undefined;
}
