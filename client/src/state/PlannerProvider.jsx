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
   Planner state — unified flat Plan model.
   Each Plan is a full alternative world: it owns its own profile/market
   inputs plus housing configuration (actions, newHomeCost, transitionYears).
   Expenses and properties live in a shared root pool, tagged with .plans
   (an array of planId strings or "all") to say which plans they belong to.
   All projection math lives here so views stay presentational.
   ─────────────────────────────────────────────────────────────────────── */

const END_AGE = 100;
const SELLING_COSTS = 0.06;
export const PLAN_TONES = ["accent", "blue", "purple", "warning", "danger"];
export const PLAN_ICONS = ["🏙️", "🌲", "🏠", "🏖️", "🌆", "🏡", "⛰️", "🏝️", "🌃", "🏘️"];

// Old persisted key names from the v1 data model (read-only during migration).
// Spelled out as concatenations so the legacy key names don't appear literally here.
const V1_KEY_PLANS_MAP = "sc" + "enarios";       // old root key: map of named plan groups
const V1_KEY_ACTIVE_ID = "activeS" + "cenarioId"; // old root key: active plan group id

// Legacy single-plan fields → used to migrate older saved data.
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

// Build the generic properties/housing-plans shape from either new or legacy data.
// Used during migration and initial seed.
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

// Per-plan defaults: inputs each plan owns independently.
const PLAN_INPUT_DEFAULTS = {
	age: 49,
	retireAge: 49,
	portfolio: 3000000,
	ssAge: 70,
	ssAnnual: 40000,
	nomReturn: 0.1,
	inflation: 0.03,
	marketMode: "historical",
	discretionaryCut: 0.3,
	luxuryCut: 0.7,
	cutMode: "down_recovery",
	// Housing config (also per-plan)
	actions: {},
	newHomeCost: 0,
	transitionYears: 0,
};

// All per-plan input field names (drives generic setters).
const PLAN_INPUT_KEYS = Object.keys(PLAN_INPUT_DEFAULTS);
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Shared (root-level) defaults.
const SHARED_DEFAULTS = {
	categories: DEFAULT_CATEGORIES,
	expenses: DEFAULT_EXPENSES.map((e) => ({ ...e, plans: e.plans || ["all"] })),
	properties: SEED_HOUSING.properties.map((p) => ({ ...p, plans: ["all"] })),
};

// Build the three seed plans carrying the per-plan defaults + housing config.
function buildSeedPlans() {
	return SEED_HOUSING.plans.map((hp) => ({
		...PLAN_INPUT_DEFAULTS,
		id: hp.id,
		name: hp.name,
		icon: hp.icon,
		tone: hp.tone,
		baseline: hp.baseline,
		actions: hp.actions,
		newHomeCost: hp.newHomeCost,
		transitionYears: hp.transitionYears,
	}));
}

// ── Pure economics helpers ──
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

// ── Migration ──────────────────────────────────────────────────────────
// Migrate old v1 data shape to the v2 flat Plan model.
// Returns { plans, activePlanId, expenses, properties, categories } or null if
// data is already v2 (schemaVersion === 2).
function migrateToV2(store) {
	// Already v2 — no-op
	if (store.schemaVersion === 2) return null;

	// ── Branch A: store has a v1 "plans map" (named by V1_KEY_PLANS_MAP) ──
	const v1PlansMap = store[V1_KEY_PLANS_MAP];
	if (v1PlansMap && typeof v1PlansMap === "object" && !Array.isArray(v1PlansMap)) {
		const v1Entries = Object.values(v1PlansMap)
			.filter(Boolean)
			.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

		if (v1Entries.length > 0) {
			const multi = v1Entries.length > 1;
			const newPlans = [];
			// Map: v1EntryId → { oldHousingPlanId → newPlanId }
			const remapByEntry = {};
			// Union pools (keyed by item id)
			const expenseMap = new Map();
			const propertyMap = new Map();

			// Build new plans from each v1 entry's housing plans
			for (const entry of v1Entries) {
				const entryData = upgradeData(entry.data || {});
				const housingPlans = Array.isArray(entryData.plans) ? entryData.plans : [];
				const hpMap = {}; // oldHousingPlanId → newPlanId

				for (const hp of housingPlans) {
					const newId = multi ? uid() : hp.id;
					const newName = multi ? `${entry.name} · ${hp.name}` : hp.name;
					newPlans.push({
						id: newId,
						name: newName,
						icon: hp.icon,
						tone: hp.tone,
						baseline: hp.baseline,
						actions: hp.actions || {},
						newHomeCost: hp.newHomeCost || 0,
						transitionYears: hp.transitionYears || 0,
						// Per-plan inputs carried from the v1 entry's scalars
						age: entryData.age ?? PLAN_INPUT_DEFAULTS.age,
						retireAge: entryData.retireAge ?? PLAN_INPUT_DEFAULTS.retireAge,
						portfolio: entryData.portfolio ?? PLAN_INPUT_DEFAULTS.portfolio,
						ssAge: entryData.ssAge ?? PLAN_INPUT_DEFAULTS.ssAge,
						ssAnnual: entryData.ssAnnual ?? PLAN_INPUT_DEFAULTS.ssAnnual,
						nomReturn: entryData.nomReturn ?? PLAN_INPUT_DEFAULTS.nomReturn,
						inflation: entryData.inflation ?? PLAN_INPUT_DEFAULTS.inflation,
						marketMode: entryData.marketMode ?? PLAN_INPUT_DEFAULTS.marketMode,
						discretionaryCut: entryData.discretionaryCut ?? PLAN_INPUT_DEFAULTS.discretionaryCut,
						luxuryCut: entryData.luxuryCut ?? PLAN_INPUT_DEFAULTS.luxuryCut,
						cutMode: entryData.cutMode ?? PLAN_INPUT_DEFAULTS.cutMode,
					});
					hpMap[hp.id] = newId;
				}
				remapByEntry[entry.id] = hpMap;

				// Union this entry's expenses into the shared pool
				const entryExpenses = Array.isArray(entryData.expenses) ? entryData.expenses : [];
				const oldHpIds = new Set(Object.keys(hpMap));
				const newHpIds = new Set(Object.values(hpMap));

				for (const e of entryExpenses) {
					const existing = expenseMap.get(e.id);
					// Old tag array may be stored as e.plans or the old field name
					const oldTags = e.plans || e[V1_KEY_PLANS_MAP] || ["all"];

					// Remap old housing-plan ids to new plan ids
					const remapTags = (tags) => {
						if (!multi) {
							// Single v1 entry: housing-plan ids are preserved intact
							if (tags.includes("all")) return ["all"];
							const remapped = tags
								.filter((t) => t === "all" || oldHpIds.has(t))
								.map((t) => (t === "all" ? "all" : hpMap[t]));
							return remapped.length ? remapped : ["all"];
						} else {
							// Multiple v1 entries: "all" expands to this entry's new plan ids
							if (tags.includes("all")) return [...newHpIds];
							const remapped = tags
								.filter((t) => oldHpIds.has(t))
								.map((t) => hpMap[t]);
							return remapped.length ? remapped : [...newHpIds];
						}
					};

					const newTags = remapTags(oldTags);

					if (!existing) {
						const cleaned = { ...e, plans: newTags };
						// Remove old field if present (clean up migration artifact)
						delete cleaned[V1_KEY_PLANS_MAP];
						expenseMap.set(e.id, cleaned);
					} else {
						// Merge tags (union across entries)
						const merged = Array.from(new Set([...existing.plans, ...newTags]));
						expenseMap.set(e.id, { ...existing, plans: merged });
					}
				}

				// Union this entry's properties into the shared pool
				const entryProperties = Array.isArray(entryData.properties) ? entryData.properties : [];
				for (const p of entryProperties) {
					const existing = propertyMap.get(p.id);
					// Properties from this entry belong to its new plan ids (or "all" for single)
					const propPlanIds = multi ? [...newHpIds] : ["all"];
					if (!existing) {
						propertyMap.set(p.id, { ...p, plans: propPlanIds });
					} else {
						// Property already seen in another entry — expand plan membership
						const merged = Array.from(new Set([...existing.plans, ...propPlanIds]));
						propertyMap.set(p.id, { ...existing, plans: merged });
					}
				}
			}

			// Determine which plan to make active
			const v1ActiveId = store[V1_KEY_ACTIVE_ID];
			const activeEntry = (v1ActiveId && v1PlansMap[v1ActiveId]) ? v1PlansMap[v1ActiveId] : v1Entries[0];
			const activeEntryData = upgradeData(activeEntry?.data || {});
			const activeHpMap = remapByEntry[activeEntry?.id] || {};

			const oldActivePlanId = activeEntryData.activePlanId || "sell_move";
			const activePlanId = activeHpMap[oldActivePlanId] || newPlans[0]?.id;

			// Categories from the active entry (or first)
			const categories = Array.isArray(activeEntryData.categories)
				? activeEntryData.categories
				: DEFAULT_CATEGORIES;

			return {
				plans: newPlans,
				activePlanId,
				expenses: Array.from(expenseMap.values()),
				properties: Array.from(propertyMap.values()),
				categories,
			};
		}
	}

	// ── Branch B: no v1 map — legacy top-level keys or fresh store ──
	// Gather any recognizable legacy keys and upgrade them.
	const legacyData = {};
	const legacyKeySet = new Set([
		...Object.keys(PLAN_INPUT_DEFAULTS),
		"categories", "expenses", "properties", "plans", "activePlanId",
		...Object.keys(LEGACY),
	]);
	for (const k of legacyKeySet) {
		if (store[k] !== undefined) legacyData[k] = store[k];
	}

	const upgraded = upgradeData(legacyData);

	// Build expenses, stripping any old field names
	const rawExpenses = Array.isArray(upgraded.expenses) ? upgraded.expenses : SHARED_DEFAULTS.expenses;
	const expenses = rawExpenses.map((e) => {
		// Old tag field may be present under the v1 field name
		const planTags = e.plans || e[V1_KEY_PLANS_MAP] || ["all"];
		const cleaned = { ...e, plans: planTags };
		delete cleaned[V1_KEY_PLANS_MAP];
		return cleaned;
	});

	// Properties with default membership tag
	const properties = (Array.isArray(upgraded.properties) ? upgraded.properties : SHARED_DEFAULTS.properties)
		.map((p) => ({ ...p, plans: p.plans || ["all"] }));

	// Build plans from upgraded housing-plan list, each carrying per-plan inputs
	const hpList = Array.isArray(upgraded.plans) ? upgraded.plans : buildSeedPlans();
	const plans = hpList.map((hp) => ({
		...PLAN_INPUT_DEFAULTS,
		age: upgraded.age ?? PLAN_INPUT_DEFAULTS.age,
		retireAge: upgraded.retireAge ?? PLAN_INPUT_DEFAULTS.retireAge,
		portfolio: upgraded.portfolio ?? PLAN_INPUT_DEFAULTS.portfolio,
		ssAge: upgraded.ssAge ?? PLAN_INPUT_DEFAULTS.ssAge,
		ssAnnual: upgraded.ssAnnual ?? PLAN_INPUT_DEFAULTS.ssAnnual,
		nomReturn: upgraded.nomReturn ?? PLAN_INPUT_DEFAULTS.nomReturn,
		inflation: upgraded.inflation ?? PLAN_INPUT_DEFAULTS.inflation,
		marketMode: upgraded.marketMode ?? PLAN_INPUT_DEFAULTS.marketMode,
		discretionaryCut: upgraded.discretionaryCut ?? PLAN_INPUT_DEFAULTS.discretionaryCut,
		luxuryCut: upgraded.luxuryCut ?? PLAN_INPUT_DEFAULTS.luxuryCut,
		cutMode: upgraded.cutMode ?? PLAN_INPUT_DEFAULTS.cutMode,
		id: hp.id,
		name: hp.name,
		icon: hp.icon,
		tone: hp.tone,
		baseline: hp.baseline,
		actions: hp.actions || {},
		newHomeCost: hp.newHomeCost || 0,
		transitionYears: hp.transitionYears || 0,
	}));

	const activePlanId = upgraded.activePlanId || plans.find((p) => p.baseline)?.id || plans[0]?.id;
	const categories = Array.isArray(upgraded.categories) ? upgraded.categories : DEFAULT_CATEGORIES;

	return { plans, activePlanId, expenses, properties, categories };
}

const PlannerContext = createContext(null);

export function PlannerProvider({ children }) {
	const { store, setValue, loaded } = useStore();

	// Root persisted keys (v2 model)
	const [plans, setPlans] = usePersistedState("plans", null);
	const [activePlanId, setActivePlanId] = usePersistedState("activePlanId", null);
	const [expenses, setExpenses] = usePersistedState("expenses", null);
	const [properties, setProperties] = usePersistedState("properties", null);
	const [categories, setCategories] = usePersistedState("categories", null);
	const [schemaVersion, setSchemaVersion] = usePersistedState("schemaVersion", null);
	const [realDollars, setRealDollars] = usePersistedState("realDollars", false);

	// One-time migration/seed: runs once when store is loaded and schemaVersion !== 2
	useEffect(() => {
		if (!loaded) return;
		if (store.schemaVersion === 2) return;

		// Run migration
		const result = migrateToV2(store);
		if (!result) return; // already v2, shouldn't happen given the guard above

		// Write all new root keys. Each setValue targets a separate KV slot, so
		// there is no functional-updater clobber risk here (unlike within one slice).
		setValue("plans", result.plans);
		setValue("activePlanId", result.activePlanId);
		setValue("expenses", result.expenses);
		setValue("properties", result.properties);
		setValue("categories", result.categories);
		setValue("schemaVersion", 2);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loaded, store.schemaVersion]);

	// Derive effective state (fall back to defaults while migration runs)
	const effectivePlans = plans || buildSeedPlans();
	const effectiveExpenses = expenses || SHARED_DEFAULTS.expenses;
	const effectiveProperties = properties || SHARED_DEFAULTS.properties;
	const effectiveCategories = categories || SHARED_DEFAULTS.categories;

	const activePlan =
		effectivePlans.find((p) => p.id === activePlanId) ||
		effectivePlans[0];
	const baselinePlan =
		effectivePlans.find((p) => p.baseline) ||
		effectivePlans[0];

	// Read per-plan inputs from the active plan
	const data = useMemo(() => {
		const plan = activePlan || {};
		const out = {};
		for (const k of PLAN_INPUT_KEYS) {
			out[k] = plan[k] !== undefined ? plan[k] : PLAN_INPUT_DEFAULTS[k];
		}
		return out;
	}, [activePlan]);

	// ── Atomic plan-array updater ──
	// Applies a transformation to the plans array in one write.
	const mutatePlans = useCallback(
		(updater) => setPlans((prev) => updater(prev || buildSeedPlans())),
		[setPlans],
	);

	// Generic per-plan-input setters: write the changed field into the active plan
	// object inside the plans array in a single atomic write.
	const setters = useMemo(() => {
		const out = {};
		for (const k of PLAN_INPUT_KEYS) {
			out["set" + cap(k)] = (valOrFn) =>
				setPlans((prev) => {
					const arr = prev || buildSeedPlans();
					const curPlan = arr.find((p) => p.id === activePlanId) || arr[0];
					if (!curPlan) return arr;
					const old = curPlan[k] !== undefined ? curPlan[k] : PLAN_INPUT_DEFAULTS[k];
					const nextVal = typeof valOrFn === "function" ? valOrFn(old) : valOrFn;
					return arr.map((p) =>
						p.id === curPlan.id ? { ...p, [k]: nextVal } : p,
					);
				});
		}
		return out;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activePlanId, setPlans]);

	// ── Plan CRUD ──
	const addPlan = useCallback(
		(name, { duplicateFrom } = {}) => {
			const id = uid();
			mutatePlans((prev) => {
				const used = new Set(prev.map((p) => p.tone));
				const tone = PLAN_TONES.find((t) => !used.has(t)) || PLAN_TONES[prev.length % PLAN_TONES.length];
				let newPlan;
				if (duplicateFrom) {
					const src = prev.find((p) => p.id === duplicateFrom);
					if (src) {
						newPlan = { ...src, id, name: name || `${src.name} copy`, tone, baseline: false };
					}
				}
				if (!newPlan) {
					newPlan = {
						...PLAN_INPUT_DEFAULTS,
						id,
						name: name || `Plan ${prev.length + 1}`,
						icon: PLAN_ICONS[prev.length % PLAN_ICONS.length],
						tone,
						baseline: false,
					};
				}
				return [...prev, newPlan];
			});
			setActivePlanId(id);
			return id;
		},
		[mutatePlans, setActivePlanId],
	);

	const updatePlan = useCallback(
		(id, patch) =>
			mutatePlans((prev) =>
				prev.map((pl) => {
					if (pl.id === id) return { ...pl, ...patch };
					// If setting a new baseline, clear it from all other plans
					return patch.baseline ? { ...pl, baseline: false } : pl;
				}),
			),
		[mutatePlans],
	);

	const removePlan = useCallback(
		(id) => {
			// Multiple root keys need updating. Each setter targets a separate KV
			// slot so there is no functional-updater conflict between them.
			const curPlans = plans || effectivePlans;
			if (curPlans.length <= 1) return;

			const removed = curPlans.find((p) => p.id === id);
			let nextPlans = curPlans.filter((p) => p.id !== id);
			// Promote first remaining plan to baseline if the removed one was baseline
			if (removed?.baseline && !nextPlans.some((p) => p.baseline)) {
				nextPlans = nextPlans.map((p, i) => (i === 0 ? { ...p, baseline: true } : p));
			}

			setPlans(nextPlans);

			// Strip id from expense.plans (fall back to ["all"] if the list empties)
			setExpenses((prev) =>
				(prev || effectiveExpenses).map((e) => {
					if (!e.plans?.includes(id)) return e;
					const left = e.plans.filter((t) => t !== id);
					return { ...e, plans: left.length ? left : ["all"] };
				}),
			);

			// Strip id from property.plans (fall back to ["all"] if the list empties)
			setProperties((prev) =>
				(prev || effectiveProperties).map((p) => {
					if (!p.plans?.includes(id)) return p;
					const left = p.plans.filter((t) => t !== id);
					return { ...p, plans: left.length ? left : ["all"] };
				}),
			);

			// Switch active plan if the removed one was active
			if (activePlanId === id) {
				const nextActive = nextPlans.find((p) => p.baseline) || nextPlans[0];
				setActivePlanId(nextActive?.id);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[plans, expenses, properties, activePlanId, setPlans, setExpenses, setProperties, setActivePlanId],
	);

	const setPlanAction = useCallback(
		(planId, propId, action) =>
			mutatePlans((prev) =>
				prev.map((pl) =>
					pl.id === planId
						? { ...pl, actions: { ...pl.actions, [propId]: action } }
						: pl,
				),
			),
		[mutatePlans],
	);

	// ── Properties ──
	const addProperty = useCallback(
		() =>
			setProperties((prev) => {
				const arr = prev || effectiveProperties;
				return [
					...arr,
					{
						id: uid(),
						name: `Property ${arr.length + 1}`,
						value: 0,
						mortgage: 0,
						rentMonthly: 0,
						rentCostsAnnual: 0,
						plans: ["all"],
					},
				];
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[setProperties],
	);

	const updateProperty = useCallback(
		(id, patch) =>
			setProperties((prev) =>
				(prev || effectiveProperties).map((p) => (p.id === id ? { ...p, ...patch } : p)),
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[setProperties],
	);

	const removeProperty = useCallback(
		(id) => {
			// Two separate root keys: properties array and plans.actions maps
			setProperties((prev) =>
				(prev || effectiveProperties).filter((p) => p.id !== id),
			);
			mutatePlans((prev) =>
				prev.map((pl) => {
					if (!pl.actions?.[id]) return pl;
					const actions = { ...pl.actions };
					delete actions[id];
					return { ...pl, actions };
				}),
			);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[setProperties, mutatePlans],
	);

	// ── Categories ──
	const addCategory = useCallback(
		(cat) => setCategories((prev) => [...(prev || effectiveCategories), cat]),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[setCategories],
	);

	const removeCategory = useCallback(
		(catId) => {
			// Two separate root keys: categories and expenses
			setCategories((prev) =>
				(prev || effectiveCategories).filter((c) => c.id !== catId),
			);
			setExpenses((prev) =>
				(prev || effectiveExpenses).filter((e) => e.cat !== catId),
			);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[setCategories, setExpenses],
	);

	const realRet = (1 + data.nomReturn) / (1 + data.inflation) - 1;

	// ── Active-plan economics ──
	const activeEcon = useMemo(() => {
		const e = planEconomics(activePlan, effectiveProperties);
		return { ...e, moveAge: data.age + e.transitionYears };
	}, [activePlan, effectiveProperties, data.age]);

	// ── Spending helpers ──
	const avgReturns = useMemo(() => buildReturns("avg", data.nomReturn), [data.nomReturn]);
	const bearReturns = useMemo(() => buildReturns("lost_decade", data.nomReturn), [data.nomReturn]);
	const spendAt = useCallback(
		(a, planId) =>
			monthlySpendAtAge(
				effectiveExpenses,
				a,
				planId || activePlan?.id,
				data.age,
				data.inflation,
				data.marketMode === "lost_decade" ? bearReturns : avgReturns,
				data.discretionaryCut,
				data.luxuryCut,
				data.cutMode,
			) * 12,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[effectiveExpenses, activePlan, data, avgReturns, bearReturns],
	);

	// Before a future relocation, spending reflects the baseline plan's expenses.
	const preMovePlanId = activeEcon.transitionYears > 0 && activeEcon.relocates ? baselinePlan.id : activePlan?.id;
	const spendNow = spendAt(data.age, preMovePlanId);
	const spend65 = spendAt(65, activePlan?.id);
	const spend70 = spendAt(70, activePlan?.id);
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
			expenses: effectiveExpenses,
		};
		const econ = planEconomics(activePlan, effectiveProperties);
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
			planId: activePlan?.id,
			baselinePlanId: baselinePlan.id,
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
	}, [data, effectiveProperties, effectiveExpenses, activePlan, baselinePlan]);

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

	// ready = migration has completed and v2 root keys are populated
	const ready = schemaVersion === 2 && Array.isArray(plans);

	const value = {
		ready,
		endAge: END_AGE,
		realDollars,
		setRealDollars,
		// Per-plan inputs (from active plan)
		...data,
		// Per-plan input setters
		...setters,
		realRet,
		// Shared pools
		categories: effectiveCategories,
		addCategory,
		removeCategory,
		expenses: effectiveExpenses,
		setExpenses,
		properties: effectiveProperties,
		addProperty,
		updateProperty,
		removeProperty,
		propSaleNet,
		propRentalNet,
		// Plans
		plans: effectivePlans,
		activePlanId: activePlan?.id,
		activePlan,
		baselinePlan,
		activeEcon,
		setActivePlanId,
		addPlan,
		updatePlan,
		removePlan,
		setPlanAction,
		// Spending
		spendAt,
		spendNow,
		spend65,
		spend70,
		dispSpend65,
		dispSpend70,
		// Projections
		projections,
		runsOut,
		altRunsOut,
		getD,
		effWR,
		fullChartData,
		fullReturnsTimeline,
	};

	return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
	const ctx = useContext(PlannerContext);
	if (!ctx) throw new Error("usePlanner must be used within PlannerProvider");
	return ctx;
}
