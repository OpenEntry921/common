import { validAdminPin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return validAdminPin(request)
    ? Response.json({ ok: true })
    : Response.json({ error: "관리자 PIN을 확인해주세요." }, { status: 401 });
}
