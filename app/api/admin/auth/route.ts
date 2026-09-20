import { ADMIN_SESSION_COOKIE, createAdminSession, verifyAdminPin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { pin?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const pin = typeof body.pin === "string" ? body.pin : "";
  const result = verifyAdminPin(pin);
  if (!result.configured) return Response.json({ ok: false }, { status: 503 });
  if (!result.valid) return Response.json({ ok: false }, { status: 401 });
  const session = createAdminSession();
  if (!session) return Response.json({ ok: false }, { status: 503 });
  return Response.json({ ok: true }, { headers: {
    "Set-Cookie": `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(session.value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${session.maxAge}; Secure`,
    "Cache-Control": "no-store",
  } });
}
