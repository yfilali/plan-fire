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
	eraReturns,
	regimeSequence,
	isLostDecadeWindow,
	LOST_DECADE_LABEL,
	LOST_DECADE_YEARS,
	DEFAULT_ALLOC,
} from "./backtest";
import { MARKET_HISTORY } from "../../../shared/marketHistory.js";

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

describe("eraReturns", () => {
	it("replays the window's blended returns, then the fallback", () => {
		const r = eraReturns(series, 2000, 2001, { stocks: 1 }, 0.07, 4);
		expect(r).toEqual({ full: [0.1, -0.2, 0.07, 0.07], startYear: 2000, endYear: 2001 });
	});
	it("returns null when the series has no data for the window", () => {
		expect(eraReturns(series, 1950, 1960, { stocks: 1 }, 0.07, 4)).toBeNull();
	});
	it("uses the default allocation when none is set", () => {
		const r = eraReturns(series, 2000, 2000, undefined, 0.07, 1);
		expect(r.full[0]).toBeCloseTo(blendedReturns([series[0]], DEFAULT_ALLOC)[0], 12);
	});
});

describe("Lost Decade", () => {
	it("is the same window as the server's 'The Lost Decade' era preset", () => {
		const era = MARKET_HISTORY.eras.find((e) => e.id === "lostdecade");
		expect(era.years).toEqual(LOST_DECADE_YEARS);
		expect(isLostDecadeWindow(...era.years)).toBe(true);
	});

	it("replays real 2000–2009 history, not a synthetic sequence", () => {
		const r = eraReturns(MARKET_HISTORY.series, ...LOST_DECADE_YEARS, { stocks: 1 }, 0.07, 11);
		// S&P 500 total returns: 2000 −9.03%, 2008 −36.55%, then the fallback.
		expect(r.full[0]).toBeCloseTo(-0.0903, 6);
		expect(r.full[8]).toBeCloseTo(-0.3655, 6);
		expect(r.full[10]).toBe(0.07);
	});

});

describe("regimeSequence", () => {
	const base = { nomReturn: 0.07, backtestAlloc: { stocks: 1 }, backtestStart: 1973, backtestEnd: 1982, backtestRepeat: false };
	const S = MARKET_HISTORY.series;

	it("runs the steady average in the historical regime", () => {
		expect(regimeSequence({ ...base, marketMode: "historical" }, S, 30)).toEqual({
			returns: 0.07,
			label: "Historical Avg",
			replay: false,
		});
	});

	it("runs real 2000–2009 for the Lost Decade, ignoring the Time Machine window", () => {
		const r = regimeSequence({ ...base, marketMode: "lost_decade" }, S, 30);
		const expected = eraReturns(S, ...LOST_DECADE_YEARS, { stocks: 1 }, 0.07, 30).full;
		expect(r).toEqual({ returns: expected, label: LOST_DECADE_LABEL, replay: true });
	});

	it("never loops the Lost Decade, even with backtestRepeat on", () => {
		const r = regimeSequence({ ...base, marketMode: "lost_decade", backtestRepeat: true }, S, 30);
		expect(r.returns.slice(10)).toEqual(Array(20).fill(0.07));
	});

	it("replays the Time Machine window for historical_period", () => {
		const r = regimeSequence({ ...base, marketMode: "historical_period" }, S, 30);
		expect(r.label).toBe("1973–1982 replay");
		expect(r.returns).toEqual(eraReturns(S, 1973, 1982, { stocks: 1 }, 0.07, 30).full);
	});

	it("labels a 2000–2009 Time Machine window as the Lost Decade, with identical returns", () => {
		const period = regimeSequence({ ...base, marketMode: "historical_period", backtestStart: 2000, backtestEnd: 2009 }, S, 30);
		const lost = regimeSequence({ ...base, marketMode: "lost_decade" }, S, 30);
		expect(period).toEqual(lost);
	});

	it("falls back to steady when the window has no data", () => {
		const r = regimeSequence({ ...base, marketMode: "historical_period", backtestStart: 1800, backtestEnd: 1810 }, S, 30);
		expect(r.replay).toBe(false);
	});
});
