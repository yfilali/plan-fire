import { describe, it, expect } from "vitest";
import { computePlanOutcome, computePlanMonteCarlo } from "./planOutcomes.js";

// ── Fixtures ──────────────────────────────────────────────────────────
// A shared expense pool (today's-dollar monthly amounts, tagged to all plans).
const EXPENSES = [
	{ id: "e_core", amount: 4000, tier: "essential", plans: ["all"] },
	{ id: "e_disc", amount: 1500, tier: "discretionary", plans: ["all"] },
];

// One property, tagged to all plans, that a relocating plan can sell.
const PROPERTY = {
	id: "p_home",
	type: "property",
	value: 800000,
	mortgage: 100000,
	plans: ["all"],
};

const BASELINE_ID = "keep";

function makeCtx(liquidByPlan) {
	return {
		expenses: EXPENSES,
		propertyAssets: [PROPERTY],
		liquidValueForPlan: (planId) => liquidByPlan[planId] ?? 0,
		baselinePlanId: BASELINE_ID,
		endAge: 100,
	};
}

const basePlanInputs = {
	age: 50,
	retireAge: 65,
	ssAge: 67,
	ssAnnual: 24000,
	nomReturn: 0.06,
	inflation: 0.025,
	marketMode: "avg",
	discretionaryCut: 0.2,
	luxuryCut: 0.5,
	cutMode: "down_recovery",
	actions: {},
	newHomeCost: 0,
	transitionYears: 0,
};

// Baseline: keeps everything, never relocates, healthy nest egg.
const keepPlan = {
	...basePlanInputs,
	id: BASELINE_ID,
	name: "Keep the house",
	tone: "blue",
	icon: "🏠",
	baseline: true,
};

// Relocating: sells the home and buys a cheaper one over a 5-year transition.
const sellPlan = {
	...basePlanInputs,
	id: "sell",
	name: "Sell & downsize",
	tone: "purple",
	icon: "🌴",
	baseline: false,
	actions: { p_home: "sell" },
	newHomeCost: 300000,
	transitionYears: 5,
};

const CTX = makeCtx({ [BASELINE_ID]: 2000000, sell: 1500000 });

describe("computePlanOutcome", () => {
	it("returns the documented keys with correct types", () => {
		const o = computePlanOutcome(keepPlan, CTX);
		expect(o.planId).toBe(BASELINE_ID);
		expect(o.name).toBe("Keep the house");
		expect(o.tone).toBe("blue");
		expect(o.icon).toBe("🏠");
		expect(o.baseline).toBe(true);
		expect(o.age).toBe(50);
		expect(o.inflation).toBe(0.025);
		expect(o.endAge).toBe(100);

		expect(typeof o.startPort).toBe("number");
		expect(typeof o.endingBalanceNominal).toBe("number");
		expect(typeof o.effWR).toBe("number");
		expect(typeof o.annualSpendAtRetire).toBe("number");
		expect(o.runsOutAge === null || typeof o.runsOutAge === "number").toBe(true);

		expect(o.econ).toEqual(
			expect.objectContaining({
				soldNet: expect.any(Number),
				rentalNet: expect.any(Number),
				newHomeCost: expect.any(Number),
				transitionYears: expect.any(Number),
				relocates: expect.any(Boolean),
				netToPortfolio: expect.any(Number),
			}),
		);

		expect(o.health).toEqual(
			expect.objectContaining({
				status: expect.any(String),
				label: expect.any(String),
				reasons: expect.any(Array),
			}),
		);
		expect(["healthy", "caution", "atRisk"]).toContain(o.health.status);
	});

	it("computes econ.netToPortfolio === soldNet - newHomeCost", () => {
		const o = computePlanOutcome(sellPlan, CTX);
		expect(o.econ.netToPortfolio).toBe(o.econ.soldNet - o.econ.newHomeCost);
		// Sanity: selling the tagged property yields a positive net.
		expect(o.econ.soldNet).toBeGreaterThan(0);
		expect(o.econ.relocates).toBe(true);
	});

	it("produces a series whose last balance equals endingBalanceNominal", () => {
		const o = computePlanOutcome(keepPlan, CTX);
		expect(Array.isArray(o.series)).toBe(true);
		expect(o.series.length).toBeGreaterThan(0);
		for (const pt of o.series) {
			expect(typeof pt.age).toBe("number");
			expect(typeof pt.balance).toBe("number");
		}
		expect(o.series[0].age).toBe(keepPlan.age);
		expect(o.series[o.series.length - 1].age).toBe(CTX.endAge);
		expect(o.series[o.series.length - 1].balance).toBe(o.endingBalanceNominal);
	});

	it("flags an over-spent, tiny-portfolio plan as atRisk that runs out", () => {
		const brokeCtx = makeCtx({ broke: 50000 });
		const brokePlan = {
			...basePlanInputs,
			id: "broke",
			name: "Spend it all",
			tone: "warning",
			icon: "🔥",
			baseline: true,
			retireAge: 52,
			// no spending cuts → withdrawals stay high
			discretionaryCut: 0,
			luxuryCut: 0,
		};
		const o = computePlanOutcome(brokePlan, brokeCtx);
		expect(o.runsOutAge).not.toBeNull();
		expect(o.runsOutAge).toBeGreaterThanOrEqual(brokePlan.retireAge);
		expect(o.health.status).toBe("atRisk");
	});
});

describe("computePlanMonteCarlo", () => {
	it("returns a success rate in [0,1] and ordered percentiles", () => {
		const mc = computePlanMonteCarlo(keepPlan, CTX, { trials: 120, seed: 0x1234abcd });
		expect(mc.successRate).toBeGreaterThanOrEqual(0);
		expect(mc.successRate).toBeLessThanOrEqual(1);
		expect(mc.p10).toBeLessThanOrEqual(mc.p50);
		expect(mc.p50).toBeLessThanOrEqual(mc.p90);
	});

	it("is deterministic for a fixed seed", () => {
		const a = computePlanMonteCarlo(sellPlan, CTX, { trials: 120, seed: 7 });
		const b = computePlanMonteCarlo(sellPlan, CTX, { trials: 120, seed: 7 });
		expect(a).toEqual(b);
	});
});
