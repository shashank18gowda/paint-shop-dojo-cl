import type { QzErrorCode } from "./qzTypes";

export class QzPrintError extends Error {
  readonly code: QzErrorCode;
  readonly cause?: unknown;

  constructor(code: QzErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "QzPrintError";
    this.code = code;
    this.cause = cause;
  }
}

// Normalises any thrown value into a message safe to show in the UI
// (alert/toast). QzPrintError messages are already user-facing; anything
// else gets a generic fallback so raw stack traces never reach the screen.
export function describeQzError(err: unknown): string {
  if (err instanceof QzPrintError) return err.message;
  if (err instanceof Error) return err.message;
  return "An unknown printing error occurred.";
}
