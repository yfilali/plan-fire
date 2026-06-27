// ─────────────────────────────────────────────────────────────────────────
//  Monte Carlo — pure, framework-free, unit-tested.
//
//  Given a per-trial simulator, runMonteCarlo() generates randomized year-by-
//  year nominal-return sequences (normal-ish via Box-Muller) and aggregates how
//  often a plan survives, plus terminal-balance percentiles. Randomness comes
//  from a SEEDED PRNG so results are deterministic and testable — no Math.random
//  at module scope.
// ─────────────────────────────────────────────────────────────────────────

// mulberry32 — tiny deterministic PRNG. Same seed → same stream.
export function mulberry32(seed) {
	let a = seed >>> 0;
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// Standard normal sample via Box-Muller from a [0,1) rng.
export function gaussian(rng) {
	let u = 0;
	let v = 0;
	while (u === 0) u = rng();
	while (v === 0) v = rng();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// A length-`years` array of decimal nominal returns ~ N(mean, vol).
export function genReturns(rng, years, mean, vol) {
	const out = [];
	for (let i = 0; i < years; i++) out.push(mean + vol * gaussian(rng));
	return out;
}

// Nearest-rank percentile on an already-sorted ascending array.
export function percentile(sorted, p) {
	if (!sorted.length) return 0;
	const idx = Math.min(
		sorted.length - 1,
		Math.max(0, Math.round((p / 100) * (sorted.length - 1))),
	);
	return sorted[idx];
}

// Run `trials` randomized return paths through `simulate`, which must return
// { survived:boolean, terminal:number, depletionAge:number|null } for a given
// returns array. Returns success rate + terminal-balance distribution.
export function runMonteCarlo({
	trials = 1000,
	years,
	mean,
	vol = 0.15,
	seed = 0x9e3779b9,
	simulate,
}) {
	const rng = mulberry32(seed);
	const terminalBalances = [];
	const depletionAges = [];
	let successes = 0;

	for (let t = 0; t < trials; t++) {
		const returns = genReturns(rng, years, mean, vol);
		const r = simulate(returns);
		terminalBalances.push(r.terminal);
		if (r.survived) successes++;
		else if (r.depletionAge != null) depletionAges.push(r.depletionAge);
	}

	const sorted = [...terminalBalances].sort((a, b) => a - b);
	return {
		trials,
		successRate: successes / trials,
		p10: percentile(sorted, 10),
		p50: percentile(sorted, 50),
		p90: percentile(sorted, 90),
		terminalBalances,
		depletionAges,
	};
}
