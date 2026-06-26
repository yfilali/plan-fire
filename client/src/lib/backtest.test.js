import { describe, it, expect } from "vitest";
import {
	sliceSeries,
	cagr,
	maxDrawdown,
	growthPath,
	classStats,
	normalizeAlloc,
	blendedReturns,
	blendedStats,
	padReturns,
} from "./backtest";

// Tiny synthetic series so expected values are hand-checkable.
const series = [
	{ year: 2000, stocks: 0.1, tbonds: 0.05, inflation: 0.03 },
	{ year: 2001, stocks: -0.2, tbonds: 0.1, inflation: 0.02 },
	{ year: 2002, stocks: 0.5, tbonds: 0.0, inflation: 0.01 },
];

describe("sliceSeries", () => {
	it("returns inclusive, ordered window", () => {
		expect(sliceSeries(series, 2000, 2001).map((r) => r.year)).toEqual([2000, 2001]);
	});
	it("handles reversed args", () => {
		expect(sliceSeries(series, 2002, 2000)).toHaveLength(3);
	});
});

describe("cagr", () => {
	it("compounds to the geometric mean", () => {
		// (1.1 * 0.8 * 1.5) = 1.32 over 3 years → 1.32^(1/3) - 1
		expect(cagr([0.1, -0.2, 0.5])).toBeCloseTo(1.32 ** (1 / 3) - 1, 9);
	});
	it("is 0 for empty input", () => {
		expect(cagr([])).toBe(0);
	});
});

describe("maxDrawdown", () => {
	it("captures peak-to-trough decline", () => {
		// path: 1 → 1.1 → 0.88 → 1.32; trough 0.88 vs peak 1.1 → -20%
		expect(maxDrawdown([0.1, -0.2, 0.5])).toBeCloseTo(-0.2, 9);
	});
	it("is 0 when monotonically rising", () => {
		expect(maxDrawdown([0.1, 0.1, 0.1])).toBe(0);
	});
});

describe("growthPath", () => {
	it("starts at 1 and has one point per year plus start", () => {
		const p = growthPath([0.1, -0.2]);
		expect(p[0]).toBe(1);
		expect(p).toHaveLength(3);
		expect(p[2]).toBeCloseTo(0.88, 9);
	});
});

describe("classStats", () => {
	const s = classStats(series, "stocks");
	it("finds best and worst years", () => {
		expect(s.best).toEqual({ year: 2002, ret: 0.5 });
		expect(s.worst).toEqual({ year: 2001, ret: -0.2 });
	});
	it("computes total return", () => {
		expect(s.totalReturn).toBeCloseTo(0.32, 9);
	});
});

describe("normalizeAlloc", () => {
	it("normalizes weights to sum to 1", () => {
		expect(normalizeAlloc({ stocks: 3, tbonds: 1 })).toEqual({ stocks: 0.75, tbonds: 0.25 });
	});
	it("drops and clamps non-positive weights", () => {
		expect(normalizeAlloc({ stocks: 1, tbonds: 0, gold: -5 })).toEqual({ stocks: 1 });
	});
	it("returns empty for an all-zero map", () => {
		expect(normalizeAlloc({ stocks: 0 })).toEqual({});
	});
});

describe("blendedReturns", () => {
	it("weights each class per year", () => {
		// 50/50 stocks/tbonds
		const r = blendedReturns(series, { stocks: 1, tbonds: 1 });
		expect(r[0]).toBeCloseTo(0.075, 9); // (0.1 + 0.05)/2
		expect(r[1]).toBeCloseTo(-0.05, 9); // (-0.2 + 0.1)/2
	});
});

describe("blendedStats", () => {
	it("computes nominal and real CAGR", () => {
		const s = blendedStats(series, { stocks: 1 });
		expect(s.cagr).toBeCloseTo(cagr([0.1, -0.2, 0.5]), 9);
		const inflCagr = cagr([0.03, 0.02, 0.01]);
		expect(s.realCagr).toBeCloseTo((1 + s.cagr) / (1 + inflCagr) - 1, 9);
	});
});

describe("padReturns", () => {
	it("appends fallback after the window", () => {
		expect(padReturns([0.1, 0.2], 0.07, 4)).toEqual([0.1, 0.2, 0.07, 0.07]);
	});
	it("loops the window when repeat is set", () => {
		expect(padReturns([0.1, 0.2], 0.07, 5, true)).toEqual([0.1, 0.2, 0.1, 0.2, 0.1]);
	});
	it("truncates when the window exceeds the horizon", () => {
		expect(padReturns([0.1, 0.2, 0.3], 0, 2)).toEqual([0.1, 0.2]);
	});
});
