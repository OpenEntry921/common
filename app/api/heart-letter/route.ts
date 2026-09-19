import { CRISIS_RESPONSE, FALLBACK_RESPONSE, HEART_LETTER_INSTRUCTIONS, MAX_MESSAGE_LENGTH, MAX_MESSAGES, hasCrisisLanguage, type ConversationMessage } from "@/lib/heart-letter";

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
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (buckets.get(ip) ?? []).filter(time => now - time < 10 * 60_000);
  if (recent.length >= 10) return true;
  recent.push(now); buckets.set(ip, recent); return false;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return Response.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 429 });

  let body: { messages?: ConversationMessage[]; excludeReferences?: string[] };
  try { body = await request.json(); } catch { return Response.json({ error: "올바르지 않은 요청입니다." }, { status: 400 }); }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES ||
      messages.some(m => !m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || !m.content.trim() || m.content.length > MAX_MESSAGE_LENGTH) ||
      messages.reduce((sum, m) => sum + m.content.length, 0) > 8000) {
    return Response.json({ error: "대화 내용을 확인해 주세요." }, { status: 400 });
  }
  const latest = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
  if (hasCrisisLanguage(latest)) return Response.json({ data: CRISIS_RESPONSE, source: "safety" });

  if (!process.env.OPENAI_API_KEY) return Response.json({ data: FALLBACK_RESPONSE, source: "fallback", notice: "잠시 연결이 원활하지 않아요. 준비된 COMMON 마음편지를 보여드릴게요." });

  try {
    // A variable import keeps local demo builds usable when an offline environment
    // cannot download the SDK. Production installs the declared official package.
    const packageName = "openai";
    const { default: OpenAI } = await import(packageName) as { default: new (options: { apiKey: string; timeout: number; maxRetries: number }) => { responses: { create: (input: unknown) => Promise<{ output_text: string }> } } };
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 12_000, maxRetries: 1 });
    const exclusions = (body.excludeReferences ?? []).slice(0, 5).join(", ");
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      instructions: `${HEART_LETTER_INSTRUCTIONS}\n${exclusions ? `이번 답변에서는 이미 제안한 다음 구절을 피하십시오: ${exclusions}` : ""}`,
      input: messages.map(m => ({ role: m.role, content: m.content })),
      max_output_tokens: 1200,
      text: { format: { type: "json_schema", name: "heart_letter", strict: true, schema: outputSchema } },
    });
    const parsed = JSON.parse(response.output_text);
    if (!parsed || !outputSchema.required.every(key => typeof parsed[key] === "string")) throw new Error("Invalid structured output");
    return Response.json({ data: parsed, source: "openai" });
  } catch {
    return Response.json({ data: FALLBACK_RESPONSE, source: "fallback", notice: "잠시 연결이 원활하지 않아요. 준비된 COMMON 마음편지를 보여드릴게요." });
  }
}
