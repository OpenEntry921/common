import { validAdminPin } from "@/lib/admin-auth";
import { getOpenAIClient, temporaryKeyFrom } from "@/lib/openai-server";

export const runtime = "nodejs";

const attempts = new Map<string, number[]>();
export async function POST(request: Request) {
  if (!validAdminPin(request)) return Response.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now(); const recent = (attempts.get(ip) ?? []).filter(t => now - t < 60_000);
  if (recent.length >= 5) return Response.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  recent.push(now); attempts.set(ip, recent);
  const client = getOpenAIClient(temporaryKeyFrom(request));
  if (!client) return Response.json({ error: "API Key를 다시 확인해주세요." }, { status: 400 });
  try {
    await client.responses.create({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", input: "Reply only: OK", max_output_tokens: 8 });
    return Response.json({ ok: true });
  } catch {
    // Never return the provider error: it can contain sensitive request details.
    return Response.json({ error: "API Key를 다시 확인해주세요." }, { status: 400 });
  }
}
