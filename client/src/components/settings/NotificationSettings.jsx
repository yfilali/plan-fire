import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePersistedState } from "../../usePersistedState.jsx";
import { Card, CardHeader } from "../ui.jsx";

function Toggle({ S, on, onClick }) {
	return (
		<button
			onClick={onClick}
			aria-pressed={on}
			style={{ width: 46, height: 26, borderRadius: 999, background: on ? S.accent : S.border, position: "relative", border: "none", cursor: "pointer", transition: "background .15s ease", flexShrink: 0 }}
		>
			<span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.3)", transition: "left .15s ease" }} />
		</button>
	);
}

const ROWS = [
	{ key: "notif_monthly", title: "Monthly check-in", desc: "A short email recap of your plan health each month.", def: true },
	{ key: "notif_milestones", title: "Milestone alerts", desc: "Get notified when you cross $1M, hit Coast-FIRE, etc.", def: true },
	{ key: "notif_market", title: "Market-stress nudges", desc: "A heads-up when a downturn meaningfully shifts your runway.", def: false },
	{ key: "notif_digest", title: "Weekly digest", desc: "A weekly summary of changes and projections.", def: false },
];

function NotifRow({ row }) {
	const S = useTheme();
	const [on, setOn] = usePersistedState(row.key, row.def);
	return (
		<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", borderBottom: `1px solid ${S.border}`, flexWrap: "wrap" }}>
			<div>
				<div style={{ fontSize: 13.5, fontWeight: 600, color: S.text }}>{row.title}</div>
				<div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{row.desc}</div>
			</div>
			<Toggle S={S} on={!!on} onClick={() => setOn((v) => !v)} />
		</div>
	);
}

export default function NotificationSettings() {
	const S = useTheme();
	return (
		<Card>
			<CardHeader icon="🔔" title="Notifications" subtitle="Delivered to your account email. You can turn any of these off anytime." />
			{ROWS.map((r) => <NotifRow key={r.key} row={r} />)}
			<div style={{ fontSize: 11.5, color: S.textDim, marginTop: 12 }}>
				Emails go to the address on your account. Sign in to manage delivery.
			</div>
		</Card>
	);
}
