import { requireCapability } from "./provider";

/**
 * Avatar generation is asynchronous and expensive, so it is job based and
 * only ever started by an explicit user action.
 *
 * AvatarJob: {
 *   id: string,
 *   status: "queued" | "processing" | "ready" | "failed" | "timed_out" | "cancelled",
 *   videoUrl?: string,
 *   error?: { code: string, message: string }
 * }
 *
 * Every function rejects with an AiError. With no provider configured that is
 * "AI avatar provider not configured". Nothing here simulates a result.
 */

const FEATURE = "AI avatar generation";

/** @param {{ imageDataUrl: string, script: string }} request */
export async function createAvatarJob(request) {
  return requireCapability("avatar", FEATURE).createAvatarJob(request);
}

/** @param {string} jobId */
export async function getAvatarJob(jobId) {
  return requireCapability("avatar", FEATURE).getAvatarJob(jobId);
}

/** @param {string} jobId */
export async function cancelAvatarJob(jobId) {
  return requireCapability("avatar", FEATURE).cancelAvatarJob(jobId);
}
