import { MARKET_HISTORY } from "../../../shared/marketHistory.js";

// ─────────────────────────────────────────────────────────────────────────
//  Historical market dataset for the client.
//  The reference data (shared/marketHistory.js, ~10 KB) is bundled into the
//  client rather than fetched, so every projection that depends on it — the
//  Lost Decade stress test, era replays, plan comparison — is available
//  synchronously on first render, offline, and can never silently fall back
//  to the steady average because a request failed. The server still serves
//  the same module at /api/market-history.
// ─────────────────────────────────────────────────────────────────────────

const STATE = Object.freeze({ data: MARKET_HISTORY, loaded: true, error: null });

// React hook kept for its call sites: { data, loaded, error }.
export function useMarketHistory() {
	return STATE;
}

// Map the user's asset *types* (from assetMeta) onto backtest asset *classes*,
// so "Match my assets" can seed an allocation from what they actually own.
export const ASSET_TYPE_TO_CLASS = {
	cash: "tbills",
	investment: "stocks",
	retirement: "stocks",
	property: "realEstate",
	other: "gold",
};

// Build a normalized allocation (class → weight 0..1) from the dollar value of
// the user's liquid + property assets in a given plan. Falls back to null when
// there's nothing to weigh, so callers can keep a sensible default.
export function allocFromAssets(assets, planId) {
	const totals = {};
	let grand = 0;
	for (const a of assets || []) {
		const inPlan = !a.plans || a.plans.includes("all") || a.plans.includes(planId);
		if (!inPlan) continue;
		const cls = ASSET_TYPE_TO_CLASS[a.type];
		if (!cls) continue;
		const v = Number(a.value) || 0;
		if (v <= 0) continue;
		totals[cls] = (totals[cls] || 0) + v;
		grand += v;
	}
	if (grand <= 0) return null;
	for (const k of Object.keys(totals)) totals[k] = Math.round((totals[k] / grand) * 100) / 100;
	return totals;
}

// Re-exported from the pure backtest module so non-React code can use it too.
export { DEFAULT_ALLOC } from "./backtest.js";
