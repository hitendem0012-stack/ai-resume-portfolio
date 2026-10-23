import { useState } from "react";
import { loadPortfolio } from "../services/storage";

/**
 * Loads the saved portfolio once on mount.
 * Returns { status, data, migrated, error } exactly as loadPortfolio() does.
 * `data` is always a valid portfolio, so callers never need null checks.
 */
export function usePortfolioData() {
  const [result] = useState(loadPortfolio);
  return result;
}
