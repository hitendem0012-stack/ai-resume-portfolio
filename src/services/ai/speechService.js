import { requireCapability } from "./provider";

/**
 * Text to speech for the presenter script. Resolves to { audioUrl }.
 * Rejects with an AiError when no provider is configured or the active
 * adapter has no speech capability.
 *
 * @param {{ text: string, voiceId?: string }} request
 */
export async function synthesizeSpeech(request) {
  return requireCapability("speech", "Speech generation").synthesizeSpeech(request);
}
