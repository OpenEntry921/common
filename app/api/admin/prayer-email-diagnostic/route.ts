import { randomUUID } from "node:crypto";
import { validAdminSession } from "@/lib/admin-auth";
import { sendWithResend } from "@/lib/server/resend";

export const runtime = "nodejs";

const subject = "[COMMON] 기도 요청 이메일 연결 테스트";
const message = `COMMON 기도 요청 이메일 시스템의
연결 테스트입니다.

이 메일이 도착했다면
COMMON → Netlify → Resend → 수신 이메일
연결이 정상입니다.

Hosted by 신성커뮤니티교회`;

function environmentName() {
  return process.env.CONTEXT?.trim() || process.env.NETLIFY_CONTEXT?.trim() || process.env.NODE_ENV || "unknown";
}

export async function POST(request: Request) {
  if (!validAdminSession(request)) return Response.json({ ok: false, error: { code: "unauthorized", message: "관리자 인증이 필요합니다." } }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const recipient = process.env.PRAYER_RECIPIENT_EMAIL?.trim() ?? "";
  const from = process.env.PRAYER_FROM_EMAIL?.trim() ?? "";
  const environment = { resendApiKey: Boolean(apiKey), recipientEmail: Boolean(recipient), fromEmail: Boolean(from) };
  const base = { provider: "resend", environment, environmentName: environmentName(), recipientEmail: recipient || null, fromEmail: from || null, timestamp: new Date().toISOString() };
  const missing = !apiKey
    ? { code: "MISSING_RESEND_API_KEY", message: "RESEND_API_KEY가 Netlify에 설정되지 않았습니다." }
    : !recipient
      ? { code: "MISSING_RECIPIENT_EMAIL", message: "PRAYER_RECIPIENT_EMAIL이 설정되지 않았습니다." }
      : !from
        ? { code: "MISSING_FROM_EMAIL", message: "PRAYER_FROM_EMAIL이 설정되지 않았습니다." }
        : null;
  if (missing) return Response.json({ ok: false, stage: "environment", ...base, error: { ...missing, name: "ConfigurationError", type: "configuration_error" } }, { headers: { "Cache-Control": "no-store" } });

  const result = await sendWithResend(apiKey, { from, to: [recipient], subject, text: message }, `prayer-diagnostic/${randomUUID()}`);
  if (result.error) {
    console.error("prayer_email_diagnostic_failure", { stage: "resend", status: result.httpStatus, code: result.error.code, type: result.error.type, provider: "resend", timestamp: base.timestamp });
    const testDomainRestriction = from.toLowerCase() === "onboarding@resend.dev" && (result.httpStatus === 403 || /test|domain|recipient/i.test(result.error.message));
    return Response.json({ ok: false, stage: "resend", ...base, httpStatus: result.httpStatus ?? null, error: result.error, testDomainRestriction }, { headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ ok: true, stage: "complete", ...base, httpStatus: result.httpStatus ?? 200, emailId: result.data?.id }, { headers: { "Cache-Control": "no-store" } });
}
