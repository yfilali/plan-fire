// Canonical "plan health" model — the single source of truth for whether a
// plan is healthy. The dashboard headline, the topbar, the sidebar, and the
// Monte Carlo card all derive their verdict (and color) from here so they can
// never disagree or contradict each other again.
//
// Three raw signals feed the verdict:
//   • runsOut   — deterministic depletion. Truthy (a projection row) means the
//                 portfolio hits zero in retirement; null/undefined means the
//                 money lasts to the end of the horizon.
//   • effWR     — the effective withdrawal rate, already expressed as a percent.
//   • mcSuccess — Monte Carlo success probability as a fraction (0–1), i.e.
//                 the share of randomized market paths that never run dry.
//                 May be omitted (undefined/null) when the simulation hasn't
//                 run (e.g. non-Pro); in that case it simply doesn't vote.

// Monte Carlo thresholds, matching the SuccessProbability card's bands:
// ≥85% reads as "On track", ≥70% as "Borderline", below that as "At risk".
const MC_GOOD = 0.85;
const MC_LOW = 0.7;

const STATUS_LABELS = { healthy: "Healthy", caution: "Caution", atRisk: "At risk" };

// computePlanHealth — fold the three signals into one verdict.
//
// Precedence (most severe wins):
//   1. Deterministic depletion (runsOut truthy)        → atRisk
//   2. Very low Monte Carlo success (< MC_LOW)         → atRisk
//   3. Money lasts but MC is only borderline (< MC_GOOD) → caution
//   4. Money lasts, MC healthy, but WR above target    → caution (WR reason)
//   5. Everything clears                               → healthy
//
// Returns { status, label, reasons, wr } where status is one of
// 'healthy' | 'caution' | 'atRisk', label is the human word, reasons is a
// short string[] of plain-English explanations, and wr echoes the rate used.
export function computePlanHealth({ runsOut, effWR, mcSuccess, wrTarget = 4 }) {
	const wr = Number.isFinite(effWR) ? effWR : 0;
	// Normalize MC: accept a 0–1 fraction; tolerate a 0–100 percent if a caller
	// passes one. Treat anything non-numeric as "no MC signal".
	const mc =
		mcSuccess == null || !Number.isFinite(mcSuccess)
			? null
			: mcSuccess > 1
				? mcSuccess / 100
				: mcSuccess;

	const reasons = [];
	let status = "healthy";

	if (runsOut) {
		status = "atRisk";
		const age = runsOut.age;
		reasons.push(
			age != null
				? `Portfolio is projected to run out at age ${age}`
				: "Portfolio is projected to run out before the end of the plan",
		);
	} else if (mc != null && mc < MC_LOW) {
		status = "atRisk";
		reasons.push(`Only ${Math.round(mc * 100)}% of market paths survive — below the 70% comfort line`);
	} else if (mc != null && mc < MC_GOOD) {
		status = "caution";
		reasons.push(`${Math.round(mc * 100)}% of market paths survive — a borderline margin`);
	} else if (wr > wrTarget) {
		status = "caution";
		reasons.push(`Withdrawal rate ${wr.toFixed(1)}% is above the ${wrTarget}% guideline`);
	}

	// Add supporting context so the verdict reads fully even when a higher-
	// precedence reason already set the status.
	if (status === "atRisk" && wr > wrTarget && !runsOut) {
		// already covered by the WR-independent MC reason; surface WR too.
		reasons.push(`Withdrawal rate ${wr.toFixed(1)}% is above the ${wrTarget}% guideline`);
	}
	if (status === "healthy") {
		reasons.push(
			wr > 0
				? `Money lasts and the ${wr.toFixed(1)}% withdrawal rate is within the ${wrTarget}% guideline`
				: "Money lasts the full plan horizon",
		);
	}

	return { status, label: STATUS_LABELS[status], reasons, wr };
}

// healthVisual — map a status to its palette color plus a colorblind-safe,
// non-color cue: a short icon NAME string and the human label. Callers render
// the icon and never rely on color alone.
//   healthy → S.accent  + 'check'
//   caution → S.warning + 'alert'
//   atRisk  → S.danger  + 'warning'
export function healthVisual(status, S) {
	switch (status) {
		case "atRisk":
			return { color: S.danger, icon: "warning", label: STATUS_LABELS.atRisk };
		case "caution":
			return { color: S.warning, icon: "alert", label: STATUS_LABELS.caution };
		case "healthy":
		default:
			return { color: S.accent, icon: "check", label: STATUS_LABELS.healthy };
	}
}
