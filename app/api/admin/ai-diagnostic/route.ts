import { validAdminPin } from "@/lib/admin-auth";
import { heartLetterRequest, isHeartLetterOutput } from "@/lib/heart-letter-ai";
import { getOpenAIClient, OpenAINetworkError, OpenAIRequestError, openAIModel } from "@/lib/openai-server";
import type { SafeAIError } from "@/lib/ai-diagnostic-state";

export const runtime = "nodejs";

function safeError(error: unknown, fallbackCode: string): SafeAIError {
  if (error instanceof OpenAIRequestError) {
    return { status: error.status, code: error.code || fallbackCode, type: error.errorType, param: error.param };
  }
  if (error instanceof OpenAINetworkError) return { code: error.timedOut ? "timeout" : "network_error" };
  return { code: fallbackCode };
}

export async function POST(request: Request) {
  if (!validAdminPin(request)) return Response.json({ error: { code: "unauthorized" } }, { status: 401 });

  const model = openAIModel();
  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  if (!configured) return Response.json({
    configured: false, openaiConnection: "not_configured", structuredAI: "not_configured",
    heartLetter: "demo", mode: "demo", model, error: { code: "missing_api_key" },
  });

  let client;
  try { client = getOpenAIClient(); } catch { client = null; }
  if (!client) return Response.json({
    configured: true, openaiConnection: "error", structuredAI: "error",
    heartLetter: "fallback", mode: "fallback", model, error: { code: "client_initialization_error" },
  });

  try {
    await client.responses.create({ model, input: "Reply with OK.", max_output_tokens: 64 });
  } catch (error) {
    return Response.json({
      configured: true, openaiConnection: "error", structuredAI: "not_tested",
      heartLetter: "fallback", mode: "fallback", model, error: safeError(error, "connection_error"),
    });
  }

  try {
    const response = await client.responses.create(heartLetterRequest(
      [{ role: "user", content: "오늘 하루를 차분히 돌아볼 수 있도록 짧게 답해주세요." }],
    ));
    let parsed: unknown;
    try { parsed = JSON.parse(response.output_text); } catch { parsed = null; }
    if (!isHeartLetterOutput(parsed)) throw new Error("Invalid structured output");
  } catch (error) {
    return Response.json({
      configured: true, openaiConnection: "ok", structuredAI: "error",
      heartLetter: "fallback", mode: "fallback", model, error: safeError(error, "schema_error"),
    });
  }

  return Response.json({
    configured: true, openaiConnection: "ok", structuredAI: "ok",
    heartLetter: "live", mode: "live", model, error: null,
  }, { headers: { "Cache-Control": "no-store" } });
}
