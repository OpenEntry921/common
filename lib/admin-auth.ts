import { timingSafeEqual } from "node:crypto";

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
