import { describe, it, expect } from "vitest";
import { computeMilestones } from "./milestones.js";

// Build a simple rising-then-falling trajectory of projection-shaped rows.
function rows(balances, { startAge = 40, income = 0, spend = 40_000 } = {}) {
	return balances.map((b, i) => ({
		age: startAge + i,
		balance: b,
		netWorth: b,
		income,
		annualSpend: spend,
		netWithdrawal: Math.max(0, spend - income),
	}));
}

describe("computeMilestones", () => {
	it("flags net-worth crossings at the right ages", () => {
		const r = rows([400_000, 600_000, 1_100_000, 2_500_000], { startAge: 40 });
		const ms = computeMilestones(r, { age: 40, retireAge: 65, fiNumber: 1_000_000, realRet: 0.03 });
		const byKey = Object.fromEntries(ms.map((m) => [m.key, m]));
		expect(byKey.nw500k.age).toBe(41);
		expect(byKey.nw1m.age).toBe(42);
		expect(byKey.nw2m.age).toBe(43);
	});

	it("reports 'never runs out' when the balance stays positive", () => {
		const r = rows([500_000, 800_000, 1_200_000, 1_500_000], { startAge: 60 });
		const ms = computeMilestones(r, { age: 60, retireAge: 62, fiNumber: 1_000_000 });
		const dep = ms.find((m) => m.key === "depletion");
		expect(dep.age).toBe(null);
		expect(dep.label).toMatch(/never/i);
	});

	it("detects depletion in the retirement era", () => {
		const r = rows([800_000, 400_000, 100_000, 0], { startAge: 64, spend: 90_000 });
		const ms = computeMilestones(r, { age: 64, retireAge: 65, fiNumber: 1_000_000 });
		const dep = ms.find((m) => m.key === "depletion");
		expect(dep.age).toBe(67);
	});

	it("always returns the core milestone keys", () => {
		const ms = computeMilestones(rows([100_000]), { age: 40, retireAge: 65, fiNumber: 1_000_000 });
		const keys = ms.map((m) => m.key).sort();
		expect(keys).toEqual(["coast", "depletion", "fi", "nw1m", "nw2m", "nw500k"].sort());
	});
});
