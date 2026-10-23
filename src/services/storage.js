import { createEmptyPortfolio, normalizePortfolio } from "./schema";
import { MigrationError, migrateToCurrent } from "./migrations";

/** Same key the prototype used. Existing saved data is upgraded in place on the next save. */
export const STORAGE_KEY = "portfolioData";

/**
 * loadPortfolio() status values:
 *   empty        nothing saved yet
 *   ok           current version, loaded as is
 *   migrated     older version, upgraded in memory (stored copy is untouched until the next save)
 *   corrupt      stored value is not valid JSON or not a portfolio object
 *   newer_version saved by a newer app version
 *   unavailable  browser storage cannot be read
 *
 * For every status other than ok and migrated, `data` is an empty portfolio
 * and the stored value is left alone, so nothing is destroyed by a failed read.
 */

const ERRORS = {
  unavailable: "Browser storage is not available. Saving is disabled, for example in some private browsing modes.",
  corrupt: "The saved portfolio data is damaged and could not be read.",
  quota: "Browser storage is full. Use a smaller profile image or clear site data, then try again.",
  serialize: "The portfolio could not be converted for saving.",
  write: "The portfolio could not be saved to browser storage.",
};

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Accessing localStorage can itself throw (blocked cookies, sandboxed frames).
    return null;
  }
}

function isQuotaError(error) {
  return (
    !!error &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014)
  );
}

function failedLoad(status, code, message) {
  return {
    status,
    data: createEmptyPortfolio(),
    migrated: false,
    error: { code, message },
  };
}

export function loadPortfolio() {
  const storage = getStorage();
  if (!storage) return failedLoad("unavailable", "storage_unavailable", ERRORS.unavailable);

  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return failedLoad("unavailable", "storage_unavailable", ERRORS.unavailable);
  }

  if (raw === null) {
    return { status: "empty", data: createEmptyPortfolio(), migrated: false, error: null };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failedLoad("corrupt", "invalid_json", ERRORS.corrupt);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return failedLoad("corrupt", "invalid_shape", ERRORS.corrupt);
  }

  try {
    const { data, migrated } = migrateToCurrent(parsed);
    return { status: migrated ? "migrated" : "ok", data, migrated, error: null };
  } catch (error) {
    if (error instanceof MigrationError) {
      const status = error.code === "newer_version" ? "newer_version" : "corrupt";
      return failedLoad(status, error.code, error.message);
    }
    return failedLoad("corrupt", "migration_failed", ERRORS.corrupt);
  }
}

/**
 * Normalizes and saves a portfolio. Never throws.
 * Returns { ok: true, data } or { ok: false, error: { code, message } }.
 */
export function savePortfolio(portfolio) {
  const storage = getStorage();
  if (!storage) {
    return { ok: false, error: { code: "storage_unavailable", message: ERRORS.unavailable } };
  }

  const data = normalizePortfolio(portfolio);

  let json;
  try {
    json = JSON.stringify(data);
  } catch {
    return { ok: false, error: { code: "serialize_failed", message: ERRORS.serialize } };
  }

  try {
    storage.setItem(STORAGE_KEY, json);
  } catch (error) {
    if (isQuotaError(error)) {
      return { ok: false, error: { code: "quota_exceeded", message: ERRORS.quota } };
    }
    return { ok: false, error: { code: "write_failed", message: ERRORS.write } };
  }

  return { ok: true, data };
}
