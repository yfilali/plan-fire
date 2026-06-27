import { useCallback } from "react";
import { usePlanner } from "../state/PlannerProvider.jsx";

// ─────────────────────────────────────────────────────────────────────────
//  useAiActions — applies AI-proposed Actions to the active plan.
//
//  Supported Action shapes (server may propose, client applies on confirm):
//    { type:'set_field', field, value, label }
//    { type:'create_plan', name, basePlanId?, patch?, label }
//  apply(action) returns a human label describing what changed (or null).
// ─────────────────────────────────────────────────────────────────────────

// Maps a set_field `field` to its planner setter name.
const FIELD_SETTERS = {
	retireAge: "setRetireAge",
	ssAge: "setSsAge",
	ssAnnual: "setSsAnnual",
	inflation: "setInflation",
	nomReturn: "setNomReturn",
	discretionaryCut: "setDiscretionaryCut",
	luxuryCut: "setLuxuryCut",
};

function describe(field, value) {
	switch (field) {
		case "retireAge":
			return `Set retirement age to ${value}`;
		case "ssAge":
			return `Set Social Security age to ${value}`;
		case "ssAnnual":
			return `Set Social Security to $${Math.round(value).toLocaleString()}/yr`;
		case "inflation":
			return `Set inflation to ${(value * 100).toFixed(1)}%`;
		case "nomReturn":
			return `Set expected return to ${(value * 100).toFixed(1)}%`;
		case "discretionaryCut":
			return `Set discretionary downturn cut to ${Math.round(value * 100)}%`;
		case "luxuryCut":
			return `Set luxury downturn cut to ${Math.round(value * 100)}%`;
		default:
			return `Updated ${field}`;
	}
}

export function useAiActions() {
	const planner = usePlanner();
	const { addPlan, updatePlan, setActivePlanId } = planner;

	const apply = useCallback(
		(action) => {
			if (!action || typeof action !== "object") return null;

			if (action.type === "set_field") {
				const setterName = FIELD_SETTERS[action.field];
				const setter = setterName && planner[setterName];
				if (typeof setter !== "function" || typeof action.value !== "number") {
					return null;
				}
				setter(action.value);
				return action.label || describe(action.field, action.value);
			}

			if (action.type === "create_plan") {
				const name = action.name || "AI plan";
				const id = addPlan(name, action.basePlanId ? { duplicateFrom: action.basePlanId } : {});
				if (action.patch && typeof action.patch === "object") {
					updatePlan(id, action.patch);
				}
				setActivePlanId(id);
				return action.label || `Created plan "${name}"`;
			}

			return null;
		},
		[planner, addPlan, updatePlan, setActivePlanId],
	);

	return { apply };
}
