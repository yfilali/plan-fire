import { describe, it, expect } from "vitest";
import {
	project,
	monthlySpendAtAge,
	buildReturns,
	returnForYear,
	deflate,
	shouldApplyCut,
	LOST_DECADE,
} from "./engine";

describe("monthlySpendAtAge", () => {
	// Base expenses: $800/mo groceries (CPI-linked), $2400/mo mortgage (fixed)
	const baseExpenses = [
		{
			id: "a",
			cat: "food",
			name: "Groceries",
			amount: 800,
			plans: ["all"],
			inflOverride: null,
		},
		{
			id: "b",
			cat: "housing",
			name: "Mortgage",
			amount: 2400,
			plans: ["stay"],
			inflOverride: 0,
		},
	];

	it("returns base spend at current age (no inflation accumulated)", () => {
		const result = monthlySpendAtAge(baseExpenses, 49, "stay");
		expect(result).toBe(3200); // 800 + 2400
	});

	it("inflates CPI-linked expenses (groceries) at global inflation rate over time", () => {
		// At age 59, 10 years of 3% inflation: 800 * 1.03^10 = ~1075.13
		const result = monthlySpendAtAge(baseExpenses, 59, "stay", 49, 0.03);
		expect(result).toBeCloseTo(3475.13, 1); // groceries inflated + mortgage flat (2400)
	});

	it("keeps fixed expenses (mortgage with inflOverride: 0) flat in nominal terms", () => {
		const result = monthlySpendAtAge(baseExpenses, 69, "stay", 49, 0.03);
		// Mortgage stays at $2400, groceries inflated: 800 * 1.03^20 ≈ $1444.89
		expect(result).toBeCloseTo(3844.89, 1);
	});

	it("applies per-expense inflation override when set", () => {
		const expenses = [
			{
				id: "a",
				cat: "health",
				name: "ACA",
				amount: 1500,
				plans: ["all"],
				inflOverride: 0.065,
			}, // healthcare premium inflation
			{
				id: "b",
				cat: "food",
				name: "Groceries",
				amount: 800,
				plans: ["all"],
				inflOverride: null,
			},
		];
		// At age 59: ACA = 1500 * 1.065^10 ≈ 2815.71, Groceries = 800 * 1.03^10 ≈ 1075.13
		const result = monthlySpendAtAge(expenses, 59, "all", 49, 0.03);
		expect(result).toBeCloseTo(3890.84, 1);
	});

	it("excludes expenses that do not match plan", () => {
		const result = monthlySpendAtAge(baseExpenses, 49, "sell_move"); // mortgage is stay-only
		expect(result).toBe(800);
	});
});

describe("project — inflation-aware with nominal returns", () => {
	const baseExpenses = [
		{
			id: "a",
			cat: "food",
			name: "Groceries",
			amount: 800,
			plans: ["all"],
			inflOverride: null,
		},
		{
			id: "b",
			cat: "housing",
			name: "Mortgage BA",
			amount: 2400,
			plans: ["stay"],
			inflOverride: 0,
		},
		{
			id: "c",
			cat: "health",
			name: "ACA",
			amount: 1500,
			plans: ["all"],
			inflOverride: 0.065,
		},
	];

	it("grows portfolio at nominal return when no returns array is passed", () => {
		// With 7% nominal return over 10 years on $3M: 3M * 1.07^10 ≈ 5.92M
		const result = project({
			startAge: 49,
			endAge: 58,
			retireAge: 49,
			ssAge: 70,
			ssAnnual: 0,
			portfolio: 3000000,
			expenses: baseExpenses,
			planId: "stay",
			nomReturn: 0.07,
			inflation: 0.03,
			rentalNet: 0,
		});
		// At age 58 (year 9 from start), portfolio should reflect nominal growth minus spending
		expect(result.length).toBe(10); // ages 49 through 58 inclusive
		const last = result[result.length - 1];
		expect(last.age).toBe(58);
		// Balance should be > 0 (money hasn't run out in first 10 years)
		expect(last.balance).toBeGreaterThan(2000000);
	});

	it("inflates different expense categories at their own rates over time", () => {
		const result = project({
			startAge: 49,
			endAge: 59,
			retireAge: 49,
			ssAge: 70,
			ssAnnual: 0,
			portfolio: 3000000,
			expenses: baseExpenses,
			planId: "stay",
			nomReturn: 0.07,
			inflation: 0.03,
			rentalNet: 0,
		});
		const now = result.find((d) => d.age === 49);
		const later = result.find((d) => d.age === 59);

		// At age 49 (year 0): no inflation accumulated yet, base spending = 800 + 2400 + 1500 = 4700/mo
		expect(now.annualSpend).toBe(56400);

		// At age 59 (10 years):
		// Groceries: 800 * 1.03^10 ≈ 1075.13
		// Mortgage: 2400 (flat, inflOverride: 0)
		// ACA: 1500 * 1.065^10 ≈ 2815.71
		// Total monthly ≈ 6290.84, annual ≈ 75490
		expect(later.annualSpend).toBeCloseTo(75490, -1);
	});

	it("grows Social Security with inflation (COLA) once claimed", () => {
		const result = project({
			startAge: 49,
			endAge: 59,
			retireAge: 49,
			ssAge: 49, // claim immediately so SS shows from year 0
			ssAnnual: 40000,
			portfolio: 3000000,
			expenses: baseExpenses,
			planId: "stay",
			nomReturn: 0.07,
			inflation: 0.03,
			rentalNet: 0,
		});
		const now = result.find((d) => d.age === 49);
		const later = result.find((d) => d.age === 59);

		// Year 0: base benefit in today's dollars
		expect(now.income).toBe(40000);
		// Year 10: 40000 * 1.03^10 ≈ 53756.6 — must compound, not stay flat
		expect(later.income).toBeCloseTo(53757, -1);
	});

	it("handles lost decade returns array with per-expense inflation", () => {
		const result = project({
			startAge: 49,
			endAge: 58,
			retireAge: 49,
			ssAge: 70,
			ssAnnual: 0,
			portfolio: 3000000,
			expenses: baseExpenses,
			planId: "stay",
			nomReturn: buildReturns("lost_decade", 0.07),
			inflation: 0.03,
			rentalNet: 0,
		});
		expect(result.length).toBe(10);
		// Lost decade should result in lower portfolio than historical avg
		const last = result[result.length - 1];
		expect(last.balance).toBeGreaterThan(0);
	});

	it("retirement age stops deductions from portfolio when income covers expenses", () => {
		// Extreme case: low portfolio + high expenses so depletion is visible
		const expenses = [
			{
				id: "a",
				cat: "food",
				name: "Groceries",
				amount: 8000,
				plans: ["all"],
				inflOverride: null,
			},
			{
				id: "b",
				cat: "health",
				name: "ACA",
				amount: 5000,
				plans: ["all"],
				inflOverride: 0.065,
			},
		];
		const result = project({
			startAge: 49,
			endAge: 58,
			retireAge: 52,
			ssAge: 70,
			ssAnnual: 0,
			portfolio: 1500000,
			expenses,
			planId: "stay",
			nomReturn: 0.07,
			inflation: 0.03,
			rentalNet: 0,
		});
		// Before retirement (ages 49-51): working, surplus goes to portfolio
		const preRet = result.find((d) => d.age === 51);
		expect(preRet.balance).toBeGreaterThan(1000000); // some growth + surplus

		// After retirement: spending far exceeds growth, balance declines
		const postRet = result.find((d) => d.age === 57);
		expect(postRet.balance).toBeLessThan(preRet.balance);
	});

	it("should account for negative rental cash flow (loss)", () => {
		const expenses = [
			{
				id: "a",
				cat: "food",
				name: "Groceries",
				amount: 8000,
				plans: ["all"],
				inflOverride: null,
			},
		];
		const lossResult = project({
			startAge: 49,
			endAge: 60,
			retireAge: 49,
			portfolio: 1000000,
			expenses,
			planId: "rent_out",
			nomReturn: 0.1,
			inflation: 0.03,
			rentalNet: -5000, // net loss of $5K/yr
		});
		const zeroResult = project({
			startAge: 49,
			endAge: 60,
			retireAge: 49,
			portfolio: 1000000,
			expenses,
			planId: "rent_out",
			nomReturn: 0.1,
			inflation: 0.03,
			rentalNet: 0, // zero rental flow
		});
		// Negative rental should drain portfolio faster than zero
		const at60Loss = lossResult.find((d) => d.age === 60);
		const at60Zero = zeroResult.find((d) => d.age === 60);
		expect(at60Loss.balance).toBeLessThan(at60Zero.balance);
	});
});

describe("returnForYear", () => {
	it("returns the first lost decade value at year 0", () => {
		expect(returnForYear("lost_decade", 0, 0.07)).toBe(-0.15);
	});

	it("returns the last lost decade value at year 9", () => {
		expect(returnForYear("lost_decade", 9, 0.07)).toBe(0.09);
	});

	it("falls back to nominal average at year 10 and beyond", () => {
		expect(returnForYear("lost_decade", 10, 0.07)).toBe(0.07);
		expect(returnForYear("lost_decade", 25, 0.07)).toBe(0.07);
	});

	it("returns nominal average for historical mode at any year", () => {
		expect(returnForYear("historical", 0, 0.07)).toBe(0.07);
		expect(returnForYear("historical", 5, 0.07)).toBe(0.07);
		expect(returnForYear("historical", 40, 0.07)).toBe(0.07);
	});

	it("matches buildReturns lost_decade output for each year index", () => {
		const avg = 0.07;
		const returns = buildReturns("lost_decade", avg);
		for (let i = 0; i <= 10; i++) {
			expect(returnForYear("lost_decade", i, avg)).toBe(returns[i]);
		}
		expect(returns.length).toBe(LOST_DECADE.length + 1);
	});
});

describe("deflate", () => {
	it("leaves value unchanged at 0 years", () => {
		expect(deflate(1000, 0, 0.03)).toBe(1000);
	});

	it("discounts one year of 3% inflation", () => {
		expect(deflate(103, 1, 0.03)).toBeCloseTo(100, 6);
	});

	it("compounds over 10 years of 3% inflation", () => {
		// 100 / 1.03^10 ≈ 74.41
		expect(deflate(100, 10, 0.03)).toBeCloseTo(74.41, 2);
	});

	it("leaves value unchanged when inflation is 0", () => {
		expect(deflate(5000, 30, 0)).toBe(5000);
	});
});

describe("downturn spending cuts", () => {
	// Expenses with tiers
	const tieredExpenses = [
		{
			id: "essential",
			cat: "food",
			name: "Groceries",
			amount: 1000,
			plans: ["all"],
			tier: "essential",
			inflOverride: null,
		},
		{
			id: "discretionary",
			cat: "food",
			name: "Dining Out",
			amount: 500,
			plans: ["all"],
			tier: "discretionary",
			inflOverride: null,
		},
		{
			id: "luxury",
			cat: "travel",
			name: "Vacations",
			amount: 2000,
			plans: ["all"],
			tier: "luxury",
			inflOverride: null,
		},
	];

	it("does not cut spending during positive return years", () => {
		const result = project({
			startAge: 49,
			endAge: 55,
			retireAge: 49,
			portfolio: 3000000,
			expenses: tieredExpenses,
			planId: "stay",
			nomReturn: 0.08,
			inflation: 0.03,
			rentalNet: 0,
			discretionaryCut: 0.3,
			luxuryCut: 0.7,
		});
		const yr0 = result.find((d) => d.age === 49);
		// All expenses at base: 1000 + 500 + 2000 = 3500/mo = 42000/yr
		expect(yr0.annualSpend).toBe(42000);
	});

	it("cuts discretionary 30% and luxury 70% during negative return years", () => {
		// Year 0: -15% (trigger cuts), Year 1: -10% (trigger cuts), Year 2+: positive
		const returns = [-0.15, -0.1, 0.05, 0.06, 0.07, 0.08, 0.08];
		const result = project({
			startAge: 49,
			endAge: 55,
			retireAge: 49,
			portfolio: 3000000,
			expenses: tieredExpenses,
			planId: "stay",
			nomReturn: returns,
			inflation: 0.03,
			rentalNet: 0,
			discretionaryCut: 0.3,
			luxuryCut: 0.7,
		});
		const yr0 = result.find((d) => d.age === 49);
		// Essential: 1000 (no cut)
		// Discretionary: 500 * (1 - 0.3) = 350
		// Luxury: 2000 * (1 - 0.7) = 600
		// Total: 1950/mo = 23400/yr
		expect(yr0.annualSpend).toBe(23400);
		// Year 2 should have full spending again (+ some inflation accumulated)
		const yr2 = result.find((d) => d.age === 51);
		// Base spend with ~2 years of 3% inflation accumulated:
		// 1000*1.03^2 + 500*1.03^2 + 2000*1.03^2 = 3500*1.03^2 ≈ 3713.15/mo ≈ 44558/yr
		expect(yr2.annualSpend).toBeGreaterThan(42500);
		expect(yr2.annualSpend).toBeLessThan(46000);
	});

	it("does not cut essential-only expenses even in downturn", () => {
		const essentialOnly = [
			{
				id: "a",
				cat: "housing",
				name: "Mortgage",
				amount: 2400,
				plans: ["all"],
				tier: "essential",
				inflOverride: 0,
			},
		];
		const result = project({
			startAge: 49,
			endAge: 52,
			retireAge: 49,
			portfolio: 3000000,
			expenses: essentialOnly,
			planId: "stay",
			nomReturn: [-0.15, 0.05, 0.05],
			inflation: 0.03,
			rentalNet: 0,
			discretionaryCut: 0.3,
			luxuryCut: 0.7,
		});
		const yr0 = result.find((d) => d.age === 49);
		expect(yr0.annualSpend).toBe(28800); // 2400 * 12, no cut
	});
});

describe("net worth with real estate tracking", () => {
	const simpleExpenses = [
		{
			id: "a",
			cat: "food",
			name: "Groceries",
			amount: 1000,
			plans: ["all"],
			inflOverride: null,
		},
	];

	it("tracks retained real estate appreciation for Stay BA plan", () => {
		const result = project({
			startAge: 49,
			endAge: 59,
			retireAge: 49,
			portfolio: 3000000,
			expenses: simpleExpenses,
			planId: "stay",
			nomReturn: 0.08,
			inflation: 0.03,
			rentalNet: 0,
			reAppreciation: 0.04,
			retainedRE: { houseValue: 2200000, mortgage: 500000 },
		});
		const yr0 = result.find((d) => d.age === 49);
		const yr5 = result.find((d) => d.age === 54);
		// Year 0: netWorth = portfolio + houseValue - mortgage
		expect(yr0.netWorth).toBe(yr0.balance + 2200000 - 500000);
		// Year 5: house appreciated 5 years, portfolio grew
		const houseAt5 = 2200000 * 1.04 ** 5;
		expect(yr5.netWorth).toBeCloseTo(yr5.balance + houseAt5 - 500000, -1);
	});

	it("tracks CC home appreciation after sell+move transition", () => {
		const result = project({
			startAge: 49,
			endAge: 59,
			retireAge: 49,
			portfolio: 3000000,
			expenses: simpleExpenses,
			planId: "sell_move",
			nomReturn: 0.08,
			inflation: 0.03,
			rentalNet: 0,
			reAppreciation: 0.04,
			retainedRE: { ccHomeCost: 1000000 },
		});
		const yr0 = result.find((d) => d.age === 49);
		const yr5 = result.find((d) => d.age === 54);
		// Net worth includes CC home
		expect(yr0.netWorth).toBe(yr0.balance + 1000000);
		const ccAt5 = 1000000 * 1.04 ** 5;
		expect(yr5.netWorth).toBeCloseTo(yr5.balance + ccAt5, -1);
	});

	it("tracks both rental house and CC home for rent_out plan", () => {
		const result = project({
			startAge: 49,
			endAge: 59,
			retireAge: 49,
			portfolio: 2000000,
			expenses: simpleExpenses,
			planId: "rent_out",
			nomReturn: 0.08,
			inflation: 0.03,
			rentalNet: 10000,
			reAppreciation: 0.04,
			retainedRE: {
				houseValue: 2200000,
				mortgage: 500000,
				ccHomeCost: 1000000,
			},
		});
		const yr0 = result.find((d) => d.age === 49);
		// netWorth = portfolio + houseValue - mortgage + ccHomeCost
		expect(yr0.netWorth).toBe(yr0.balance + 2200000 - 500000 + 1000000);
		const yr5 = result.find((d) => d.age === 54);
		const houseAt5 = 2200000 * 1.04 ** 5;
		const ccAt5 = 1000000 * 1.04 ** 5;
		expect(yr5.netWorth).toBeCloseTo(
			yr5.balance + houseAt5 - 500000 + ccAt5,
			-1,
		);
	});

	it("falls back to portfolio balance when no retainedRE passed", () => {
		const result = project({
			startAge: 49,
			endAge: 55,
			retireAge: 49,
			portfolio: 2000000,
			expenses: simpleExpenses,
			planId: "stay",
			nomReturn: 0.07,
			inflation: 0.03,
			rentalNet: 0,
		});
		// Without re params, netWorth falls back to balance
		const yr0 = result.find((d) => d.age === 49);
		expect(yr0.netWorth).toBe(yr0.balance);
	});
});
