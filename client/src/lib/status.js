// NOTE: The canonical plan-health verdict (and its color) now lives in
// ./planHealth.js — computePlanHealth() folds deterministic depletion, Monte
// Carlo success, and the withdrawal rate into one status, and healthVisual()
// maps that status to a palette color + colorblind-safe icon. Prefer those for
// the headline verdict so the topbar, banner, sidebar, and MC card all agree.
//
// statusTone below remains a thin withdrawal-rate-only emphasis helper, kept
// for callers that just need a quick WR tier color/label.

// Maps an effective withdrawal rate to a WR-tier tone using the active palette.
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
