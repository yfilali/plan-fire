import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────
//  Client loader for the server's historical market dataset.
//  Fetched once, cached at module scope, shared across every hook consumer.
// ─────────────────────────────────────────────────────────────────────────

let cache = null; // resolved payload { meta, classes, eras, series }
let inflight = null; // de-dupe concurrent fetches

function load() {
	if (cache) return Promise.resolve(cache);
	if (inflight) return inflight;
	inflight = fetch("/api/market-history")
		.then((r) => {
			if (!r.ok) throw new Error(`market-history ${r.status}`);
			return r.json();
		})
		.then((data) => {
			cache = data;
			inflight = null;
			return data;
		})
		.catch((err) => {
			inflight = null;
			throw err;
		});
	return inflight;
}

// React hook: { data, loaded, error }. `data` is null until the fetch lands.
export function useMarketHistory() {
	const [state, setState] = useState(() => ({ data: cache, loaded: !!cache, error: null }));
	useEffect(() => {
		if (cache) return;
		let alive = true;
		load()
			.then((data) => alive && setState({ data, loaded: true, error: null }))
			.catch((error) => alive && setState({ data: null, loaded: true, error }));
		return () => {
			alive = false;
		};
	}, []);
	return state;
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

// A reasonable diversified starting allocation when we have nothing else.
export const DEFAULT_ALLOC = { stocks: 0.6, tbonds: 0.25, realEstate: 0.05, gold: 0.05, tbills: 0.05, corp: 0 };
