// ─────────────────────────────────────────────────────────────────────────
//  Backtest math — pure, framework-free, unit-tested.
//
//  Given the server's annual asset-class series (decimals), these helpers
//  compute what a real historical window did: per-class performance, a
//  blended-portfolio return sequence, and drawdown / CAGR statistics. The
//  blended sequence is fed straight into the projection engine as a
//  year-by-year `nomReturn` array.
// ─────────────────────────────────────────────────────────────────────────

// Records whose `year` falls within [startYear, endYear], inclusive, ordered.
export function sliceSeries(series, startYear, endYear) {
	const lo = Math.min(startYear, endYear);
	const hi = Math.max(startYear, endYear);
	return series
		.filter((r) => r.year >= lo && r.year <= hi)
		.sort((a, b) => a.year - b.year);
}

// Compound a list of decimal returns into a single growth multiple.
const compound = (rets) => rets.reduce((m, r) => m * (1 + r), 1);

// Geometric mean annual return (CAGR) from a list of yearly returns.
export function cagr(rets) {
	if (!rets.length) return 0;
	return compound(rets) ** (1 / rets.length) - 1;
}

// Peak-to-trough decline of a cumulative-growth path. Returns a negative
// decimal (e.g. -0.45 = a 45% drawdown), or 0 if the path never dips.
export function maxDrawdown(rets) {
	let mult = 1;
	let peak = 1;
	let worst = 0;
	for (const r of rets) {
		mult *= 1 + r;
		if (mult > peak) peak = mult;
		const dd = mult / peak - 1;
		if (dd < worst) worst = dd;
	}
	return worst;
}

// Cumulative growth path starting at 1 (one point per year + the start point),
// for sparklines. e.g. [1, 1.1, 0.99, …].
export function growthPath(rets) {
	const path = [1];
	let m = 1;
	for (const r of rets) {
		m *= 1 + r;
		path.push(m);
	}
	return path;
}

// Full performance summary for one asset class over a window of records.
export function classStats(records, key) {
	const rets = records.map((r) => r[key]);
	if (!rets.length) {
		return { totalReturn: 0, cagr: 0, best: null, worst: null, maxDrawdown: 0, growth: [1], years: 0 };
	}
	let best = { year: records[0].year, ret: rets[0] };
	let worst = { year: records[0].year, ret: rets[0] };
	records.forEach((rec) => {
		if (rec[key] > best.ret) best = { year: rec.year, ret: rec[key] };
		if (rec[key] < worst.ret) worst = { year: rec.year, ret: rec[key] };
	});
	return {
		totalReturn: compound(rets) - 1,
		cagr: cagr(rets),
		best,
		worst,
		maxDrawdown: maxDrawdown(rets),
		growth: growthPath(rets),
		years: rets.length,
	};
}

// Normalize an allocation map to weights summing to 1. Negative weights are
// clamped to 0. An all-zero map yields an empty object (caller treats as cash).
export function normalizeAlloc(alloc) {
	const clean = {};
	let total = 0;
	for (const [k, v] of Object.entries(alloc || {})) {
		const w = Math.max(0, Number(v) || 0);
		if (w > 0) {
			clean[k] = w;
			total += w;
		}
	}
	if (total === 0) return {};
	for (const k of Object.keys(clean)) clean[k] /= total;
	return clean;
}

// Year-by-year blended portfolio return across a window, given an allocation.
// Assumes annual rebalancing back to target weights (the standard convention).
export function blendedReturns(records, alloc) {
	const w = normalizeAlloc(alloc);
	const keys = Object.keys(w);
	return records.map((rec) => keys.reduce((sum, k) => sum + w[k] * (rec[k] ?? 0), 0));
}

// Blended-portfolio summary over a window: the headline backtest result.
export function blendedStats(records, alloc) {
	const rets = blendedReturns(records, alloc);
	const inflRets = records.map((r) => r.inflation ?? 0);
	const nominalCagr = cagr(rets);
	const inflCagr = cagr(inflRets);
	return {
		returns: rets,
		totalReturn: compound(rets) - 1,
		cagr: nominalCagr,
		realCagr: (1 + nominalCagr) / (1 + inflCagr) - 1,
		maxDrawdown: maxDrawdown(rets),
		growth: growthPath(rets),
		inflationCagr: inflCagr,
		years: rets.length,
	};
}

// Build a full-length return array for the projection: the real window
// returns, then either the window looped (`repeat`) or a steady fallback rate
// for the remaining years out to the projection horizon.
export function padReturns(windowReturns, fallback, length, repeat = false) {
	if (length <= 0) return [];
	const out = [];
	for (let i = 0; i < length; i++) {
		if (i < windowReturns.length) out.push(windowReturns[i]);
		else if (repeat && windowReturns.length) out.push(windowReturns[i % windowReturns.length]);
		else out.push(fallback);
	}
	return out;
}
