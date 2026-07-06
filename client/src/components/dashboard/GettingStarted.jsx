import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { usePersistedState } from "../../usePersistedState.jsx";
import { Card } from "../ui.jsx";
import Icon from "../Icon.jsx";
import { FS, RAD, FW } from "../../lib/styles.js";

// One checklist row: a full-width button that deep-links to the view where
// the item gets done. Completed rows swap the trailing call-to-action for a
// checkmark but stay clickable (users may want to add more).
function StepRow({ icon, title, desc, done, onClick }) {
	const S = useTheme();
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				textAlign: "left",
				display: "flex",
				alignItems: "center",
				gap: 14,
				padding: "14px 16px",
				borderRadius: RAD.md,
				border: `1.5px solid ${done ? S.accent + "55" : S.border}`,
				background: done ? S.accentSoft : "transparent",
				cursor: "pointer",
				width: "100%",
				fontFamily: S.font,
			}}
		>
			<div
				style={{
					width: 36,
					height: 36,
					borderRadius: RAD.sm + 2,
					flexShrink: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: done ? S.accent : S.accentSoft,
					color: done ? "#fff" : S.accent,
				}}
			>
				<Icon name={icon} size={17} />
			</div>
			<div style={{ minWidth: 0, flex: 1 }}>
				<div style={{ fontSize: FS.md, fontWeight: FW.semibold, color: S.text }}>{title}</div>
				<div style={{ fontSize: FS.sm, color: S.textMuted, marginTop: 2, lineHeight: 1.45 }}>{desc}</div>
			</div>
			{done ? (
				<span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: S.accent, fontSize: FS.sm, fontWeight: FW.semibold, flexShrink: 0 }}>
					<Icon name="check" size={15} color={S.accent} />
					Done
				</span>
			) : (
				<span style={{ color: S.accent, fontSize: FS.sm, fontWeight: FW.semibold, flexShrink: 0 }}>
					Add →
				</span>
			)}
		</button>
	);
}

// Getting-started checklist — shown by DashboardView in place of the stat
// cards / charts while the plan is empty (planIsEmpty: no liquid savings, no
// expenses — e.g. right after "Skip setup" in onboarding). Each row jumps to
// the view where that number lives; the whole card dissolves the moment
// savings or an expense exist, because planIsEmpty flips and the dashboard
// renders its normal results again.
export default function GettingStarted() {
	const S = useTheme();
	const { portfolio, expenses, ssAnnual } = usePlanner();
	// Same shared key AppShell reads — writing it navigates the whole app.
	const [, setView] = usePersistedState("view", "dashboard");

	const steps = [
		{
			icon: "briefcase",
			title: "Add your savings",
			desc: "401(k), IRA, brokerage, cash — the portfolio your retirement draws from.",
			done: portfolio > 0,
			view: "assets",
		},
		{
			icon: "flag",
			title: "Add your expenses",
			desc: "Monthly spending is what decides how long the money lasts.",
			done: expenses.length > 0,
			view: "expenses",
		},
		{
			icon: "retire",
			title: "Set retirement details",
			desc: "Retirement age and your estimated Social Security benefit.",
			done: ssAnnual > 0,
			view: "plan",
		},
	];

	return (
		<Card pad={24}>
			<div style={{ maxWidth: 560, margin: "0 auto", padding: "12px 0" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
					<div
						style={{
							width: 46,
							height: 46,
							borderRadius: RAD.md,
							flexShrink: 0,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							background: S.accentGradient,
							color: "#fff",
						}}
					>
						<Icon name="sparkle" size={22} />
					</div>
					<div>
						<h2 style={{ fontSize: FS.xl, fontWeight: FW.bold, color: S.text, marginBottom: 4 }}>
							Let's build your plan
						</h2>
						<p style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.55 }}>
							Your plan doesn't have any numbers yet, so there's nothing to project.
							Add these and the dashboard comes to life — each takes about a minute.
						</p>
					</div>
				</div>
				<div style={{ display: "grid", gap: 10 }}>
					{steps.map((s) => (
						<StepRow
							key={s.view}
							icon={s.icon}
							title={s.title}
							desc={s.desc}
							done={s.done}
							onClick={() => setView(s.view)}
						/>
					))}
				</div>
			</div>
		</Card>
	);
}
