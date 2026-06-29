// ─────────────────────────────────────────────────────────────────────────
//  planOutcomes — pure, synchronous, framework-free.
//
//  Parametrizes (per plan) the projection logic that PlannerProvider currently
//  hard-codes for the ACTIVE plan only. Every plan in a comparison view can be
//  run through computePlanOutcome / computePlanMonteCarlo to get a consistent,
//  side-by-side outcome derived from the very same engine the dashboard uses.
//
//  No React, no hooks, no module-level Math.random — deterministic given inputs.
// ─────────────────────────────────────────────────────────────────────────

import { project, buildReturns } from "../engine.js";
import { computePlanHealth } from "./planHealth.js";
import { runMonteCarlo } from "./montecarlo.js";

// Cost of selling a property, as a fraction of its gross value.
// (Mirrors SELLING_COSTS in PlannerProvider.jsx.)
const SELLING_COSTS = 0.06;

// ── Pure economics helpers (copied verbatim from PlannerProvider.jsx so this
// module is self-contained) ──
const propSaleNet = (p) => Math.round((p.value || 0) * (1 - SELLING_COSTS) - (p.mortgage || 0));
const propRentalNet = (p) => Math.round((p.rentMonthly || 0) * 12 * 0.95 - (p.rentCostsAnnual || 0));

function planEconomics(plan, properties) {
	let soldNet = 0;
	let rentalNet = 0;
	for (const p of properties) {
		// Only include property if it is tagged to this plan (or "all")
		const tagged = !p.plans || p.plans.includes("all") || p.plans.includes(plan.id);
		if (!tagged) continue;
		const action = plan.actions?.[p.id] || "keep";
		if (action === "sell") soldNet += propSaleNet(p);
		else if (action === "rent") rentalNet += propRentalNet(p);
	}
	const newHomeCost = plan.newHomeCost || 0;
	const transitionYears = plan.transitionYears || 0;
	const relocates =
		!plan.baseline &&
		(newHomeCost > 0 ||
			Object.values(plan.actions || {}).some((a) => a !== "keep"));
	return { soldNet, rentalNet, newHomeCost, transitionYears, relocates };
}

// Build the projection regime under test for a plan.
//   lost_decade → the bear sequence, otherwise the steady nominal average.
// NOTE: "historical_period" replay is NOT reproduced in the comparison — it
// requires a fitted backtest window that lives in PlannerProvider. Here it
// falls back to the steady average ("avg"), same as any non-bear mode.
function regimeReturns(plan) {
	return plan.marketMode === "lost_decade"
		? buildReturns("lost_decade", plan.nomReturn)
		: buildReturns("avg", plan.nomReturn);
}

// Resolve the shared projection args + transition for a plan, replicating
// PlannerProvider lines 820-838. Returns the pieces both the deterministic
// projection and the Monte Carlo simulation need, so they stay consistent.
function buildProjectionInputs(plan, ctx, econ) {
	const moveAge = plan.age + econ.transitionYears;
	let transition = null;
	// startPortInput is the portfolio handed to project(): when there is a
	// mid-stream transition the sale proceeds / new-home cost are applied as a
	// transition event; otherwise they are folded into the starting balance.
	let startPortInput = ctx.liquidValueForPlan(plan.id);
	if (econ.transitionYears > 0 && (econ.soldNet !== 0 || econ.newHomeCost > 0)) {
		transition = { moveAge, netProceeds: econ.soldNet, newHomeCost: econ.newHomeCost };
	} else {
		startPortInput = startPortInput + econ.soldNet - econ.newHomeCost;
	}
	const shared = {
		startAge: plan.age,
		endAge: ctx.endAge,
		retireAge: plan.retireAge,
		ssAge: plan.ssAge,
		ssAnnual: plan.ssAnnual,
		inflation: plan.inflation,
		expenses: ctx.expenses,
		portfolio: startPortInput,
		planId: plan.id,
		baselinePlanId: ctx.baselinePlanId,
		rentalNet: econ.rentalNet,
		transition,
		discretionaryCut: plan.discretionaryCut,
		luxuryCut: plan.luxuryCut,
		cutMode: plan.cutMode,
	};
	return { shared, transition, moveAge, startPortInput };
}

// ── Export 1 — computePlanOutcome(plan, ctx) -> outcome ──
export function computePlanOutcome(plan, ctx) {
	const econ = planEconomics(plan, ctx.propertyAssets);
	const { shared, transition, moveAge, startPortInput } = buildProjectionInputs(plan, ctx, econ);

	const primary = project({ ...shared, nomReturn: regimeReturns(plan) });

	// Balance at/after the transition event (the meaningful "starting" balance
	// once any relocation has settled).
	const postTransAge = transition ? transition.moveAge : plan.age;
	const atPost = primary.find((d) => d.age === postTransAge);
	const startPort = atPost?.balance ?? startPortInput;

	const last = primary[primary.length - 1];
	const endingBalanceNominal = last ? last.balance : 0;

	// First retirement-or-later year where the portfolio hits zero.
	const runsOutRow = primary.find((d) => d.balance <= 0 && d.age >= plan.retireAge);
	const runsOutAge = runsOutRow ? runsOutRow.age : null;

	// Effective withdrawal rate at the first "settled retirement" year: the later
	// of retirement and (if relocating) the move age.
	const wrAge = Math.max(plan.retireAge, plan.age + (econ.relocates ? econ.transitionYears : 0));
	const wrRow = primary.find((d) => d.age === wrAge) || {};
	const effWR = wrRow.balance > 0 ? (wrRow.netWithdrawal / wrRow.balance) * 100 : 0;
	const annualSpendAtRetire = wrRow.annualSpend ?? 0;

	const health = computePlanHealth({
		runsOut: runsOutAge != null ? { age: runsOutAge } : null,
		effWR,
		wrTarget: 4,
	});

	const series = primary.map((d) => ({ age: d.age, balance: d.balance }));

	return {
		planId: plan.id,
		name: plan.name,
		tone: plan.tone,
		icon: plan.icon,
		baseline: plan.baseline,
		age: plan.age,
		inflation: plan.inflation,
		endAge: ctx.endAge,
		econ: {
			soldNet: econ.soldNet,
			rentalNet: econ.rentalNet,
			newHomeCost: econ.newHomeCost,
			transitionYears: econ.transitionYears,
			relocates: econ.relocates,
			netToPortfolio: econ.soldNet - econ.newHomeCost,
		},
		startPort,
		endingBalanceNominal,
		runsOutAge,
		effWR,
		annualSpendAtRetire,
		health,
		series,
	};
}

// ── Export 2 — computePlanMonteCarlo(plan, ctx, opts) -> { successRate, p10, p50, p90 } ──
export function computePlanMonteCarlo(plan, ctx, opts = {}) {
	const { trials = 300, vol = 0.15, seed = 0x1234abcd } = opts;
	const econ = planEconomics(plan, ctx.propertyAssets);
	const { shared } = buildProjectionInputs(plan, ctx, econ);
	const years = ctx.endAge - plan.age + 1;

	// Same simulate() contract as SuccessProbability.jsx: feed each randomized
	// return path through the same projection args the deterministic line uses,
	// so MC and the projection line stay consistent.
	const simulate = (returns) => {
		const rowsOut = project({ ...shared, nomReturn: returns });
		let depletionAge = null;
		for (const r of rowsOut) {
			if (r.age >= plan.retireAge && r.balance <= 0) {
				depletionAge = r.age;
				break;
			}
		}
		const terminal = rowsOut.length ? rowsOut[rowsOut.length - 1].balance : 0;
		return { survived: depletionAge == null && terminal > 0, terminal: Math.max(0, terminal), depletionAge };
	};

	const mc = runMonteCarlo({ trials, years, mean: plan.nomReturn, vol, seed, simulate });
	return { successRate: mc.successRate, p10: mc.p10, p50: mc.p50, p90: mc.p90 };
}
