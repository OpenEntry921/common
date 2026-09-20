import { verifyAdminPin } from "@/lib/admin-auth";

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
  return result.valid
    ? Response.json({ ok: true })
    : Response.json({ ok: false }, { status: 401 });
}
