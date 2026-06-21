import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useCallback,
} from "react";
import { usePersistedState, useStore } from "../usePersistedState.jsx";
import {
	project,
	buildReturns,
	monthlySpendAtAge,
	returnForYear,
	deflate,
	uid,
	DEFAULT_CATEGORIES,
	DEFAULT_EXPENSES,
} from "../engine.js";

/* ──────────────────────────────────────────────────────────────────────
   Planner state, organized as named scenarios. A scenario snapshots every
   input. Housing is modeled generically: a list of user-defined PROPERTIES
   and a list of user-defined PLANS. Each plan says what happens to each
   property (keep / sell / rent) plus an optional new-home purchase and
   transition delay. Expenses tag which plan(s) they apply to. All projection
   math lives here so views stay presentational.
   ─────────────────────────────────────────────────────────────────────── */

const END_AGE = 100;
const SELLING_COSTS = 0.06;
export const PLAN_TONES = ["accent", "blue", "purple", "warning", "danger"];
export const PLAN_ICONS = ["🏙️", "🌲", "🏠", "🏖️", "🌆", "🏡", "⛰️", "🏝️", "🌃", "🏘️"];

// Legacy single-scenario fields → used to migrate older saved data.
const LEGACY = {
	houseValue: 1900000,
	mortgageOwed: 500000,
	byersValue: 500000,
	ccHomeCost: 1000000,
	transitionYears: 1,
	monthlyRent: 4500,
	monthlyMortgage: 2400,
	annualPropTax: 14000,
	annualLandlordCosts: 13000,
};

// Build the generic properties/plans shape from either new or legacy data.
function upgradeData(data) {
	if (Array.isArray(data.plans) && Array.isArray(data.properties)) return data;
	const g = (k) => (data[k] !== undefined ? data[k] : LEGACY[k]);
	const properties = [
		{
			id: "home",
			name: "Current home",
			value: g("houseValue"),
			mortgage: g("mortgageOwed"),
			rentMonthly: g("monthlyRent"),
			rentCostsAnnual:
				g("monthlyMortgage") * 12 + g("annualPropTax") + g("annualLandlordCosts"),
		},
		{
			id: "second",
			name: "Second property",
			value: g("byersValue"),
			mortgage: 0,
			rentMonthly: 0,
			rentCostsAnnual: 0,
		},
	];
	const plans = [
		{ id: "stay", name: "Stay put", icon: "🏙️", tone: "danger", baseline: true, actions: { home: "keep", second: "keep" }, newHomeCost: 0, transitionYears: 0 },
		{ id: "sell_move", name: "Sell + relocate", icon: "🌲", tone: "accent", baseline: false, actions: { home: "sell", second: "sell" }, newHomeCost: g("ccHomeCost"), transitionYears: g("transitionYears") },
		{ id: "rent_out", name: "Rent out + relocate", icon: "🏠", tone: "blue", baseline: false, actions: { home: "rent", second: "sell" }, newHomeCost: g("ccHomeCost"), transitionYears: 0 },
	];
	return { ...data, properties, plans, activePlanId: data.housingPlan || "sell_move" };
}

const SEED_HOUSING = upgradeData({});

export const PLANNER_DEFAULTS = {
	// Profile
	age: 49,
	retireAge: 49,
	portfolio: 3000000,
	ssAge: 70,
	ssAnnual: 40000,
	// Market
	nomReturn: 0.1,
	inflation: 0.03,
	marketMode: "historical",
	// Downturn spending cuts
	discretionaryCut: 0.3,
	luxuryCut: 0.7,
	cutMode: "down_recovery",
	// Expenses
	categories: DEFAULT_CATEGORIES,
	expenses: DEFAULT_EXPENSES,
	// Housing (generic)
	properties: SEED_HOUSING.properties,
	plans: SEED_HOUSING.plans,
	activePlanId: SEED_HOUSING.activePlanId,
};

const FIELD_KEYS = Object.keys(PLANNER_DEFAULTS);
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ── Pure economics helpers ──
const propSaleNet = (p) => Math.round((p.value || 0) * (1 - SELLING_COSTS) - (p.mortgage || 0));
const propRentalNet = (p) => Math.round((p.rentMonthly || 0) * 12 * 0.95 - (p.rentCostsAnnual || 0));

function planEconomics(plan, properties) {
	let soldNet = 0;
	let rentalNet = 0;
	for (const p of properties) {
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

const PlannerContext = createContext(null);

function makeScenario(name, data = {}) {
	return { id: uid(), name, createdAt: Date.now(), data: { ...PLANNER_DEFAULTS, ...data } };
}

export function PlannerProvider({ children }) {
	const { store, loaded } = useStore();
	const [scenarios, setScenarios] = usePersistedState("scenarios", null);
	const [activeId, setActiveId] = usePersistedState("activeScenarioId", null);
	const [realDollars, setRealDollars] = usePersistedState("realDollars", false);

	// One-time seed / migration of legacy top-level keys into "My Plan".
	useEffect(() => {
		if (!loaded) return;
		if (scenarios && Object.keys(scenarios).length) return;
		const seed = {};
		for (const k of FIELD_KEYS) seed[k] = store[k] !== undefined ? store[k] : PLANNER_DEFAULTS[k];
		const sc = makeScenario("My Plan", upgradeData(seed));
		setScenarios({ [sc.id]: sc });
		setActiveId(sc.id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loaded, scenarios]);

	// Upgrade any scenario still on the old housing shape, and persist it.
	useEffect(() => {
		if (!scenarios) return;
		let changed = false;
		const next = {};
		for (const [id, sc] of Object.entries(scenarios)) {
			if (sc?.data && !(Array.isArray(sc.data.plans) && Array.isArray(sc.data.properties))) {
				next[id] = { ...sc, data: upgradeData(sc.data) };
				changed = true;
			} else next[id] = sc;
		}
		if (changed) setScenarios(next);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scenarios]);

	const active = scenarios && activeId ? scenarios[activeId] : null;
	const data = useMemo(
		() => ({ ...PLANNER_DEFAULTS, ...upgradeData(active?.data || {}) }),
		[active],
	);

	// Generic per-field setters that write into the active scenario.
	const setters = useMemo(() => {
		const out = {};
		for (const k of FIELD_KEYS) {
			out["set" + cap(k)] = (valOrFn) =>
				setScenarios((prev) => {
					const cur = prev?.[activeId];
					if (!cur) return prev;
					const old = cur.data?.[k] ?? PLANNER_DEFAULTS[k];
					const nextVal = typeof valOrFn === "function" ? valOrFn(old) : valOrFn;
					return { ...prev, [activeId]: { ...cur, data: { ...cur.data, [k]: nextVal } } };
				});
		}
		return out;
	}, [activeId, setScenarios]);

	// ── Scenario management ──
	const scenarioList = useMemo(
		() => (scenarios ? Object.values(scenarios).sort((a, b) => a.createdAt - b.createdAt) : []),
		[scenarios],
	);
	const createScenario = useCallback(
		(name, { duplicateFrom } = {}) => {
			const base = duplicateFrom && scenarios?.[duplicateFrom] ? scenarios[duplicateFrom].data : PLANNER_DEFAULTS;
			const sc = makeScenario(name || "Untitled plan", base);
			setScenarios((prev) => ({ ...(prev || {}), [sc.id]: sc }));
			setActiveId(sc.id);
			return sc.id;
		},
		[scenarios, setScenarios, setActiveId],
	);
	const renameScenario = useCallback(
		(id, name) => setScenarios((prev) => (prev?.[id] ? { ...prev, [id]: { ...prev[id], name } } : prev)),
		[setScenarios],
	);
	const deleteScenario = useCallback(
		(id) => {
			setScenarios((prev) => {
				if (!prev || Object.keys(prev).length <= 1) return prev;
				const next = { ...prev };
				delete next[id];
				if (activeId === id) setActiveId(Object.values(next).sort((a, b) => a.createdAt - b.createdAt)[0].id);
				return next;
			});
		},
		[activeId, setScenarios, setActiveId],
	);

	// ── Properties & plans ──
	const { properties, plans, activePlanId } = data;
	const setActivePlanId = setters.setActivePlanId;

	const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];
	const baselinePlan = plans.find((p) => p.baseline) || plans[0];

	// Atomically patch the active scenario's data in ONE write. Critical:
	// the persistence setter resolves functional updates against a captured
	// snapshot, so two setters in the same event would clobber each other —
	// every compound mutation must go through a single mutateData call.
	const mutateData = useCallback(
		(updater) =>
			setScenarios((prev) => {
				const cur = prev?.[activeId];
				if (!cur) return prev;
				return { ...prev, [activeId]: { ...cur, data: updater(cur.data) } };
			}),
		[activeId, setScenarios],
	);

	const addProperty = useCallback(
		() =>
			mutateData((d) => ({
				...d,
				properties: [
					...(d.properties || []),
					{ id: uid(), name: `Property ${(d.properties?.length || 0) + 1}`, value: 0, mortgage: 0, rentMonthly: 0, rentCostsAnnual: 0 },
				],
			})),
		[mutateData],
	);
	const updateProperty = useCallback(
		(id, patch) => mutateData((d) => ({ ...d, properties: d.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
		[mutateData],
	);
	const removeProperty = useCallback(
		(id) =>
			mutateData((d) => ({
				...d,
				properties: d.properties.filter((p) => p.id !== id),
				plans: d.plans.map((pl) => {
					if (!pl.actions?.[id]) return pl;
					const actions = { ...pl.actions };
					delete actions[id];
					return { ...pl, actions };
				}),
			})),
		[mutateData],
	);

	const addPlan = useCallback(
		(name) => {
			const id = uid();
			mutateData((d) => {
				const used = new Set(d.plans.map((p) => p.tone));
				const tone = PLAN_TONES.find((t) => !used.has(t)) || PLAN_TONES[d.plans.length % PLAN_TONES.length];
				const plan = { id, name: name || `Plan ${d.plans.length + 1}`, icon: PLAN_ICONS[d.plans.length % PLAN_ICONS.length], tone, baseline: false, actions: {}, newHomeCost: 0, transitionYears: 0 };
				return { ...d, plans: [...d.plans, plan], activePlanId: id };
			});
			return id;
		},
		[mutateData],
	);
	const updatePlan = useCallback(
		(id, patch) =>
			mutateData((d) => ({
				...d,
				plans: d.plans.map((pl) => {
					if (pl.id === id) return { ...pl, ...patch };
					return patch.baseline ? { ...pl, baseline: false } : pl;
				}),
			})),
		[mutateData],
	);
	const setPlanAction = useCallback(
		(planId, propId, action) =>
			mutateData((d) => ({ ...d, plans: d.plans.map((pl) => (pl.id === planId ? { ...pl, actions: { ...pl.actions, [propId]: action } } : pl)) })),
		[mutateData],
	);
	const removePlan = useCallback(
		(id) =>
			mutateData((d) => {
				if (d.plans.length <= 1) return d;
				const removed = d.plans.find((p) => p.id === id);
				let next = d.plans.filter((p) => p.id !== id);
				if (removed?.baseline && !next.some((p) => p.baseline)) next = next.map((p, i) => (i === 0 ? { ...p, baseline: true } : p));
				const expenses = d.expenses.map((e) => {
					if (!e.scenarios?.includes(id)) return e;
					const left = e.scenarios.filter((s) => s !== id);
					return { ...e, scenarios: left.length ? left : ["all"] };
				});
				const nextActive = d.activePlanId === id ? (next.find((p) => p.baseline) || next[0]).id : d.activePlanId;
				return { ...d, plans: next, expenses, activePlanId: nextActive };
			}),
		[mutateData],
	);

	// Categories also live in scenario data, so deleting one (and its
	// expenses) must be a single atomic write.
	const addCategory = useCallback((cat) => mutateData((d) => ({ ...d, categories: [...d.categories, cat] })), [mutateData]);
	const removeCategory = useCallback(
		(catId) => mutateData((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== catId), expenses: d.expenses.filter((e) => e.cat !== catId) })),
		[mutateData],
	);

	const realRet = (1 + data.nomReturn) / (1 + data.inflation) - 1;

	// ── Active-plan economics ──
	const activeEcon = useMemo(() => {
		const e = planEconomics(activePlan, properties);
		return { ...e, moveAge: data.age + e.transitionYears };
	}, [activePlan, properties, data.age]);

	// ── Spending helpers ──
	const avgReturns = useMemo(() => buildReturns("avg", data.nomReturn), [data.nomReturn]);
	const bearReturns = useMemo(() => buildReturns("lost_decade", data.nomReturn), [data.nomReturn]);
	const spendAt = useCallback(
		(a, planId) =>
			monthlySpendAtAge(
				data.expenses,
				a,
				planId || activePlanId,
				data.age,
				data.inflation,
				data.marketMode === "lost_decade" ? bearReturns : avgReturns,
				data.discretionaryCut,
				data.luxuryCut,
				data.cutMode,
			) * 12,
		[data, activePlanId, avgReturns, bearReturns],
	);

	// Before a future relocation you still live the baseline plan.
	const preMovePlanId = activeEcon.transitionYears > 0 && activeEcon.relocates ? baselinePlan.id : activePlanId;
	const spendNow = spendAt(data.age, preMovePlanId);
	const spend65 = spendAt(65, activePlanId);
	const spend70 = spendAt(70, activePlanId);
	const dispSpend65 = realDollars ? deflate(spend65, 65 - data.age, data.inflation) : spend65;
	const dispSpend70 = realDollars ? deflate(spend70, 70 - data.age, data.inflation) : spend70;

	// ── Projections ──
	const projections = useMemo(() => {
		const avgR = buildReturns("avg", data.nomReturn);
		const bearR = buildReturns("lost_decade", data.nomReturn);
		const activeR = data.marketMode === "lost_decade" ? bearR : avgR;
		const altR = data.marketMode === "lost_decade" ? avgR : bearR;
		const common = {
			startAge: data.age,
			endAge: END_AGE,
			retireAge: data.retireAge,
			ssAge: data.ssAge,
			ssAnnual: data.ssAnnual,
			inflation: data.inflation,
			expenses: data.expenses,
		};
		const econ = planEconomics(activePlan, properties);
		const moveAge = data.age + econ.transitionYears;
		let trans = null;
		let startPort = data.portfolio;
		if (econ.transitionYears > 0 && (econ.soldNet !== 0 || econ.newHomeCost > 0)) {
			trans = { moveAge, netProceeds: econ.soldNet, newHomeCost: econ.newHomeCost };
		} else {
			startPort = data.portfolio + econ.soldNet - econ.newHomeCost;
		}
		const cuts = { discretionaryCut: data.discretionaryCut, luxuryCut: data.luxuryCut, cutMode: data.cutMode };
		const shared = {
			...common,
			portfolio: startPort,
			scenario: activePlanId,
			baselineScenario: baselinePlan.id,
			rentalNet: econ.rentalNet,
			transition: trans,
			...cuts,
		};
		const primary = project({ ...shared, nomReturn: activeR });
		const alt = project({ ...shared, nomReturn: altR });
		const postTransAge = trans ? trans.moveAge : data.age;
		const atPost = primary.find((d) => d.age === postTransAge);
		return {
			primary,
			alt,
			primaryLabel: data.marketMode === "lost_decade" ? "Lost Decade" : "Historical Avg",
			altLabel: data.marketMode === "lost_decade" ? "Historical Avg" : "Lost Decade",
			startPort: atPost?.balance || startPort,
		};
	}, [data, properties, activePlan, activePlanId, baselinePlan]);

	const runsOut = projections.primary.find((d) => d.balance <= 0 && d.age >= data.retireAge);
	const altRunsOut = projections.alt.find((d) => d.balance <= 0 && d.age >= data.retireAge);
	const getD = useCallback((a, d = projections.primary) => d.find((x) => x.age === a) || {}, [projections]);

	const postData = getD(Math.max(data.retireAge, data.age + (activeEcon.relocates ? activeEcon.transitionYears : 0)));
	const effWR = postData.balance > 0 ? (postData.netWithdrawal / postData.balance) * 100 : 0;

	const fullChartData = useMemo(
		() =>
			projections.primary.map((d, i) => {
				const adj = (v) => (realDollars ? deflate(v, d.age - data.age, data.inflation) : v);
				return {
					age: d.age,
					primary: adj(d.balance),
					alt: adj(projections.alt[i]?.balance || 0),
					spending: adj(d.annualSpend),
					income: adj(d.income),
					netWithdrawal: adj(d.netWithdrawal),
					wdRate: d.balance > 0 && d.netWithdrawal > 0 ? (d.netWithdrawal / d.balance) * 100 : d.balance > 0 ? 0 : null,
				};
			}),
		[projections, realDollars, data.age, data.inflation],
	);
	const fullReturnsTimeline = useMemo(() => {
		const pts = [];
		for (let a = data.age; a <= END_AGE; a += 1) pts.push({ age: a, lost: returnForYear("lost_decade", a - data.age, data.nomReturn) });
		return pts;
	}, [data.age, data.nomReturn]);

	const fields = useMemo(() => {
		const out = {};
		for (const k of FIELD_KEYS) out[k] = data[k];
		return out;
	}, [data]);

	const value = {
		ready: !!active,
		...fields,
		...setters,
		endAge: END_AGE,
		realDollars,
		setRealDollars,
		// housing
		properties,
		plans,
		activePlanId,
		activePlan,
		baselinePlan,
		activeEcon,
		realRet,
		setActivePlanId,
		addProperty,
		updateProperty,
		removeProperty,
		addPlan,
		updatePlan,
		removePlan,
		setPlanAction,
		addCategory,
		removeCategory,
		propSaleNet,
		propRentalNet,
		// spending
		spendAt,
		spendNow,
		spend65,
		spend70,
		dispSpend65,
		dispSpend70,
		// projections
		projections,
		runsOut,
		altRunsOut,
		getD,
		effWR,
		fullChartData,
		fullReturnsTimeline,
		// scenarios
		scenarios: scenarioList,
		activeScenario: active,
		activeId,
		switchScenario: setActiveId,
		createScenario,
		renameScenario,
		deleteScenario,
	};

	return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
	const ctx = useContext(PlannerContext);
	if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
	return ctx;
}
