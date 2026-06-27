import { describe, it, expect } from "vitest";
import { mulberry32, gaussian, genReturns, percentile, runMonteCarlo } from "./montecarlo.js";

// A simple compounding simulator: a fixed starting balance grows by each year's
// return, minus a flat annual withdrawal. "survived" = never hit zero.
function makeSimulate({ startPort, withdrawal }) {
	return (returns) => {
		let b = startPort;
		let depletionAge = null;
		for (let i = 0; i < returns.length; i++) {
			b = b * (1 + returns[i]) - withdrawal;
			if (b <= 0 && depletionAge == null) depletionAge = i;
		}
		return { survived: b > 0, terminal: Math.max(0, b), depletionAge };
	};
}

describe("seeded PRNG", () => {
	it("is deterministic for a given seed", () => {
		const a = mulberry32(42);
		const b = mulberry32(42);
		expect([a(), a(), a()]).toEqual([b(), b(), b()]);
	});

	it("gaussian produces finite numbers", () => {
		const rng = mulberry32(7);
		for (let i = 0; i < 100; i++) expect(Number.isFinite(gaussian(rng))).toBe(true);
	});

	it("genReturns has the requested length", () => {
		expect(genReturns(mulberry32(1), 30, 0.05, 0.15)).toHaveLength(30);
	});
});

describe("percentile", () => {
	it("returns ordered values", () => {
		const s = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
		expect(percentile(s, 10)).toBeLessThanOrEqual(percentile(s, 50));
		expect(percentile(s, 50)).toBeLessThanOrEqual(percentile(s, 90));
	});
});

describe("runMonteCarlo", () => {
	const base = { trials: 500, years: 30, mean: 0.05, vol: 0.12 };

	it("is deterministic with the same seed", () => {
		const sim = makeSimulate({ startPort: 1_000_000, withdrawal: 40_000 });
		const a = runMonteCarlo({ ...base, seed: 123, simulate: sim });
		const b = runMonteCarlo({ ...base, seed: 123, simulate: sim });
		expect(a.successRate).toBe(b.successRate);
		expect(a.p50).toBe(b.p50);
	});

	it("a hugely over-funded plan succeeds ~always", () => {
		const sim = makeSimulate({ startPort: 50_000_000, withdrawal: 40_000 });
		const r = runMonteCarlo({ ...base, seed: 1, simulate: sim });
		expect(r.successRate).toBeGreaterThan(0.98);
	});

	it("a starved plan mostly fails", () => {
		const sim = makeSimulate({ startPort: 200_000, withdrawal: 60_000 });
		const r = runMonteCarlo({ ...base, seed: 1, simulate: sim });
		expect(r.successRate).toBeLessThan(0.3);
	});

	it("keeps p10 <= p50 <= p90", () => {
		const sim = makeSimulate({ startPort: 1_000_000, withdrawal: 40_000 });
		const r = runMonteCarlo({ ...base, seed: 9, simulate: sim });
		expect(r.p10).toBeLessThanOrEqual(r.p50);
		expect(r.p50).toBeLessThanOrEqual(r.p90);
	});
});
