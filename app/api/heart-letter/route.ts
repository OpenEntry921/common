import { createHash } from "node:crypto";
import { CRISIS_RESPONSE, FALLBACK_RESPONSE, HEART_LETTER_INSTRUCTIONS, MAX_MESSAGE_LENGTH, MAX_MESSAGES, hasCrisisLanguage, type ConversationMessage } from "@/lib/heart-letter";
import { getOpenAIClient, OpenAINetworkError, OpenAIRequestError, openAIModel } from "@/lib/openai-server";
import type { HeartLetterFallbackReason } from "@/lib/openai-config";

export const runtime = "nodejs";

const outputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    empathy: { type: "string" }, scriptureReference: { type: "string" }, scriptureShortText: { type: "string" },
    scriptureType: { type: "string", enum: ["jesus", "bible"] }, scriptureContext: { type: "string" },
    reflection: { type: "string" }, suggestedAction: { type: "string" }, followUpQuestion: { type: "string" },
  },
  required: ["empathy", "scriptureReference", "scriptureShortText", "scriptureType", "scriptureContext", "reflection", "suggestedAction", "followUpQuestion"],
};

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
  if (!client) return Response.json({
    data: FALLBACK_RESPONSE,
    source: "fallback",
    mode: "demo",
    fallbackReason: "no_api_key",
    notice: "현재 AI 마음편지가 데모 모드로 실행되고 있습니다.",
  });

  try {
    const exclusions = (body.excludeReferences ?? []).slice(0, 5).join(", ");
    const model = openAIModel();
    const response = await client.responses.create({
      model,
      instructions: `${HEART_LETTER_INSTRUCTIONS}\n${exclusions ? `이번 답변에서는 이미 제안한 다음 구절을 피하십시오: ${exclusions}` : ""}`,
      input: messages.map(m => ({ role: m.role, content: m.content })),
      text: { format: { type: "json_schema", name: "heart_letter", strict: true, schema: outputSchema } },
      max_output_tokens: 1000,
    });
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(response.output_text) as Record<string, unknown>;
      if (!parsed || !outputSchema.required.every(key => typeof parsed[key] === "string") || !["jesus", "bible"].includes(String(parsed.scriptureType))) {
        throw new Error("Invalid structured output");
      }
    } catch {
      logFailure("schema_error");
      return fallback("schema_error");
    }
    if (process.env.NODE_ENV === "development") console.info(`[Heart Letter]\nmode: live\nstatus: success\nmodel: ${model}`);
    return Response.json({ data: parsed, source: "openai", mode: "live" });
  } catch (error) {
    if (error instanceof OpenAIRequestError) {
      logFailure("openai_error", error);
      return fallback("openai_error");
    }
    const reason = error instanceof OpenAINetworkError && error.timedOut ? "timeout" : "openai_error";
    logFailure(reason);
    return fallback(reason);
  }
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

function logFailure(reason: HeartLetterFallbackReason, error?: OpenAIRequestError) {
  if (process.env.NODE_ENV !== "development") return;
  console.info(`[Heart Letter]\nmode: fallback\nstatus: ${error?.status ?? "n/a"}\ncode: ${error?.code ?? reason}\ntype: ${error?.errorType ?? "n/a"}\nparam: ${error?.param ?? "n/a"}`);
}
