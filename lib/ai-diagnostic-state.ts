import "server-only";

export type SafeAIError = {
  status?: number;
  code: string;
  type?: string;
  param?: string;
  timestamp?: string;
};

type DiagnosticState = { mode: "live" | "fallback" | "demo"; error: SafeAIError | null };

// Best-effort operational context only. Serverless instances may be replaced at any time;
// the diagnostic route therefore never relies on this state for its active checks.
let state: DiagnosticState = { mode: "demo", error: null };

export function recordAISuccess() {
  state = { mode: "live", error: null };
}

export function recordAIFailure(error: Omit<SafeAIError, "timestamp">, mode: "fallback" | "demo" = "fallback") {
  state = { mode, error: { ...error, timestamp: new Date().toISOString() } };
}

export function getAIState(): DiagnosticState {
  return { mode: state.mode, error: state.error ? { ...state.error } : null };
}
