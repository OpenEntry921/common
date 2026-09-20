import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "common_admin_session";
const SESSION_SECONDS = 60 * 60 * 4;

/** Server-only PIN comparison. Never import this module from a Client Component. */
export function verifyAdminPin(supplied: string) {
  const expected = process.env.ADMIN_DEMO_PIN;
  if (!expected) return { configured: false, valid: false } as const;
  if (!supplied) return { configured: true, valid: false } as const;
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return { configured: true, valid: a.length === b.length && timingSafeEqual(a, b) } as const;
}

export function validAdminPin(request: Request) {
  return verifyAdminPin(request.headers.get("x-common-admin-pin") ?? "").valid;
}

function signature(expires: string, secret: string) {
  return createHmac("sha256", secret).update(`common-admin:${expires}`).digest("hex");
}

export function createAdminSession() {
  const secret = process.env.ADMIN_DEMO_PIN?.trim();
  if (!secret) return null;
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return { value: `${expires}.${signature(expires, secret)}`, maxAge: SESSION_SECONDS };
}

export function validAdminSession(request: Request) {
  const secret = process.env.ADMIN_DEMO_PIN?.trim();
  const cookie = request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  const [expires, supplied = ""] = decodeURIComponent(cookie?.slice(ADMIN_SESSION_COOKIE.length + 1) ?? "").split(".");
  if (!secret || !expires || Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  const expected = signature(expires, secret);
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
