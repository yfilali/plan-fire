// Plan presentation helpers. Plans are user-defined and carry a `tone`
// (palette key); these resolve tone → real color against the active theme.

export const ACTION_META = {
	keep: { label: "Keep", icon: "•", tone: "textMuted" },
	sell: { label: "Sell", icon: "↑", tone: "accent" },
	rent: { label: "Rent", icon: "↻", tone: "blue" },
};

// Resolve a plan's tone to a hex color from the palette.
export function planColor(S, plan) {
	if (!plan) return S.textMuted;
	return S[plan.tone] || S.accent;
}

// Color for an expense plan tag id ("all" or a plan id).
export function tagColor(S, id, plans) {
	if (id === "all") return S.textMuted;
	const plan = plans?.find((p) => p.id === id);
	return plan ? S[plan.tone] || S.accent : S.textMuted;
}

// Short label for an expense plan tag.
export function tagLabel(id, plans) {
	if (id === "all") return "All";
	const plan = plans?.find((p) => p.id === id);
	return plan ? plan.name : id;
}
