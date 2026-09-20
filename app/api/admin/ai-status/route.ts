import { validAdminSession } from "@/lib/admin-auth";
import { getAIState } from "@/lib/ai-diagnostic-state";
import { openAIModel } from "@/lib/openai-server";
import { prayerEmailConfigured, prayerEmailRecipient } from "@/lib/server/sendPrayerEmail";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!validAdminSession(request)) {
    return Response.json({ configured: false, status: "unauthorized" }, { status: 401 });
  }

  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const state = getAIState();
  const error = state.error ? {
    status: state.error.status,
    code: state.error.code,
    type: state.error.type,
    param: state.error.param,
  } : null;
  return Response.json({
    configured,
    status: configured ? "configured" : "not_configured",
    model: openAIModel(),
    mode: configured ? state.mode : "demo",
    attempts: configured ? state.attempts : 0,
    recovered: configured ? state.recovered : false,
    error: configured ? error : { code: "missing_api_key" },
    prayerEmail: { configured: prayerEmailConfigured(), recipient: prayerEmailRecipient() },
  }, { headers: { "Cache-Control": "no-store" } });
}
