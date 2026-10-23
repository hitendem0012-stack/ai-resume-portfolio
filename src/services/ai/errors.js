/**
 * Codes are added here as real adapters need them (network, timeout,
 * provider failure). Only codes that exist in code today are listed.
 */
export const AI_ERROR_CODES = {
  PROVIDER_NOT_CONFIGURED: "provider_not_configured",
  CAPABILITY_UNAVAILABLE: "capability_unavailable",
  INVALID_INPUT: "invalid_input",
};

/** Thrown by every AI service call. `message` is safe to show to the user. */
export class AiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AiError";
    this.code = code;
  }
}
