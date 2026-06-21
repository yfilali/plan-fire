import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useCallback,
} from "react";
import {
	usePersistedState,
	useStore,
} from "../usePersistedState.jsx";
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
   Planner state, organized as named scenarios. A scenario is a snapshot of
   every planner input. Switching scenarios swaps the whole input set; edits
   write back into the active scenario. All projection math lives here so the
   views stay presentational.
   ─────────────────────────────────────────────────────────────────────── */

const END_AGE = 95;
const SELLING_COSTS = 0.06;

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
	// Housing
	housingPlan: "sell_move",
	ccHomeCost: 1000000,
	transitionYears: 1,
	// Landlord
	monthlyRent: 4500,
	monthlyMortgage: 2400,
	annualPropTax: 14000,
	annualLandlordCosts: 13000,
	// Real estate
	houseValue: 1900000,
	mortgageOwed: 500000,
	byersValue: 500000,
	// Data
	categories: DEFAULT_CATEGORIES,
	expenses: DEFAULT_EXPENSES,
};

const FIELD_KEYS = Object.keys(PLANNER_DEFAULTS);
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const PlannerContext = createContext(null);

function makeScenario(name, data = {}) {
	return {
		id: uid(),
		name,
		createdAt: Date.now(),
		data: { ...PLANNER_DEFAULTS, ...data },
	};
}

export function PlannerProvider({ children }) {
	const { store, loaded } = useStore();
	const [scenarios, setScenarios] = usePersistedState("scenarios", null);
	const [activeId, setActiveId] = usePersistedState("activeScenarioId", null);
	const [realDollars, setRealDollars] = usePersistedState("realDollars", false);

	// One-time seed / migration: fold any legacy top-level keys into "My Plan".
	useEffect(() => {
		if (!loaded) return;
		if (scenarios && Object.keys(scenarios).length) return;
		const seed = {};
		for (const k of FIELD_KEYS) {
			seed[k] = store[k] !== undefined ? store[k] : PLANNER_DEFAULTS[k];
		}
		const sc = makeScenario("My Plan", seed);
		setScenarios({ [sc.id]: sc });
		setActiveId(sc.id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loaded, scenarios]);

	const active = scenarios && activeId ? scenarios[activeId] : null;
	const data = useMemo(
		() => ({ ...PLANNER_DEFAULTS, ...(active?.data || {}) }),
		[active],
	);

	// Per-field setters that write into the active scenario.
	const setters = useMemo(() => {
		const out = {};
		for (const k of FIELD_KEYS) {
			out["set" + cap(k)] = (valOrFn) =>
				setScenarios((prev) => {
					const cur = prev?.[activeId];
					if (!cur) return prev;
					const old = cur.data?.[k] ?? PLANNER_DEFAULTS[k];
					const next = typeof valOrFn === "function" ? valOrFn(old) : valOrFn;
					return {
						...prev,
						[activeId]: { ...cur, data: { ...cur.data, [k]: next } },
					};
				});
		}
		return out;
	}, [activeId, setScenarios]);

	// Scenario management API.
	const scenarioList = useMemo(
		() =>
			scenarios
				? Object.values(scenarios).sort((a, b) => a.createdAt - b.createdAt)
				: [],
		[scenarios],
	);

	const createScenario = useCallback(
		(name, { duplicateFrom } = {}) => {
			const base =
				duplicateFrom && scenarios?.[duplicateFrom]
					? scenarios[duplicateFrom].data
					: PLANNER_DEFAULTS;
			const sc = makeScenario(name || "Untitled plan", base);
			setScenarios((prev) => ({ ...(prev || {}), [sc.id]: sc }));
			setActiveId(sc.id);
			return sc.id;
		},
		[scenarios, setScenarios, setActiveId],
	);

	const renameScenario = useCallback(
		(id, name) =>
			setScenarios((prev) =>
				prev?.[id] ? { ...prev, [id]: { ...prev[id], name } } : prev,
			),
		[setScenarios],
	);

	const deleteScenario = useCallback(
		(id) => {
			setScenarios((prev) => {
				if (!prev || Object.keys(prev).length <= 1) return prev;
				const next = { ...prev };
				delete next[id];
				if (activeId === id) {
					const fallback = Object.values(next).sort(
						(a, b) => a.createdAt - b.createdAt,
					)[0];
					setActiveId(fallback.id);
				}
				return next;
			});
		},
		[activeId, setScenarios, setActiveId],
	);

	// ── Derived real-estate figures ──
	const grossRent = data.monthlyRent * 12;
	const landlordExp =
		data.monthlyMortgage * 12 + data.annualPropTax + data.annualLandlordCosts;
	const netRental = Math.round(grossRent * 0.95 - landlordExp);
	const houseNet = Math.round(
		data.houseValue * (1 - SELLING_COSTS) - data.mortgageOwed,
	);
	const byersNet = Math.round(data.byersValue * (1 - SELLING_COSTS));
	const totalRENet = houseNet + byersNet;
	const realRet = (1 + data.nomReturn) / (1 + data.inflation) - 1;

	// ── Spending helpers ──
	const avgReturns = useMemo(
		() => buildReturns("avg", data.nomReturn),
		[data.nomReturn],
	);
	const bearReturns = useMemo(
		() => buildReturns("lost_decade", data.nomReturn),
		[data.nomReturn],
	);

	const spendAt = useCallback(
		(a, scen) =>
			monthlySpendAtAge(
				data.expenses,
				a,
				scen || data.housingPlan,
				data.age,
				data.inflation,
				data.marketMode === "lost_decade" ? bearReturns : avgReturns,
				data.discretionaryCut,
				data.luxuryCut,
				data.cutMode,
			) * 12,
		[data, avgReturns, bearReturns],
	);

	// Before the move you still live in the current home, so "now" spending
	// uses the stay profile unless the plan is an immediate (0-year) transition.
	const spendNow = spendAt(
		data.age,
		data.transitionYears > 0 || data.housingPlan === "stay"
			? "stay"
			: data.housingPlan,
	);
	const spend65 = spendAt(65, data.housingPlan);
	const spend70 = spendAt(70, data.housingPlan);
	const dispSpend65 = realDollars
		? deflate(spend65, 65 - data.age, data.inflation)
		: spend65;
	const dispSpend70 = realDollars
		? deflate(spend70, 70 - data.age, data.inflation)
		: spend70;

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

		let trans = null;
		let rental = 0;
		const scenario = data.housingPlan;

		if (data.housingPlan === "sell_move") {
			trans = {
				moveAge: data.age + data.transitionYears,
				netProceeds: totalRENet,
				newHomeCost: data.ccHomeCost,
				preSpend: 0,
			};
		} else if (data.housingPlan === "rent_out") {
			rental = netRental;
		}

		const startPort =
			data.housingPlan === "rent_out"
				? data.portfolio + byersNet - data.ccHomeCost
				: data.portfolio;

		const cuts = {
			discretionaryCut: data.discretionaryCut,
			luxuryCut: data.luxuryCut,
			cutMode: data.cutMode,
		};
		const primary = project({
			...common,
			portfolio: startPort,
			scenario,
			nomReturn: activeR,
			rentalNet: rental,
			transition: trans,
			...cuts,
		});
		const alt = project({
			...common,
			portfolio: startPort,
			scenario,
			nomReturn: altR,
			rentalNet: rental,
			transition: trans,
			...cuts,
		});

		const postTransAge = trans ? trans.moveAge : data.age;
		const atPost = primary.find((d) => d.age === postTransAge);

		return {
			primary,
			alt,
			primaryLabel:
				data.marketMode === "lost_decade" ? "Lost Decade" : "Historical Avg",
			altLabel:
				data.marketMode === "lost_decade" ? "Historical Avg" : "Lost Decade",
			startPort: atPost?.balance || startPort,
		};
	}, [data, totalRENet, netRental, byersNet]);

	const runsOut = projections.primary.find(
		(d) => d.balance <= 0 && d.age >= data.retireAge,
	);
	const altRunsOut = projections.alt.find(
		(d) => d.balance <= 0 && d.age >= data.retireAge,
	);
	const getD = useCallback(
		(a, d = projections.primary) => d.find((x) => x.age === a) || {},
		[projections],
	);

	const postData = getD(
		Math.max(
			data.retireAge,
			data.age + (data.housingPlan === "sell_move" ? data.transitionYears : 0),
		),
	);
	const effWR =
		postData.balance > 0
			? (postData.netWithdrawal / postData.balance) * 100
			: 0;

	const fullChartData = useMemo(
		() =>
			projections.primary.map((d, i) => {
				const adj = (v) =>
					realDollars ? deflate(v, d.age - data.age, data.inflation) : v;
				return {
					age: d.age,
					primary: adj(d.balance),
					alt: adj(projections.alt[i]?.balance || 0),
					spending: adj(d.annualSpend),
					income: adj(d.income),
					netWithdrawal: adj(d.netWithdrawal),
					wdRate:
						d.balance > 0 && d.netWithdrawal > 0
							? (d.netWithdrawal / d.balance) * 100
							: d.balance > 0
								? 0
								: null,
				};
			}),
		[projections, realDollars, data.age, data.inflation],
	);

	const fullReturnsTimeline = useMemo(() => {
		const pts = [];
		for (let a = data.age; a <= END_AGE; a += 1) {
			const lost = returnForYear("lost_decade", a - data.age, data.nomReturn);
			pts.push({ age: a, lost });
		}
		return pts;
	}, [data.age, data.nomReturn]);

	// Named field accessors: age, setAge, portfolio, setPortfolio, …
	const fields = useMemo(() => {
		const out = {};
		for (const k of FIELD_KEYS) out[k] = data[k];
		return out;
	}, [data]);

	const value = {
		ready: !!active,
		// inputs + setters
		...fields,
		...setters,
		// constants
		endAge: END_AGE,
		// view pref
		realDollars,
		setRealDollars,
		// derived RE
		grossRent,
		landlordExp,
		netRental,
		houseNet,
		byersNet,
		totalRENet,
		realRet,
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

	return (
		<PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
	);
}

export function usePlanner() {
	const ctx = useContext(PlannerContext);
	if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
	return ctx;
}
