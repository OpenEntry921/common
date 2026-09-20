import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { SITE_CONFIG } from "@/lib/config";

export type PrayerEmail = {
  receivedAt: Date;
  privacy: "anonymous" | "named" | "contact";
  story: string;
  connection: "prayer" | "conversation" | "pastoral";
  name?: string;
  contactMethod?: string;
  contactDetail?: string;
};

const privacyLabels: Record<PrayerEmail["privacy"], string> = {
  anonymous: "완전 익명",
  named: "이름 일부",
  contact: "연락 가능",
};
const connectionLabels: Record<PrayerEmail["connection"], string> = {
  prayer: "기도만 부탁드립니다",
  conversation: "누군가와 이야기하고 싶어요",
  pastoral: "목회 상담을 받아보고 싶어요",
};

export function prayerEmailConfigured() {
  return Boolean(
    process.env.EMAIL_PROVIDER_API_KEY?.trim() &&
    process.env.EMAIL_FROM_ADDRESS?.trim() &&
    process.env.PRAYER_RECIPIENT_EMAIL?.trim(),
  );
}

export function prayerEmailRecipient() {
  return process.env.PRAYER_RECIPIENT_EMAIL?.trim() ?? "";
}

export function formatPrayerEmail(request: PrayerEmail) {
  const parts = [
    "COMMON 기도 요청",
    "",
    "새로운 기도 요청이 접수되었습니다.",
    "",
    `접수 시간:\n${new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(request.receivedAt)}`,
    "",
    `공개 방식:\n${privacyLabels[request.privacy]}`,
    ...(request.name ? ["", `이름 또는 별명:\n${request.name}`] : []),
    "",
    `기도 제목:\n${request.story}`,
    "",
    `요청 사항:\n${connectionLabels[request.connection]}`,
    ...(request.contactMethod ? ["", `연락 방법:\n${request.contactMethod}`] : []),
    ...(request.contactDetail ? ["", `연락처:\n${request.contactDetail}`] : []),
    "",
    "--------------------------------",
    "",
    `Hosted by ${SITE_CONFIG.churchName}`,
    SITE_CONFIG.churchUrl,
  ];
  return parts.join("\n");
}

function safeEmailHeader(value: string) {
  return value.length <= 254 && !/[\r\n]/.test(value) && /.+@.+\..+/.test(value);
}

/** Sends plain text through Resend. Provider-specific code is isolated here for replacement. */
export async function sendPrayerEmail(request: PrayerEmail) {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY?.trim();
  const from = process.env.EMAIL_FROM_ADDRESS?.trim();
  const to = prayerEmailRecipient();
  if (!apiKey || !from || !to) throw new Error("email_provider_not_configured");
  if (!safeEmailHeader(from) || !safeEmailHeader(to)) throw new Error("invalid_email_configuration");

  const text = formatPrayerEmail(request);
  const idempotencyKey = `prayer/${createHash("sha256").update(`${randomUUID()}\0${text}`).digest("hex")}`;
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 350));
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: "[COMMON] 새로운 기도 요청이 도착했습니다",
          text,
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (response.ok) return;
      lastError = new Error(`email_provider_${response.status}`);
      if (response.status < 500 && response.status !== 429) break;
    } catch {
      lastError = new Error("email_provider_network_error");
    }
  }
  throw lastError ?? new Error("email_delivery_failed");
}
