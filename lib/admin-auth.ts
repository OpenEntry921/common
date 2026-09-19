import { timingSafeEqual } from "node:crypto";

export function validAdminPin(request: Request) {
  const expected = process.env.ADMIN_DEMO_PIN;
  const supplied = request.headers.get("x-common-admin-pin") ?? "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
