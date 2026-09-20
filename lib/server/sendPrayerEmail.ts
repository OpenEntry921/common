import "server-only";
import { randomUUID } from "node:crypto";
import { SITE_CONFIG } from "@/lib/config";
import { sendWithResend, type SafeResendError } from "@/lib/server/resend";

export type PrayerRequestType = "prayer_only" | "conversation" | "pastoral_care";
export type PrayerIdentity = "anonymous" | "named" | "contact";

export type PrayerEmail = {
  receivedAt: Date;
  identity: PrayerIdentity;
  story: string;
  type: PrayerRequestType;
  name?: string;
  contactMethod?: string;
  contactDetail?: string;
};

const requestDetails: Record<PrayerRequestType, { subject: string; label: string; contact: string }> = {
  prayer_only: { subject: "[COMMON][기도요청] 기도만 부탁드립니다", label: "기도 요청", contact: "없음" },
  conversation: { subject: "[COMMON][대화요청] 누군가와 이야기하고 싶어요", label: "대화 요청", contact: "대화 요청" },
  pastoral_care: { subject: "[COMMON][목회상담] 목회 상담을 요청합니다", label: "목회 상담", contact: "목회 상담 요청" },
};

const identityLabels: Record<PrayerIdentity, string> = {
  anonymous: "완전 익명",
  named: "이름 일부 공개",
  contact: "연락 가능",
};

export function prayerEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.PRAYER_FROM_EMAIL?.trim() && process.env.PRAYER_RECIPIENT_EMAIL?.trim());
}

export function prayerEmailRecipient() {
  return process.env.PRAYER_RECIPIENT_EMAIL?.trim() ?? "";
}

export class PrayerEmailError extends Error {
  constructor(public stage: "environment" | "resend", public code: string, public httpStatus?: number, public providerError?: SafeResendError) { super(code); }
}

function formatReceivedAt(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export function formatPrayerEmail(request: PrayerEmail) {
  const details = requestDetails[request.type];
  return [
    "COMMON", "", "새로운 기도 요청이 접수되었습니다.", "",
    `요청 종류:\n${details.label}`, "", `신원:\n${identityLabels[request.identity]}`,
    ...(request.name ? ["", `이름:\n${request.name}`] : []),
    "", `연락 요청:\n${details.contact}`,
    ...(request.contactMethod ? ["", `연락 방법:\n${request.contactMethod}`] : []),
    ...(request.contactDetail ? ["", `${request.contactMethod === "문자" || request.contactMethod === "전화" ? "연락처" : "연락 정보"}:\n${request.contactDetail}`] : []),
    "", "━━━━━━━━━━━━━━━━━━", "", "기도 제목", "", request.story, "", "━━━━━━━━━━━━━━━━━━", "",
    `접수 시간:\n${formatReceivedAt(request.receivedAt)}`, "", `Hosted by ${SITE_CONFIG.churchName}`, SITE_CONFIG.churchUrl,
  ].join("\n");
}

export function formatPrayerEmailHtml(request: PrayerEmail) {
  const details = requestDetails[request.type];
  const row = (label: string, value: string) => `<div style="margin:0 0 18px"><div style="color:#777;font-size:13px;margin-bottom:5px">${label}</div><div style="font-size:16px;font-weight:600">${escapeHtml(value)}</div></div>`;
  const detailLabel = request.contactMethod === "문자" || request.contactMethod === "전화" ? "연락처" : "연락 정보";
  return `<!doctype html><html><body style="margin:0;background:#f6f3ed;color:#292720;font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif"><div style="max-width:620px;margin:0 auto;padding:40px 20px"><div style="background:#fff;border:1px solid #e5e0d7;border-radius:12px;padding:36px"><div style="font-size:22px;font-weight:800;letter-spacing:.08em">COMMON</div><p style="margin:10px 0 30px;color:#555">새로운 기도 요청이 접수되었습니다.</p>${row("요청 종류", details.label)}${row("신원", identityLabels[request.identity])}${request.name ? row("이름", request.name) : ""}${row("연락 요청", details.contact)}${request.contactMethod ? row("연락 방법", request.contactMethod) : ""}${request.contactDetail ? row(detailLabel, request.contactDetail) : ""}<div style="border-top:1px solid #d8d2c8;border-bottom:1px solid #d8d2c8;margin:30px 0;padding:26px 0"><div style="font-size:14px;font-weight:700;margin-bottom:14px">기도 제목</div><div style="font-size:16px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(request.story)}</div></div>${row("접수 시간", formatReceivedAt(request.receivedAt))}<p style="margin:30px 0 0;color:#777;font-size:12px">Hosted by <a href="${escapeHtml(SITE_CONFIG.churchUrl)}" style="color:#496650">${escapeHtml(SITE_CONFIG.churchName)}</a></p></div></div></body></html>`;
}

function safeEmailHeader(value: string) {
  return value.length <= 254 && !/[\r\n]/.test(value) && /.+@.+\..+/.test(value);
}

/** Sends directly to Resend's server-side API; no request data is persisted or logged. */
export async function sendPrayerEmail(request: PrayerEmail) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.PRAYER_FROM_EMAIL?.trim();
  const to = prayerEmailRecipient();
  if (!apiKey || !from || !to) throw new PrayerEmailError("environment", "email_provider_not_configured");
  if (!safeEmailHeader(from) || !safeEmailHeader(to)) throw new PrayerEmailError("environment", "invalid_email_configuration");

  const details = requestDetails[request.type];
  const body = { from, to: [to], subject: details.subject, text: formatPrayerEmail(request), html: formatPrayerEmailHtml(request) };
  const idempotencyKey = `prayer/${randomUUID()}`;
  let lastResult;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 400));
    const result = await sendWithResend(apiKey, body, idempotencyKey);
    if (!result.error && result.data?.id) return result.data.id;
    lastResult = result;
    if (result.httpStatus !== 429 && (result.httpStatus ?? 0) < 500) break;
  }
  throw new PrayerEmailError("resend", lastResult?.error?.code ?? "email_delivery_failed", lastResult?.httpStatus, lastResult?.error ?? undefined);
}
