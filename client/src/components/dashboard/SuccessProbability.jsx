import { useMemo, useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { project, fmt } from "../../engine.js";
import { Card, CardHeader, Button } from "../ui.jsx";
import { usePro } from "../../lib/pro.js";
import { runMonteCarlo } from "../../lib/montecarlo.js";
import UpgradeModal from "../settings/UpgradeModal.jsx";

const TRIALS = 400;
const VOLATILITY = 0.15;

// Pro premium: run thousands of randomized return paths through the projection
// engine and report the share that never run dry, plus a terminal-wealth band.
export default function SuccessProbability() {
	const S = useTheme();
	const [isPro] = usePro();
	const [showUpgrade, setShowUpgrade] = useState(false);
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

	return (
		<Card>
			<CardHeader
				icon="🎲"
				title="Success probability"
				subtitle={`${TRIALS.toLocaleString()} randomized market paths · ${Math.round(VOLATILITY * 100)}% volatility`}
				right={
					isPro ? (
						<span style={{ fontSize: 11, fontWeight: 650, color: tone }}>{verdict}</span>
					) : (
						<span style={{ fontSize: 11, fontWeight: 650, color: S.blue }}>🔒 Pro</span>
					)
				}
			/>

			<div style={{ position: "relative" }}>
				<div
					style={{
						filter: isPro ? "none" : "blur(7px)",
						userSelect: isPro ? "auto" : "none",
						pointerEvents: isPro ? "auto" : "none",
						transition: "filter .2s ease",
					}}
				>
					<div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
						<span style={{ fontSize: 46, fontWeight: 800, color: tone, fontFamily: S.mono, lineHeight: 1 }}>
							{pct}%
						</span>
						<span style={{ fontSize: 13, color: S.textMuted }}>
							of paths your portfolio outlives you (to {endAge})
						</span>
					</div>

					{/* Probability bar */}
					<div style={{ height: 8, borderRadius: 6, background: S.bg, marginTop: 14, overflow: "hidden", border: `1px solid ${S.border}` }}>
						<div style={{ width: `${pct}%`, height: "100%", background: tone, transition: "width .3s ease" }} />
					</div>

					{/* Terminal-wealth band */}
					<div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
						{[
							{ k: "Pessimistic", v: mc.p10, c: S.danger, sub: "10th pct" },
							{ k: "Median", v: mc.p50, c: S.text, sub: "50th pct" },
							{ k: "Optimistic", v: mc.p90, c: S.accent, sub: "90th pct" },
						].map((b) => (
							<div key={b.k} style={{ padding: "10px 12px", background: S.bg, border: `1px solid ${S.border}`, borderRadius: 10 }}>
								<div style={{ fontSize: 10.5, color: S.textMuted, fontWeight: 600 }}>{b.k}</div>
								<div style={{ fontSize: 17, fontWeight: 750, color: b.c, fontFamily: S.mono, marginTop: 3 }}>{fmt(b.v)}</div>
								<div style={{ fontSize: 10, color: S.textDim }}>ending balance · {b.sub}</div>
							</div>
						))}
					</div>
				</div>

				{!isPro && (
					<div
						style={{
							position: "absolute",
							inset: 0,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: 10,
							textAlign: "center",
						}}
					>
						<div style={{ fontSize: 13, color: S.text, fontWeight: 600 }}>
							See your real odds of never running out
						</div>
						<Button variant="primary" size="md" onClick={() => setShowUpgrade(true)}>
							🔒 Unlock with Pro
						</Button>
					</div>
				)}
			</div>

			{showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
		</Card>
	);
}
