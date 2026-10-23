/**
 * Public entry point for AI features. The rest of the app imports from here
 * and never from adapters or provider internals.
 */
export { getAiStatus, NOT_CONFIGURED_MESSAGE } from "./provider";
export { AiError, AI_ERROR_CODES } from "./errors";
export { createAvatarJob, getAvatarJob, cancelAvatarJob } from "./avatarService";
export { generateScript, improveText } from "./resumeService";
export { synthesizeSpeech } from "./speechService";
