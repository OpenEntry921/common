import { createHash } from "node:crypto";
import { CRISIS_RESPONSE, FALLBACK_RESPONSE, HEART_LETTER_INSTRUCTIONS, MAX_MESSAGE_LENGTH, MAX_MESSAGES, hasCrisisLanguage, type ConversationMessage } from "@/lib/heart-letter";
import { getOpenAIClient, OpenAINetworkError, OpenAIRequestError, openAIModel } from "@/lib/openai-server";
import type { HeartLetterFallbackReason } from "@/lib/openai-config";
import { heartLetterRequest, isHeartLetterOutput } from "@/lib/heart-letter-ai";
import { recordAIFailure, recordAISuccess } from "@/lib/ai-diagnostic-state";

export const runtime = "nodejs";

const buckets = new Map<string, number[]>();
const repeatedRequests = new Map<string, { signature: string; count: number; since: number }>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (buckets.get(ip) ?? []).filter(time => now - time < 10 * 60_000);
  if (recent.length >= 10) return true;
  recent.push(now); buckets.set(ip, recent); return false;
}

function isRepeatedRequest(ip: string, signature: string) {
  const now = Date.now();
  const previous = repeatedRequests.get(ip);
  const repeated = previous && now - previous.since < 60_000 && previous.signature === signature
    ? { ...previous, count: previous.count + 1 }
    : { signature, count: 1, since: now };
  repeatedRequests.set(ip, repeated);
  return repeated.count > 3;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  console.log("[heart-letter] request_started");
  console.log("[heart-letter] api_key_configured", Boolean(process.env.OPENAI_API_KEY));

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return Response.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 20_000) {
    return Response.json({ error: "요청 내용이 너무 깁니다." }, { status: 413 });
  }

  let body: { messages?: ConversationMessage[]; excludeReferences?: string[] };
  try { body = await request.json(); } catch { return Response.json({ error: "올바르지 않은 요청입니다." }, { status: 400 }); }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES ||
      messages.some(m => !m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || !m.content.trim() || m.content.length > MAX_MESSAGE_LENGTH) ||
      messages.reduce((sum, m) => sum + m.content.length, 0) > 8000) {
    return Response.json({ error: "대화 내용을 확인해 주세요." }, { status: 400 });
  }
  if (body.excludeReferences !== undefined &&
      (!Array.isArray(body.excludeReferences) || body.excludeReferences.length > 5 ||
       body.excludeReferences.some(reference => typeof reference !== "string" || reference.length > 100))) {
    return Response.json({ error: "제외할 말씀 목록을 확인해 주세요." }, { status: 400 });
  }
  const signature = createHash("sha256").update(messages.map(message => `${message.role}:${message.content}`).join("\n")).digest("hex");
  if (isRepeatedRequest(ip, signature)) return Response.json({ error: "같은 요청이 반복되었습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  const latest = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
  if (hasCrisisLanguage(latest)) return Response.json({ data: CRISIS_RESPONSE, source: "safety", mode: "demo" });

  const client = getOpenAIClient();
  if (!client) {
    recordAIFailure({ code: "missing_api_key" }, "demo");
    return Response.json({
    data: FALLBACK_RESPONSE,
    source: "fallback",
    mode: "demo",
    fallbackReason: "no_api_key",
    notice: "현재 AI 마음편지가 데모 모드로 실행되고 있습니다.",
    });
  }

  const exclusions = (body.excludeReferences ?? []).slice(0, 5).join(", ");
  const model = openAIModel();
  const payload = heartLetterRequest(
    messages.map(m => ({ role: m.role, content: m.content })),
    `${HEART_LETTER_INSTRUCTIONS}\n${exclusions ? `이번 답변에서는 이미 제안한 다음 구절을 피하십시오: ${exclusions}` : ""}`,
  );
  let attempts = 0;
  while (attempts < 3) {
    attempts += 1;
    try {
      console.log("[heart-letter] openai_request_started", { elapsedMs: Date.now() - startedAt });
      const response = await client.responses.create(payload);
      console.log("[heart-letter] openai_response_received", { elapsedMs: Date.now() - startedAt });
      let parsed: Record<string, unknown>;
      try {
        console.log("[heart-letter] response_parse_started", { elapsedMs: Date.now() - startedAt });
        parsed = JSON.parse(response.output_text) as Record<string, unknown>;
        if (!isHeartLetterOutput(parsed)) {
          throw new Error("Invalid structured output");
        }
      } catch (error) {
        logRequestFailure(error, startedAt);
        logFailure("schema_error", attempts);
        return fallback("schema_error");
      }
      recordAISuccess(attempts);
      if (process.env.NODE_ENV === "development") console.info(`[Heart Letter]\nmode: live\nstatus: success\nmodel: ${model}\nattempts: ${attempts}`);
      console.log("[heart-letter] request_completed", { elapsedMs: Date.now() - startedAt });
      return Response.json({ data: parsed, source: "openai", mode: "live" });
    } catch (error) {
      logRequestFailure(error, startedAt);
      const retryable = isRetryableOpenAIError(error);
      if (retryable && attempts < 3) {
        const backoff = attempts === 1 ? 800 : 1500;
        const delay = error instanceof OpenAIRequestError && error.retryAfterMs !== undefined
          ? Math.max(backoff, error.retryAfterMs)
          : backoff;
        await sleep(delay);
        continue;
      }
      if (error instanceof OpenAIRequestError) {
        logFailure("openai_error", attempts, error);
        return fallback("openai_error");
      }
      const reason = error instanceof OpenAINetworkError && error.timedOut ? "timeout" : "openai_error";
      logFailure(reason, attempts);
      return fallback(reason);
    }
  }

  // The bounded loop always returns, but keep a safe terminal response if it is changed later.
  logFailure("openai_error", attempts);
  return fallback("openai_error");
}

function logRequestFailure(error: unknown, startedAt: number) {
  console.error("[heart-letter] request_failed", {
    status: error instanceof OpenAIRequestError ? error.status : undefined,
    code: error instanceof OpenAIRequestError ? error.code : undefined,
    type: error instanceof OpenAIRequestError ? error.errorType : undefined,
    name: error instanceof Error ? error.name : "unknown",
    message: error instanceof Error ? error.message : "unknown",
    elapsedMs: Date.now() - startedAt,
  });
}

function isRetryableOpenAIError(error: unknown) {
  if (error instanceof OpenAINetworkError) return true;
  return error instanceof OpenAIRequestError &&
    (error.status === 408 || error.status === 409 || error.status === 429 || error.status >= 500);
}

function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function fallback(reason: HeartLetterFallbackReason) {
  return Response.json({
    data: FALLBACK_RESPONSE,
    source: "fallback",
    mode: "fallback",
    fallbackReason: reason,
    notice: "잠시 연결이 원활하지 않아요. 준비된 COMMON 마음편지를 보여드릴게요.",
  });
}

function logFailure(reason: HeartLetterFallbackReason, attempts: number, error?: OpenAIRequestError) {
  recordAIFailure({ status: error?.status, code: error?.code ?? reason, type: error?.errorType, param: error?.param }, "fallback", attempts);
  if (process.env.NODE_ENV !== "development") return;
  console.info(`[Heart Letter]\nmode: fallback\nstatus: ${error?.status ?? "n/a"}\ncode: ${error?.code ?? reason}\ntype: ${error?.errorType ?? "n/a"}\nparam: ${error?.param ?? "n/a"}\nattempts: ${attempts}`);
}
