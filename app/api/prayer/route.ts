import { createHash } from "node:crypto";
import { sendPrayerEmail, type PrayerEmail } from "@/lib/server/sendPrayerEmail";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 12_000;
const WINDOW_MS = 10 * 60_000;
const REPEAT_MS = 60_000;
const attempts = new Map<string, number[]>();
const recentRequests = new Map<string, number>();

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  const result = value.trim();
  return result.length <= max && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(result) ? result : "";
}

function clientIp(request: Request) {
  return request.headers.get("x-nf-client-connection-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

function rateLimited(ip: string, fingerprint: string) {
  const now = Date.now();
  const active = (attempts.get(ip) ?? []).filter(time => now - time < WINDOW_MS);
  if (active.length >= 5) return true;
  active.push(now);
  attempts.set(ip, active);
  const last = recentRequests.get(fingerprint);
  recentRequests.set(fingerprint, now);
  return last !== undefined && now - last < REPEAT_MS;
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return Response.json({ error: "입력 내용이 너무 깁니다." }, { status: 413 });
  }
  let raw: Record<string, unknown>;
  try { raw = await request.json(); } catch {
    return Response.json({ error: "요청 내용을 확인해주세요." }, { status: 400 });
  }
  if (new TextEncoder().encode(JSON.stringify(raw)).length > MAX_BODY_BYTES) return Response.json({ error: "입력 내용이 너무 깁니다." }, { status: 413 });
  if (clean(raw.website, 100)) return Response.json({ ok: true });

  const story = clean(raw.story, 3000);
  const name = clean(raw.name, 60);
  const contactMethod = clean(raw.contactMethod, 30);
  const contactDetail = clean(raw.contactDetail, 200);
  const privacy = raw.privacy;
  const connection = raw.connection;
  const validPrivacy = privacy === "anonymous" || privacy === "named" || privacy === "contact";
  const validConnection = connection === "prayer" || connection === "conversation" || connection === "pastoral";
  const needsContact = privacy === "contact" || connection !== "prayer";
  if (!story || !validPrivacy || !validConnection || (privacy === "named" && !name) || (needsContact && (!contactMethod || !contactDetail))) {
    return Response.json({ error: "필수 입력 내용을 확인해주세요." }, { status: 400 });
  }

  const ip = clientIp(request);
  const fingerprint = createHash("sha256").update(`${ip}\0${story}\0${privacy}\0${connection}`).digest("hex");
  if (rateLimited(ip, fingerprint)) {
    return Response.json({ error: "요청이 너무 빠르게 반복되었습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const email: PrayerEmail = {
    receivedAt: new Date(), story, privacy, connection,
    ...(privacy === "named" ? { name } : {}),
    ...(needsContact ? { contactMethod, contactDetail } : {}),
  };
  try {
    await sendPrayerEmail(email);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "기도 요청을 전달하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
