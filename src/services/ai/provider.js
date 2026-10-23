import { mockAdapter } from "./adapters/mock";
import { AI_ERROR_CODES, AiError } from "./errors";

/**
 * Chooses the adapter behind the AI services.
 *
 * VITE_AI_MODE is a non-secret switch that the browser is allowed to see:
 *   unset or anything else   no provider (default)
 *   demo                     template-only adapter, clearly labeled
 *
 * A real provider will be an adapter that calls this app's own backend
 * endpoints. Provider API keys must live only in server-side environment
 * variables and must never be given a VITE_ prefix, because Vite copies
 * every VITE_ variable into the public browser bundle.
 */

export const NOT_CONFIGURED_MESSAGE = "AI avatar provider not configured";

const NO_CAPABILITIES = { script: false, improveText: false, avatar: false, speech: false };

/** Pure lookup, exported so each mode can be tested. */
export function resolveProvider(mode) {
  if (mode === "demo") return { mode: "demo", adapter: mockAdapter };
  return { mode: "unconfigured", adapter: null };
}

function currentProvider() {
  return resolveProvider(import.meta.env.VITE_AI_MODE);
}

/**
 * Describes what is available right now so the UI can label it honestly.
 * { mode: "unconfigured" | "demo", label, message, capabilities }
 */
export function getAiStatus() {
  const { mode, adapter } = currentProvider();

  if (!adapter) {
    return {
      mode,
      label: "Not configured",
      message: NOT_CONFIGURED_MESSAGE,
      capabilities: { ...NO_CAPABILITIES },
    };
  }

  return {
    mode,
    label: adapter.label,
    message:
      "Demo mode: scripts are assembled from a template using only your entries. No AI model, avatar, or voice is used.",
    capabilities: { ...adapter.capabilities },
  };
}

/**
 * Returns the active adapter if it supports the capability, otherwise throws
 * an AiError. Every service call goes through this.
 */
export function requireCapability(capability, featureName) {
  const { adapter } = currentProvider();

  if (!adapter) {
    throw new AiError(AI_ERROR_CODES.PROVIDER_NOT_CONFIGURED, NOT_CONFIGURED_MESSAGE);
  }
  if (!adapter.capabilities[capability]) {
    throw new AiError(
      AI_ERROR_CODES.CAPABILITY_UNAVAILABLE,
      `${featureName} is not available in ${adapter.label.toLowerCase()}.`
    );
  }
  return adapter;
}
