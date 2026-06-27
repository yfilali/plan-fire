import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePersistedState } from "../usePersistedState.jsx";
import { SectionTitle, Card, CardHeader } from "../components/ui.jsx";
import { btnBase } from "../lib/styles.js";
import ProfileSettings from "../components/settings/ProfileSettings.jsx";
import MarketSettings from "../components/settings/MarketSettings.jsx";
import DataSettings from "../components/settings/DataSettings.jsx";
import AccountSettings from "../components/settings/AccountSettings.jsx";
import BillingSettings from "../components/settings/BillingSettings.jsx";
import NotificationSettings from "../components/settings/NotificationSettings.jsx";
import PrivacySettings from "../components/settings/PrivacySettings.jsx";
import AppearanceSettings from "../components/settings/AppearanceSettings.jsx";

const TABS = [
	{ id: "Assumptions", icon: "📊" },
	{ id: "Account", icon: "👤" },
	{ id: "Billing", icon: "💳" },
	{ id: "Notifications", icon: "🔔" },
	{ id: "Privacy & Data", icon: "🔒" },
	{ id: "Appearance", icon: "🎨" },
	{ id: "Labs", icon: "🧪" },
];

function TabRow({ tab, setTab }) {
	const S = useTheme();
	return (
		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				gap: 6,
				padding: 5,
				background: S.bg,
				border: `1px solid ${S.border}`,
				borderRadius: 12,
			}}
		>
			{TABS.map((t) => {
				const on = tab === t.id;
				return (
					<button
						key={t.id}
						onClick={() => setTab(t.id)}
						style={{
							...btnBase,
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
							padding: "7px 13px",
							fontSize: 12.5,
							fontWeight: on ? 650 : 500,
							borderRadius: 9,
							background: on ? S.card : "transparent",
							color: on ? S.text : S.textMuted,
							border: `1px solid ${on ? S.border : "transparent"}`,
							boxShadow: on ? S.shadowSm : "none",
						}}
					>
						<span>{t.icon}</span>
						{t.id}
					</button>
				);
			})}
		</div>
	);
}

// Inline beta-flags card. Flags are persisted client-side and read by features
// that opt in; harmless when unread.
function LabsSettings() {
	const S = useTheme();
	const [flags, setFlags] = usePersistedState("betaFlags", {});

	const FLAGS = [
		{ id: "aiAutoApply", label: "Auto-apply AI actions", desc: "Skip the confirm step when the co-pilot proposes a change." },
		{ id: "denseTables", label: "Dense tables", desc: "Tighter row spacing across lists." },
		{ id: "experimentalCharts", label: "Experimental charts", desc: "Preview upcoming visualizations early." },
	];

	const toggle = (id) =>
		setFlags((prev) => ({ ...(prev || {}), [id]: !(prev || {})[id] }));

	return (
		<Card>
			<CardHeader icon="🧪" title="Labs" subtitle="Opt into experimental features. These can change or disappear without notice." />
			<div style={{ display: "grid", gap: 4 }}>
				{FLAGS.map((f) => {
					const on = !!(flags || {})[f.id];
					return (
						<div
							key={f.id}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 16,
								padding: "12px 0",
								borderBottom: `1px solid ${S.border}`,
								flexWrap: "wrap",
							}}
						>
							<div>
								<div style={{ fontSize: 13.5, fontWeight: 600, color: S.text }}>{f.label}</div>
								<div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{f.desc}</div>
							</div>
							<button
								onClick={() => toggle(f.id)}
								aria-pressed={on}
								style={{
									...btnBase,
									width: 46,
									height: 26,
									borderRadius: 999,
									background: on ? S.accent : S.border,
									position: "relative",
									transition: "background .15s ease",
								}}
							>
								<span
									style={{
										position: "absolute",
										top: 3,
										left: on ? 23 : 3,
										width: 20,
										height: 20,
										borderRadius: "50%",
										background: "#fff",
										boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
										transition: "left .15s ease",
									}}
								/>
							</button>
						</div>
					);
				})}
			</div>
		</Card>
	);
}

export default function SettingsView() {
	const [tab, setTab] = usePersistedState("settingsTab", "Assumptions");

	const content = (() => {
		switch (tab) {
			case "Assumptions":
				return (
					<>
						<ProfileSettings />
						<MarketSettings />
					</>
				);
			case "Account":
				return <AccountSettings />;
			case "Billing":
				return <BillingSettings />;
			case "Notifications":
				return <NotificationSettings />;
			case "Privacy & Data":
				return (
					<>
						<DataSettings />
						<PrivacySettings />
					</>
				);
			case "Appearance":
				return <AppearanceSettings />;
			case "Labs":
				return <LabsSettings />;
			default:
				return null;
		}
	})();

	return (
		<div className="fade-in" style={{ display: "grid", gap: 16 }}>
			<SectionTitle sub="Manage your plan assumptions, account, billing, and preferences.">
				Settings
			</SectionTitle>
			<TabRow tab={tab} setTab={setTab} />
			<div style={{ display: "grid", gap: 16 }}>{content}</div>
		</div>
	);
}
