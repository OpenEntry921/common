import "server-only";

export type SafeAIError = {
  status?: number;
  code: string;
  type?: string;
  param?: string;
  timestamp?: string;
};

type DiagnosticState = {
  mode: "live" | "fallback" | "demo";
  error: SafeAIError | null;
  attempts: number;
  recovered: boolean;
};

// Best-effort operational context only. Serverless instances may be replaced at any time;
// the diagnostic route therefore never relies on this state for its active checks.
let state: DiagnosticState = { mode: "demo", error: null, attempts: 0, recovered: false };

export function recordAISuccess(attempts = 1) {
  state = { mode: "live", error: null, attempts, recovered: attempts > 1 };
}

export function recordAIFailure(error: Omit<SafeAIError, "timestamp">, mode: "fallback" | "demo" = "fallback", attempts = 0) {
  state = { mode, error: { ...error, timestamp: new Date().toISOString() }, attempts, recovered: false };
}

export function getAIState(): DiagnosticState {
  return { ...state, error: state.error ? { ...state.error } : null };
}
