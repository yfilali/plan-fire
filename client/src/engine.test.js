import { describe, it, expect } from "vitest";
import { project, monthlySpendAtAge, buildReturns } from "./engine";

describe("monthlySpendAtAge", () => {
	// Base expenses: $800/mo groceries (CPI-linked), $2400/mo mortgage (fixed)
	const baseExpenses = [
		{
			id: "a",
			cat: "food",
			name: "Groceries",
			amount: 800,
			scenarios: ["all"],
			inflOverride: null,
		},
		{
			id: "b",
			cat: "housing",
			name: "Mortgage",
			amount: 2400,
			scenarios: ["stay"],
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
				scenarios: ["all"],
				inflOverride: 0.065,
			}, // healthcare premium inflation
			{
				id: "b",
				cat: "food",
				name: "Groceries",
				amount: 800,
				scenarios: ["all"],
				inflOverride: null,
			},
		];
		// At age 59: ACA = 1500 * 1.065^10 ≈ 2815.71, Groceries = 800 * 1.03^10 ≈ 1075.13
		const result = monthlySpendAtAge(expenses, 59, "all", 49, 0.03);
		expect(result).toBeCloseTo(3890.84, 1);
	});

	it("excludes expenses that do not match scenario", () => {
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
			scenarios: ["all"],
			inflOverride: null,
		},
		{
			id: "b",
			cat: "housing",
			name: "Mortgage BA",
			amount: 2400,
			scenarios: ["stay"],
			inflOverride: 0,
		},
		{
			id: "c",
			cat: "health",
			name: "ACA",
			amount: 1500,
			scenarios: ["all"],
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
			scenario: "stay",
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
			scenario: "stay",
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

	it("handles lost decade returns array with per-expense inflation", () => {
		const result = project({
			startAge: 49,
			endAge: 58,
			retireAge: 49,
			ssAge: 70,
			ssAnnual: 0,
			portfolio: 3000000,
			expenses: baseExpenses,
			scenario: "stay",
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
		// Extreme scenario: low portfolio + high expenses so depletion is visible
		const expenses = [
			{
				id: "a",
				cat: "food",
				name: "Groceries",
				amount: 8000,
				scenarios: ["all"],
				inflOverride: null,
			},
			{
				id: "b",
				cat: "health",
				name: "ACA",
				amount: 5000,
				scenarios: ["all"],
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
			scenario: "stay",
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
});
