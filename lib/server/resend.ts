import "server-only";

export type SafeResendError = { name: string; code: string; message: string; type: "provider_error" | "connection_error" };
export type ResendResult = { data: { id: string } | null; error: SafeResendError | null; httpStatus?: number };

function text(value: unknown, fallback: string, max = 500) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

/** A small server-only client for Resend's emails endpoint, with SDK-compatible data/error semantics. */
export async function sendWithResend(apiKey: string, payload: Record<string, unknown>, idempotencyKey?: string): Promise<ResendResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    const body: unknown = await response.json().catch(() => null);
    const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
    if (!response.ok) return {
      data: null,
      error: {
        name: text(record.name, "ResendError", 100),
        code: text(record.code, text(record.name, `http_${response.status}`, 100), 100),
        message: text(record.message, `Resend returned HTTP ${response.status}.`),
        type: "provider_error",
      },
      httpStatus: response.status,
    };
    const id = text(record.id, "", 200);
    if (!id) return { data: null, error: { name: "InvalidResponseError", code: "missing_email_id", message: "Resend did not return an email ID.", type: "provider_error" }, httpStatus: response.status };
    return { data: { id }, error: null, httpStatus: response.status };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return { data: null, error: { name: timedOut ? "TimeoutError" : "NetworkError", code: timedOut ? "timeout" : "network_error", message: timedOut ? "Resend 연결 시간이 초과되었습니다." : "Resend에 연결할 수 없습니다.", type: "connection_error" } };
  }
}
