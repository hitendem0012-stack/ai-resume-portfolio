import { requireCapability } from "./provider";

/**
 * Content generation from the user's own data.
 *
 * Rule for every implementation: use only what the user entered. Do not
 * add employers, clients, metrics, awards, dates, or skills. If information
 * is missing, leave it out.
 */

/**
 * Builds the speaking script for the presenter, section by section, so the
 * user can review it before anything expensive runs.
 * Resolves to { sections: [{ id, title, text }], text, source }.
 * @param {object} portfolio a schemaVersion 1 portfolio
 */
export async function generateScript(portfolio) {
  return requireCapability("script", "Script generation").generateScript(portfolio);
}

/**
 * Rewrites one piece of user text more professionally without adding facts.
 * Resolves to { text }.
 * @param {{ field: string, text: string }} request
 */
export async function improveText(request) {
  return requireCapability("improveText", "AI text improvement").improveText(request);
}
