// Maps an effective withdrawal rate to a health tone using the active palette.
// Single source of truth so the topbar, dashboard banner, and stat cards agree.
export function statusTone(S, wr) {
	if (wr <= 3.5)
		return { tier: "excellent", label: "Excellent", color: S.accent };
	if (wr <= 4.5) return { tier: "good", label: "Good", color: S.blue };
	if (wr <= 5.5) return { tier: "caution", label: "Caution", color: S.warning };
	return { tier: "risk", label: "At Risk", color: S.danger };
}

// Withdrawal-rate color for stat emphasis (slightly different thresholds,
// matching the original dashboard semantics).
export function wrColor(S, wr) {
	return wr <= 4 ? S.accent : wr <= 5 ? S.warning : S.danger;
}
