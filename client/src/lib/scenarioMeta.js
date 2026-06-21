// Housing-scenario presentation: colors + short/long labels. Keeps expense
// tagging, the plan picker, and chips visually consistent.
export const HOUSING_OPTIONS = [
	{ id: "stay", label: "Stay put", short: "Stay", desc: "Keep current home + mortgage", icon: "🏙️", tone: "danger" },
	{ id: "sell_move", label: "Sell + relocate", short: "Sell", desc: "Sell both properties, buy in new area", icon: "🌲", tone: "accent" },
	{ id: "rent_out", label: "Rent out + relocate", short: "Rent", desc: "Keep home as a rental, sell the other", icon: "🏠", tone: "blue" },
];

export function scenarioColor(S, id) {
	if (id === "all") return S.blue;
	if (id === "stay") return S.danger;
	if (id === "sell_move") return S.accent;
	if (id === "rent_out") return S.purple;
	return S.textMuted;
}

export const SCENARIO_TAGS = ["all", "stay", "sell_move", "rent_out"];
export const SCENARIO_SHORT = {
	all: "All",
	stay: "Stay",
	sell_move: "Sell",
	rent_out: "Rent",
};
