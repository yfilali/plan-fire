import { useMemo } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { project, fmt, deflate } from "../../engine.js";
import { Card, CardHeader } from "../ui.jsx";
import Icon from "../Icon.jsx";
import InfoTip from "../InfoTip.jsx";
import { FS, RAD, FW } from "../../lib/styles.js";
import { runMonteCarlo } from "../../lib/montecarlo.js";

const TRIALS = 400;
const VOLATILITY = 0.15;

// Run thousands of randomized return paths through the projection engine and
// report the share that never run dry, plus a terminal-wealth band.
export default function SuccessProbability() {
	const S = useTheme();
	const {
		age,
		endAge,
		retireAge,
		portfolio,
		expenses,
		inflation,
		nomReturn,
		ssAge,
		ssAnnual,
		activePlan,
		discretionaryCut,
		luxuryCut,
		cutMode,
		realDollars,
	} = usePlanner();

	const mc = useMemo(() => {
		const years = endAge - age + 1;
		const baseArgs = {
			startAge: age,
			endAge,
			retireAge,
			portfolio,
			expenses,
			planId: activePlan?.id,
			inflation,
			ssAge,
			ssAnnual,
			discretionaryCut,
			luxuryCut,
			cutMode,
			baselinePlanId: activePlan?.id,
		};
		const simulate = (returns) => {
			const rowsOut = project({ ...baseArgs, nomReturn: returns });
			let depletionAge = null;
			for (const r of rowsOut) {
				if (r.age >= retireAge && r.balance <= 0) {
					depletionAge = r.age;
					break;
				}
			}
			const terminal = rowsOut.length ? rowsOut[rowsOut.length - 1].balance : 0;
			return { survived: depletionAge == null && terminal > 0, terminal: Math.max(0, terminal), depletionAge };
		};
		return runMonteCarlo({ trials: TRIALS, years, mean: nomReturn, vol: VOLATILITY, seed: 0x1234abcd, simulate });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [age, endAge, retireAge, portfolio, expenses, inflation, nomReturn, ssAge, ssAnnual, activePlan, discretionaryCut, luxuryCut, cutMode]);

	const pct = Math.round(mc.successRate * 100);
	const tone = pct >= 85 ? S.accent : pct >= 70 ? S.warning : S.danger;
	const verdict = pct >= 85 ? "On track" : pct >= 70 ? "Borderline" : "At risk";

	// Terminal wealth lands at the end of the horizon in NOMINAL dollars. Lead
	// with today's-dollars (governed by the same toggle as the projection) so the
	// figures are comprehensible — a raw $200M+ nominal median means little.
	const yearsOut = endAge - age;
	const adj = (v) => (realDollars ? deflate(v, yearsOut, inflation) : v);
	const dollarsLabel = realDollars ? "today's $" : "nominal";

	return (
		<Card>
			<CardHeader
				icon="🎲"
				title="Success probability"
				subtitle={`${TRIALS.toLocaleString()} randomized market paths · ${Math.round(VOLATILITY * 100)}% volatility`}
				right={
					<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
						<Icon
							name={pct >= 85 ? "check" : pct >= 70 ? "alert" : "warning"}
							size={14}
							color={tone}
						/>
						<span style={{ fontSize: FS.xs, fontWeight: FW.semibold, color: tone }}>{verdict}</span>
					</span>
				}
			/>

			<div>
				<div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
					<span style={{ fontSize: 46, fontWeight: 800, color: tone, fontFamily: S.mono, lineHeight: 1 }}>
						{pct}%
					</span>
					<span style={{ fontSize: FS.base, color: S.textMuted }}>
						of paths your portfolio outlives you (to {endAge})
					</span>
				</div>

				{/* Probability bar */}
				<div style={{ height: 8, borderRadius: RAD.sm, background: S.bg, marginTop: 14, overflow: "hidden", border: `1px solid ${S.border}` }}>
					<div style={{ width: `${pct}%`, height: "100%", background: tone, transition: "width .3s ease" }} />
				</div>

				{/* Terminal-wealth band */}
				<div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, marginBottom: 10 }}>
					<span style={{ fontSize: FS.xs, letterSpacing: 1, textTransform: "uppercase", color: S.textDim, fontWeight: FW.bold }}>
						Ending balance · {dollarsLabel}
					</span>
					<InfoTip term="real vs nominal dollars" />
				</div>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
					{[
						{ k: "Pessimistic", v: adj(mc.p10), c: S.danger, sub: "10th pct" },
						{ k: "Median", v: adj(mc.p50), c: S.text, sub: "50th pct" },
						{ k: "Optimistic", v: adj(mc.p90), c: S.accent, sub: "90th pct" },
					].map((b) => (
						<div key={b.k} style={{ padding: "10px 12px", background: S.bg, border: `1px solid ${S.border}`, borderRadius: RAD.sm }}>
							<div style={{ fontSize: FS.xs, color: S.textMuted, fontWeight: FW.semibold }}>{b.k}</div>
							<div style={{ fontSize: FS.lg, fontWeight: FW.bold, color: b.c, fontFamily: S.mono, marginTop: 3 }}>{fmt(b.v)}</div>
							<div style={{ fontSize: FS.xs, color: S.textDim }}>{b.sub}</div>
						</div>
					))}
				</div>
			</div>
		</Card>
	);
}
