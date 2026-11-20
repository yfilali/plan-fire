import { describe, it, expect } from "vitest";
import {
	project,
	monthlySpendAtAge,
	monthlyIncomeAtAge,
	buildVestingSchedule,
	deflate,
	shouldApplyCut,
} from "./engine";
import { eraReturns, DEFAULT_ALLOC, LOST_DECADE_YEARS } from "./lib/backtest.js";
import { MARKET_HISTORY } from "../../shared/marketHistory.js";

// Real 2000–2009 blended returns under DEFAULT_ALLOC, straight from the dataset.
const REAL_2000S = eraReturns(MARKET_HISTORY.series, ...LOST_DECADE_YEARS, DEFAULT_ALLOC, 0, 10).full;

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

	it("handles a year-by-year returns array with per-expense inflation", () => {
		const result = project({
			startAge: 49,
			endAge: 58,
			retireAge: 49,
			ssAge: 70,
			ssAnnual: 0,
			portfolio: 3000000,
			expenses: baseExpenses,
			planId: "stay",
			nomReturn: [...REAL_2000S, 0.07],
			inflation: 0.03,
			rentalNet: 0,
		});
		expect(result.length).toBe(10);
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

describe("project — openingBalance (withdrawal-rate denominator)", () => {
	// $40k/yr of flat spending against $1M — a textbook 4% draw.
	const flatSpend = [{ id: "a", amount: 40000 / 12, plans: ["all"], inflOverride: 0 }];
	const retiredAt49 = {
		startAge: 49,
		endAge: 59,
		retireAge: 49,
		ssAge: 70,
		ssAnnual: 0,
		portfolio: 1000000,
		expenses: flatSpend,
		planId: "stay",
		nomReturn: 0.07,
		inflation: 0,
	};

	it("reports the starting portfolio as year one's opening balance", () => {
		const rows = project(retiredAt49);
		// No growth applied yet — unlike `balance`, which is already a year ahead.
		expect(rows[0].openingBalance).toBe(1000000);
		expect(rows[0].balance).toBe(1030000); // 1M * 1.07 - 40k
	});

	it("chains each year's opening balance to the prior year's close", () => {
		const rows = project(retiredAt49);
		for (let i = 1; i < rows.length; i++) {
			expect(rows[i].openingBalance).toBe(rows[i - 1].balance);
		}
	});

	it("yields exactly 4.0% for a 4% draw, where end-of-year balance does not", () => {
		const first = project(retiredAt49)[0];
		expect((first.netWithdrawal / first.openingBalance) * 100).toBeCloseTo(4.0, 6);
		// The old denominator: a year of growth ahead and already net of this
		// same withdrawal, so it understates the rate.
		expect((first.netWithdrawal / first.balance) * 100).toBeCloseTo(3.883, 3);
	});

	it("counts sale proceeds in the opening balance of the year they land", () => {
		const rows = project({
			...retiredAt49,
			startAge: 50,
			endAge: 60,
			retireAge: 50,
			transition: { moveAge: 55, netProceeds: 500000, newHomeCost: 200000 },
		});
		const beforeMove = rows.find((d) => d.age === 54);
		const moveYear = rows.find((d) => d.age === 55);
		// Proceeds are spendable the year they arrive, so a downsize lowers the
		// withdrawal rate immediately rather than a year late.
		expect(moveYear.openingBalance).toBe(beforeMove.balance + 300000);
	});

	it("is zero once the portfolio is spent, so no rate is reported", () => {
		const rows = project({
			...retiredAt49,
			portfolio: 50000,
			expenses: [{ id: "a", amount: 10000, plans: ["all"], inflOverride: 0 }],
		});
		const spent = rows.filter((d) => d.balance === 0);
		expect(spent.length).toBeGreaterThan(0);
		expect(spent[spent.length - 1].openingBalance).toBe(0);
	});
});

describe("monthlyIncomeAtAge / buildVestingSchedule", () => {
	it("applies plan tagging and age range like expenses", () => {
		const incomes = [
			{ id: "s", amount: 5000, plans: ["all"] },
			{ id: "b", amount: 1000, plans: ["stay"], ageMax: 55 },
		];
		expect(monthlyIncomeAtAge(incomes, 50, "stay")).toBe(6000);
		expect(monthlyIncomeAtAge(incomes, 50, "sell_move")).toBe(5000);
		expect(monthlyIncomeAtAge(incomes, 56, "stay")).toBe(5000);
	});

	it("grows a recurring income item at its own rate, defaulting to inflation", () => {
		const incomes = [{ id: "s", amount: 5000, plans: ["all"] }];
		const later = monthlyIncomeAtAge(incomes, 59, "all", 49, 0.03);
		expect(later).toBeCloseTo(5000 * 1.03 ** 10, 0);
	});

	it("builds an equal vesting schedule that sums to the grant value", () => {
		const schedule = buildVestingSchedule({ grantValue: 100000, startAge: 40, years: 4, pattern: "equal" });
		expect(schedule).toEqual([
			{ age: 40, amount: 25000 },
			{ age: 41, amount: 25000 },
			{ age: 42, amount: 25000 },
			{ age: 43, amount: 25000 },
		]);
	});

	it("builds a back-loaded 4-year schedule (5/15/40/40)", () => {
		const schedule = buildVestingSchedule({ grantValue: 200000, startAge: 30, years: 4, pattern: "backloaded" });
		expect(schedule.map((t) => t.amount)).toEqual([10000, 30000, 80000, 80000]);
	});

	it("a schedule-based item only pays out in its tranche age-years", () => {
		const incomes = [
			{ id: "rsu", amount: 0, plans: ["all"], schedule: buildVestingSchedule({ grantValue: 48000, startAge: 40, years: 4 }) },
		];
		expect(monthlyIncomeAtAge(incomes, 39, "all")).toBe(0);
		expect(monthlyIncomeAtAge(incomes, 40, "all")).toBe(1000); // 12000 / 12
		expect(monthlyIncomeAtAge(incomes, 44, "all")).toBe(0);
	});
});

describe("project — recurring pre-retirement income", () => {
	const expenses = [{ id: "e", amount: 3000, plans: ["all"] }];

	it("compounds a salary surplus into the portfolio before retirement", () => {
		const withIncome = project({
			startAge: 40,
			endAge: 50,
			retireAge: 65,
			ssAge: 70,
			ssAnnual: 0,
			portfolio: 500000,
			expenses,
			planId: "stay",
			nomReturn: 0.05,
			inflation: 0.03,
			incomes: [{ id: "s", type: "salary", amount: 8000, plans: ["all"] }],
		});
		const withoutIncome = project({
			startAge: 40,
			endAge: 50,
			retireAge: 65,
			ssAge: 70,
			ssAnnual: 0,
			portfolio: 500000,
			expenses,
			planId: "stay",
			nomReturn: 0.05,
			inflation: 0.03,
			incomes: [],
		});
		const at50With = withIncome.find((d) => d.age === 50);
		const at50Without = withoutIncome.find((d) => d.age === 50);
		expect(at50With.balance).toBeGreaterThan(at50Without.balance);
	});

	it("stops all income at retirement, regardless of an item's own ageMax", () => {
		const result = project({
			startAge: 60,
			endAge: 70,
			retireAge: 65,
			ssAge: 70,
			ssAnnual: 0,
			portfolio: 500000,
			expenses,
			planId: "stay",
			nomReturn: 0.05,
			inflation: 0.03,
			incomes: [{ id: "s", type: "salary", amount: 8000, plans: ["all"], ageMax: 68 }],
		});
		const preRetire = result.find((d) => d.age === 64);
		const postRetire = result.find((d) => d.age === 66);
		expect(preRetire.income).toBeGreaterThan(0);
		expect(postRetire.income).toBe(0);
	});

	it("pays out an RSU vesting schedule only in its tranche years", () => {
		const result = project({
			startAge: 40,
			endAge: 45,
			retireAge: 65,
			ssAge: 70,
			ssAnnual: 0,
			portfolio: 100000,
			expenses: [],
			planId: "stay",
			nomReturn: 0,
			inflation: 0.03,
			incomes: [
				{ id: "rsu", type: "rsu", amount: 0, plans: ["all"], schedule: buildVestingSchedule({ grantValue: 48000, startAge: 41, years: 4 }) },
			],
		});
		expect(result.find((d) => d.age === 40).income).toBe(0);
		expect(result.find((d) => d.age === 41).income).toBe(12000);
		expect(result.find((d) => d.age === 44).income).toBe(12000);
		expect(result.find((d) => d.age === 45).income).toBe(0);
	});
});

describe("shouldApplyCut", () => {
	it("cuts every year in 'all' mode, even without a returns array", () => {
		expect(shouldApplyCut(0, 0.07, "all")).toBe(true);
		expect(shouldApplyCut(30, REAL_2000S, "all")).toBe(true);
	});

	it("never cuts on a steady (scalar) return in down_recovery mode", () => {
		expect(shouldApplyCut(0, 0.07, "down_recovery")).toBe(false);
	});

	it("cuts in negative years and until the prior peak is regained", () => {
		const seq = [-0.1, 0.05, 0.1, 0.04, -0.02, 0.03];
		// index at start of year: 1, .9, .945, 1.0395 (new peak), 1.081, 1.059
		expect(seq.map((_, i) => shouldApplyCut(i, seq, "down_recovery"))).toEqual([
			true, // negative year
			true, // starts at .9 < 1 — recovering
			true, // starts at .945 < 1 — still recovering
			false, // starts at 1.0395 — recovered
			true, // negative year
			true, // starts below the 1.081 peak
		]);
	});

	it("stops cutting once the real Lost Decade has recovered", () => {
		const seq = [...REAL_2000S, 0.07];
		expect(shouldApplyCut(3, seq, "down_recovery")).toBe(true); // 2003 starts in the hole
		expect(shouldApplyCut(4, seq, "down_recovery")).toBe(false); // recovered after 2003
		expect(shouldApplyCut(8, seq, "down_recovery")).toBe(true); // 2008
		expect(shouldApplyCut(9, seq, "down_recovery")).toBe(true); // 2009 starts below 2007 peak
	});

	it("keeps tracking recovery past the end of the returns array", () => {
		// Ends still below peak; project() reuses the last value (+10%) after.
		const seq = [-0.3, 0.1];
		// index at start of year: 1, .7, .77, .847, .9317, 1.0249 (recovered)
		expect([0, 1, 2, 3, 4, 5, 6].map((i) => shouldApplyCut(i, seq, "down_recovery"))).toEqual([
			true, true, true, true, true, false, false,
		]);
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

	it("cuts discretionary 30% and luxury 70% through the downturn and recovery", () => {
		// Growth index at the start of each year: 1, .85, .765, 1.033 (recovered)
		const returns = [-0.15, -0.1, 0.35, 0.06, 0.07, 0.08, 0.08];
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
		// Year 2 is a positive year but starts below the prior peak — still cut:
		// 1950 * 1.03^2 ≈ 2068.76/mo ≈ 24825/yr
		const yr2 = result.find((d) => d.age === 51);
		expect(yr2.annualSpend).toBeCloseTo(24825, -1);
		// Year 3 starts recovered — full spending: 3500 * 1.03^3 ≈ 3824.5/mo ≈ 45894/yr
		const yr3 = result.find((d) => d.age === 52);
		expect(yr3.annualSpend).toBeCloseTo(45894, -1);
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
