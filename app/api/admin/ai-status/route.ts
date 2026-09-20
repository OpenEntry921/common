import { validAdminPin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!validAdminPin(request)) {
    return Response.json({ configured: false, status: "unauthorized" }, { status: 401 });
  }

  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  return Response.json({ configured, status: configured ? "connected" : "not_configured" });
}
