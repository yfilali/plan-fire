// ── Projection Engine v2: Phase-Aware ────────────────────────────────

export const LOST_DECADE = [
	-0.15, -0.1, 0.05, -0.05, 0.02, 0.03, 0.04, 0.06, 0.08, 0.09,
];

// Pre-computed: year indices that are in downturn/recovery period for LOST_DECADE
// Downturn years (return < 0): 0, 1, 3
// Cumulative returns: -15%, -25%, -20%, -25%, -23%, -20%, -16%, -10%, -2%, +7%
// Recovery ends at year 9 when cumulative crosses above zero
const LOST_DECADE_RECOVERY_CUTOFF = 9; // cuts apply through year 8 inclusive

/**
 * Check if we should apply spending cuts for a given year.
 * cutMode:
 *   'down_recovery' — cuts during downturn + until portfolio recovers (cumulative return >= 0)
 *   'all'           — cuts applied uniformly to ALL years
 *
 * NOTE: This is the single source of truth for when cuts apply. Both project() and
 * monthlySpendAtAge() must use it so dashboard stats, charts, and projections agree.
 */
export function shouldApplyCut(yearIdx, returnsArr, cutMode) {
	if (!returnsArr || !returnsArr.length) return false;

	const yi = Math.max(0, Math.min(yearIdx, returnsArr.length - 1));

	// "all" mode: cuts every year
	if (cutMode === "all") return true;

	// For LOST_DECADE-style arrays, use pre-computed recovery cutoff
	const isLostDecade =
		returnsArr[0] === -0.15 &&
		returnsArr[1] === -0.1 &&
		returnsArr.length >= 10;
	if (isLostDecade) return yi <= LOST_DECADE_RECOVERY_CUTOFF;

	// Generic fallback for ad-hoc arrays: cut only in years where the return
	// is negative. "all" mode already handled above (returns true for everything).
	return returnsArr[yi] < 0;
}

/**
 * Calculate active monthly expenses for a given age + housing scenario.
 * Each expense can specify which scenarios it applies to, an age range,
 * and an optional inflation override (null = use global inflation, 0 = fixed).
 * Optionally apply spending cuts based on cutMode ('all' or 'down_recovery').
 */
export function monthlySpendAtAge(
	expenses,
	age,
	scenario,
	startAge = null,
	globalInflation = null,

	returnsArr = null,
	discretionaryCut = 0,
	luxuryCut = 0,
	cutMode = "down_recovery",
) {
	return expenses
		.filter((e) => {
			const scenarioMatch =
				!e.scenarios ||
				e.scenarios.includes("all") ||
				e.scenarios.includes(scenario);
			const ageMatch =
				(e.ageMin == null || age >= e.ageMin) &&
				(e.ageMax == null || age <= e.ageMax);
			return scenarioMatch && ageMatch;
		})
		.reduce((sum, e) => {
			let amount;
			// Calculate accumulated inflation multiplier from startAge to this age
			if (startAge !== null && globalInflation !== null) {
				const yearsPassed = Math.max(0, age - startAge);
				const rate = e.inflOverride != null ? e.inflOverride : globalInflation;
				amount = e.amount * (1 + rate) ** yearsPassed;
			} else {
				// Legacy: return base amount (no inflation accumulation)
				amount = e.amount;
			}

			// Apply spending cuts — cutMode is the sole decision gate
			if (
				cutMode === "all" ||
				(returnsArr !== null && typeof amount === "number")
			) {
				const yearIdx = age - startAge;
				// For "all" mode or when we have a returns array, use shouldApplyCut
				if (cutMode === "all" || (returnsArr !== null && shouldApplyCut(yearIdx, returnsArr, cutMode))) {
					if (e.tier === "discretionary") amount *= 1 - discretionaryCut;
					else if (e.tier === "luxury") amount *= 1 - luxuryCut;
				}
			}

			sum += amount;
			return sum;
		}, 0);
}

/**
 * Full projection with per-expense inflation tracking and nominal returns.
 * Portfolio grows at nominal return. Each expense inflates at its own rate
 * (inflOverride if set, otherwise global inflation). Fixed expenses (0) stay flat.
 */
export function project({
	startAge,
	endAge,
	retireAge,
	portfolio,
	expenses,
	scenario,
	nomReturn,
	inflation,
	ssAge,
	ssAnnual,
	rentalNet = 0,
	transition = null,
	workIncome = 0,
	discretionaryCut = 0,
	luxuryCut = 0,
	cutMode = "down_recovery",
	reAppreciation = 0.04,
	retainedRE = null,
}) {
	const data = [];
	let b = portfolio;

	// Real estate tracking
	const hasRE = retainedRE != null;
	let reHouse = hasRE ? retainedRE.houseValue || 0 : 0;
	let reMortgage = hasRE ? retainedRE.mortgage || 0 : 0;
	let reCC = hasRE ? retainedRE.ccHomeCost || 0 : 0;
	let transitionHappened = false;

	// Per-expense cumulative inflation accumulators (year 0 = base)
	const inflAccum = {};
	expenses.forEach((_, i) => {
		inflAccum[i] = 1;
	});

	for (let a = startAge; a <= endAge; a++) {
		const yi = a - startAge;
		const thisNom = Array.isArray(nomReturn)
			? yi < nomReturn.length
				? nomReturn[yi]
				: nomReturn[nomReturn.length - 1]
			: nomReturn;

		// Grow portfolio at nominal return
		b *= 1 + thisNom;

		// Real estate transition event
		if (transition && a === transition.moveAge) {
			b += transition.netProceeds - transition.newHomeCost;
			transitionHappened = true;
			if (scenario === "sell_move") {
				reHouse = 0;
				reMortgage = 0;
				reCC = retainedRE?.ccHomeCost || 0;
			}
		}

		const activeScenario =
			transition && a < transition.moveAge ? "stay" : scenario;

		// Dynamic spending with per-expense inflation + downturn tier cuts
		let monthlySpend = 0;
		expenses.forEach((e, i) => {
			const scenarioMatch =
				!e.scenarios ||
				e.scenarios.includes("all") ||
				e.scenarios.includes(activeScenario);
			const ageMatch =
				(e.ageMin == null || a >= e.ageMin) &&
				(e.ageMax == null || a <= e.ageMax);
			if (scenarioMatch && ageMatch) {
				let amount = e.amount * inflAccum[i];
				// Apply spending cuts — cutMode controls whether cuts apply.
				// "all" mode applies cuts every year regardless of returns array.
				// "down_recovery" requires a returns array to determine downtime/recovery.
				if (cutMode === "all" || Array.isArray(nomReturn)) {
					const yearIdx = yi;
					if (cutMode === "all" || shouldApplyCut(yearIdx, nomReturn, cutMode)) {
						if (e.tier === "discretionary") amount *= 1 - discretionaryCut;
						else if (e.tier === "luxury") amount *= 1 - luxuryCut;
					}
				}
				monthlySpend += amount;
			}
		});
		const annualSpend = monthlySpend * 12;

		// Accumulate inflation for next year
		expenses.forEach((e, i) => {
			const rate = e.inflOverride != null ? e.inflOverride : inflation;
			inflAccum[i] *= 1 + rate;
		});

		// Income sources
		const isRetired = a >= retireAge;
		const ssIncome = a >= ssAge ? ssAnnual : 0;
		const rental = activeScenario !== "stay" ? rentalNet : 0;
		const income = (isRetired ? 0 : workIncome) + ssIncome + rental;

		// Net withdrawal
		if (isRetired) {
			b -= Math.max(0, annualSpend - income);
		} else {
			const surplus = income - annualSpend;
			if (surplus > 0) b += surplus;
		}

		if (b < 0) b = 0;

		// Net worth
		const netWorth = hasRE
			? Math.round(b + reHouse - reMortgage + reCC)
			: Math.round(b);

		data.push({
			age: a,
			balance: Math.round(b),
			annualSpend: Math.round(annualSpend),
			income: Math.round(income),
			netWithdrawal: Math.round(
				isRetired ? Math.max(0, annualSpend - income) : 0,
			),
			activeScenario,
			netWorth,
		});

		// Appreciate retained RE for next year
		if (hasRE) {
			const houseRetained =
				scenario === "stay" || scenario === "rent_out" || !transitionHappened;
			if (houseRetained && reHouse > 0) reHouse *= 1 + reAppreciation;
			if (reCC > 0) reCC *= 1 + reAppreciation;
		}
	}
	return data;
}

export function buildReturns(mode, nomAvg) {
	if (mode === "lost_decade") return [...LOST_DECADE, nomAvg];
	return nomAvg;
}

// ── Helpers ──────────────────────────────────────────────────────────

export const fmt = (v) => {
	if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
	if (Math.abs(v) >= 1e3) return `$${Math.round(v / 1e3)}K`;
	if (v < 0) return `-${fmt(Math.abs(v))}`;
	return `$${Math.round(v)}`;
};

export const fmtFull = (v) => `$${Math.round(v).toLocaleString()}`;
export const uid = () => Math.random().toString(36).slice(2, 8);

export const COLOR_OPTIONS = [
	"#6366f1",
	"#f59e0b",
	"#22c55e",
	"#ef4444",
	"#3b82f6",
	"#8b5cf6",
	"#f97316",
	"#ec4899",
	"#14b8a6",
	"#6b7280",
	"#a855f7",
	"#84cc16",
	"#06b6d4",
	"#e11d48",
	"#d946ef",
];

export const DEFAULT_CATEGORIES = [
	{ id: "housing_ba", label: "Bay Area Housing", icon: "🏙️", color: "#6366f1" },
	{ id: "housing_cc", label: "CC Housing", icon: "🌲", color: "#22c55e" },
	{ id: "transport", label: "Transport", icon: "🚗", color: "#f59e0b" },
	{ id: "food", label: "Food & Dining", icon: "🍽️", color: "#84cc16" },
	{ id: "health", label: "Healthcare", icon: "🏥", color: "#ef4444" },
	{ id: "plane", label: "Aviation", icon: "✈️", color: "#3b82f6" },
	{ id: "insurance", label: "Insurance", icon: "🛡️", color: "#8b5cf6" },
	{ id: "utils", label: "Utilities", icon: "⚡", color: "#f97316" },
	{ id: "personal", label: "Personal", icon: "👤", color: "#ec4899" },
	{ id: "travel", label: "Travel", icon: "🌎", color: "#14b8a6" },
	{ id: "other", label: "Other", icon: "📦", color: "#6b7280" },
];

export const SCENARIO_LABELS = {
	all: "All Plans",
	stay: "Stay BA Only",
	sell_move: "Sell+CC Only",
	rent_out: "Rent+CC Only",
};

export const DEFAULT_EXPENSES = [
	// Bay Area housing — only when staying
	{
		id: uid(),
		cat: "housing_ba",
		name: "Mortgage",
		amount: 2400,
		scenarios: ["stay"],
		inflOverride: 0,
		tier: "essential",
	},
	{
		id: uid(),
		cat: "housing_ba",
		name: "Property Tax",
		amount: 1200,
		scenarios: ["stay"],
		inflOverride: 0.02,
		tier: "essential",
	},
	{
		id: uid(),
		cat: "housing_ba",
		name: "Home Insurance",
		amount: 250,
		scenarios: ["stay"],
		tier: "essential",
	},
	{
		id: uid(),
		cat: "housing_ba",
		name: "Maintenance",
		amount: 400,
		scenarios: ["stay"],
		tier: "essential",
	},

	// Crescent City housing — when moving (sell or rent out SJ)
	{
		id: uid(),
		cat: "housing_cc",
		name: "CC Property Tax",
		amount: 850,
		scenarios: ["sell_move", "rent_out"],
		inflOverride: 0.02,
		tier: "essential",
	},
	{
		id: uid(),
		cat: "housing_cc",
		name: "CC Home Insurance",
		amount: 200,
		scenarios: ["sell_move", "rent_out"],
		tier: "essential",
	},
	{
		id: uid(),
		cat: "housing_cc",
		name: "CC Maintenance",
		amount: 300,
		scenarios: ["sell_move", "rent_out"],
		tier: "essential",
	},

	// Healthcare — AGE-PHASED
	{
		id: uid(),
		cat: "health",
		name: "ACA Health Insurance (pre-Medicare)",
		amount: 1500,
		scenarios: ["all"],
		ageMax: 64,
		inflOverride: 0.065,
		tier: "essential",
	},
	{
		id: uid(),
		cat: "health",
		name: "Medicare + Medigap",
		amount: 400,
		scenarios: ["all"],
		ageMin: 65,
		tier: "essential",
	},
	{
		id: uid(),
		cat: "health",
		name: "Medical/Dental OOP",
		amount: 200,
		scenarios: ["all"],
		tier: "essential",
	},

	// Core living — all scenarios, all ages
	{
		id: uid(),
		cat: "transport",
		name: "Car Insurance & Gas",
		amount: 400,
		scenarios: ["all"],
		inflOverride: 0,
		tier: "essential",
	},
	{
		id: uid(),
		cat: "food",
		name: "Groceries",
		amount: 800,
		scenarios: ["all"],
		tier: "essential",
	},
	{
		id: uid(),
		cat: "food",
		name: "Dining Out",
		amount: 600,
		scenarios: ["all"],
		tier: "discretionary",
	},
	{
		id: uid(),
		cat: "plane",
		name: "Hangar",
		amount: 800,
		scenarios: ["all"],
		inflOverride: 0,
		tier: "discretionary",
	},
	{
		id: uid(),
		cat: "plane",
		name: "Fuel & Maintenance",
		amount: 1000,
		scenarios: ["all"],
		tier: "discretionary",
	},
	{
		id: uid(),
		cat: "plane",
		name: "Plane Insurance",
		amount: 400,
		scenarios: ["all"],
		inflOverride: 0,
		tier: "essential",
	},
	{
		id: uid(),
		cat: "insurance",
		name: "Umbrella / Life",
		amount: 200,
		scenarios: ["all"],
		inflOverride: 0,
		tier: "essential",
	},
	{
		id: uid(),
		cat: "utils",
		name: "Electric, Water, Internet",
		amount: 350,
		scenarios: ["all"],
		tier: "essential",
	},
	{
		id: uid(),
		cat: "personal",
		name: "Subscriptions & Shopping",
		amount: 500,
		scenarios: ["all"],
		tier: "discretionary",
	},
	{
		id: uid(),
		cat: "travel",
		name: "Vacations / Trips",
		amount: 1000,
		scenarios: ["all"],
		tier: "luxury",
	},
	{
		id: uid(),
		cat: "other",
		name: "Misc / Buffer",
		amount: 500,
		scenarios: ["all"],
		tier: "discretionary",
	},
];
