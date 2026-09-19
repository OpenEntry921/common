import { validAdminPin } from "@/lib/admin-auth";
import { getOpenAIClient, OpenAINetworkError, OpenAIRequestError, temporaryKeyFrom } from "@/lib/openai-server";

export const runtime = "nodejs";

const attempts = new Map<string, number[]>();

type ConnectionError = "authentication" | "billing" | "usage_limit" | "rate_limit" | "model" | "request" | "network" | "unknown";

const safeErrors: Record<ConnectionError, { title: string; message: string }> = {
  authentication: { title: "AI 연결 안 됨", message: "API Key 인증에 실패했습니다.\nOpenAI API Key를 다시 확인해주세요." },
  billing: { title: "API 크레딧 필요", message: "OpenAI API 사용 가능한 크레딧이 없습니다.\nOpenAI API Platform에서 Billing 및 Credit Balance를 확인해주세요." },
  usage_limit: { title: "API 사용 한도 확인 필요", message: "OpenAI 프로젝트 또는 조직의 API 사용 한도를 확인해주세요." },
  rate_limit: { title: "잠시 후 다시 시도해주세요", message: "OpenAI API 호출 한도에 도달했습니다.\n잠시 후 다시 연결해주세요." },
  model: { title: "AI 모델 설정 확인 필요", message: "현재 설정된 AI 모델을 사용할 수 없습니다.\n모델 설정 또는 프로젝트 권한을 확인해주세요." },
  request: { title: "AI 요청 설정 확인 필요", message: "OpenAI 연결 요청 설정이 올바르지 않습니다.\n관리자에게 문의해주세요." },
  network: { title: "OpenAI 연결 실패", message: "OpenAI 서버와 연결하지 못했습니다.\n잠시 후 다시 시도해주세요." },
  unknown: { title: "연결 실패", message: "OpenAI 연결 테스트에 실패했습니다.\n잠시 후 다시 시도해주세요." },
};

function classify(error: OpenAIRequestError): ConnectionError {
  const code = (error.code ?? "").toLowerCase();
  const type = (error.errorType ?? "").toLowerCase();
  const metadata = `${code} ${type}`;
  if (["organization_usage_limit_exceeded", "organization_spend_limit_exceeded", "project_spend_limit_exceeded"].some(value => metadata.includes(value))) return "usage_limit";
  if (["credit_balance_exhausted", "insufficient_quota", "billing"].some(value => metadata.includes(value))) return "billing";
  if (error.status === 401 || ["authentication_error", "invalid_api_key"].some(value => metadata.includes(value))) return "authentication";
  if (code === "model_not_found" || (metadata.includes("model") && (metadata.includes("access") || metadata.includes("permission"))) || error.status === 403) return "model";
  if (error.status === 429) return "rate_limit";
  if (error.status === 400) return "request";
  return "unknown";
}

function errorResponse(kind: ConnectionError, status = 502) {
  return Response.json({ ok: false, reason: kind, ...safeErrors[kind] }, { status });
}

function responseStatus(error: OpenAIRequestError) {
  // Preserve meaningful provider/client failure classes without returning its raw body.
  if ([400, 401, 403, 429].includes(error.status)) return error.status;
  return 502;
}

export async function POST(request: Request) {
  if (!validAdminPin(request)) return Response.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now(); const recent = (attempts.get(ip) ?? []).filter(t => now - t < 60_000);
  if (recent.length >= 5) return errorResponse("rate_limit", 429);
  recent.push(now); attempts.set(ip, recent);
  const client = getOpenAIClient(temporaryKeyFrom(request));
  if (!client) return errorResponse("authentication", 400);
  try {
    // Keep the probe intentionally minimal. Small output limits can be below a
    // model's supported minimum and are not needed to prove API connectivity.
    await client.responses.create({ model: process.env.OPENAI_MODEL || "gpt-5.6", input: "Reply with OK." });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof OpenAIRequestError) {
      if (process.env.NODE_ENV === "development") {
        // Never log the key, headers, request content, or provider message/body.
        console.info(`[OpenAI Connection Test]\nstatus: ${error.status}\ncode: ${error.code ?? "unknown"}\ntype: ${error.errorType ?? "unknown"}\nparam: ${error.param ?? "unknown"}`);
      }
      return errorResponse(classify(error), responseStatus(error));
    }
    return errorResponse(error instanceof OpenAINetworkError ? "network" : "unknown");
  }
}
