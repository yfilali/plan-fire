import { useMemo } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { fmt } from "../../engine.js";
import { Card, CardHeader } from "../ui.jsx";
import Icon from "../Icon.jsx";
import InfoTip from "../InfoTip.jsx";
import { FS, RAD, FW } from "../../lib/styles.js";
import { computeMilestones } from "../../lib/milestones.js";

// One milestones card with two clearly-labeled groups:
//   • Plan crossings — derived from the live projection (FI, Coast-FIRE, net
//     worth marks, depletion) on a 4% safe-withdrawal target.
//   • Fixed ages — calendar-driven dates (penalty-free 401k, Medicare, SS…).
// Merging both here removes the old "Milestones" vs "Key milestones" confusion.
export default function MilestonesCard() {
	const S = useTheme();
	const {
		age,
		endAge,
		retireAge,
		ssAge,
		ssAnnual,
		realRet,
		spendNow,
		projections,
		activeEcon,
	} = usePlanner();

	const crossings = useMemo(() => {
		const rows = projections?.primary || [];
		const fiNumber = (spendNow || 0) * 25; // 4% rule target
		return computeMilestones(rows, { age, retireAge, fiNumber, realRet });
	}, [projections, age, retireAge, realRet, spendNow]);

	// Calendar-driven dates. Each carries a colorblind-safe Icon glyph.
	const fixed = [
		...(activeEcon.relocates ? [{ a: activeEcon.moveAge, l: "Relocate", icon: "relocate" }] : []),
		...(retireAge > age ? [{ a: retireAge, l: "Retire", icon: "retire" }] : []),
		{ a: 59, l: "401k penalty-free", icon: "briefcase" },
		{ a: 62, l: "Early SS eligible", icon: "social-security" },
		{ a: 65, l: "Medicare", icon: "medical", hl: true },
		{ a: ssAge, l: `SS starts (${fmt(ssAnnual)}/yr)`, icon: "social-security", hl: true },
	].filter((m) => m.a >= age && m.a <= endAge);

	return (
		<Card>
			<CardHeader
				icon={<Icon name="flag" size={16} color={S.accent} />}
				title="Milestones"
				subtitle="The dates that shape the plan — market-driven crossings and the calendar ahead."
			/>

			{/* ── Plan crossings ── */}
			<GroupLabel>
				Plan crossings
				<InfoTip term="4% rule" />
			</GroupLabel>
			<div style={{ display: "grid", gap: 4 }}>
				{crossings.map((m) => {
					const isNever = m.age == null;
					const isDepletion = m.key === "depletion";
					const reached = m.reached;
					const color = isDepletion
						? isNever
							? S.accent
							: S.danger
						: isNever
							? S.textDim
							: reached
								? S.accent
								: S.text;
					const yearsAway = m.age != null ? m.age - age : null;
					return (
						<div
							key={m.key}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 12,
								padding: "11px 0",
								borderBottom: `1px solid ${S.border}`,
							}}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 11 }}>
								<span
									style={{
										width: 9,
										height: 9,
										borderRadius: "50%",
										background: isNever && !isDepletion ? S.border : color,
										boxShadow: !isNever || isDepletion ? `0 0 7px ${color}66` : "none",
										flexShrink: 0,
									}}
								/>
								<span style={{ fontSize: FS.base, fontWeight: FW.semibold, color: isNever && !isDepletion ? S.textMuted : S.text }}>
									{m.label}
								</span>
							</div>
							<div style={{ textAlign: "right" }}>
								{isNever ? (
									<span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: FS.base, fontWeight: FW.bold, color: isDepletion ? S.accent : S.textDim }}>
										{isDepletion ? <Icon name="check" size={13} color={S.accent} /> : null}
										{isDepletion ? "safe" : "—"}
									</span>
								) : (
									<>
										<span style={{ fontSize: FS.md, fontWeight: FW.bold, color, fontFamily: S.mono }}>
											age {m.age}
										</span>
										<span style={{ fontSize: FS.xs, color: S.textMuted, marginLeft: 7 }}>
											{yearsAway <= 0 ? "now" : `in ${yearsAway}y`}
										</span>
									</>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* ── Fixed ages ── */}
			<GroupLabel style={{ marginTop: 18 }}>Fixed ages</GroupLabel>
			<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
				{fixed.map((m, i) => (
					<div
						key={i}
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 7,
							padding: "5px 11px",
							borderRadius: RAD.pill,
							border: `1px solid ${m.hl ? S.accent + "66" : S.border}`,
							background: m.hl ? S.accent + "10" : S.bg,
							fontSize: FS.sm,
						}}
					>
						<Icon name={m.icon} size={14} color={m.hl ? S.accent : S.textMuted} />
						<span style={{ fontWeight: m.hl ? FW.semibold : FW.medium, color: m.hl ? S.accent : S.text }}>
							{m.l}
						</span>
						<span style={{ fontFamily: S.mono, color: S.textMuted }}>@{m.a}</span>
					</div>
				))}
			</div>
		</Card>
	);
}

// Small uppercase group eyebrow.
function GroupLabel({ children, style }) {
	const S = useTheme();
	return (
		<div
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 6,
				fontSize: FS.xs,
				letterSpacing: 1,
				textTransform: "uppercase",
				color: S.textDim,
				fontWeight: FW.bold,
				marginBottom: 8,
				...style,
			}}
		>
			{children}
		</div>
	);
}
