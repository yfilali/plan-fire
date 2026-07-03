import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePersistedState } from "../usePersistedState.jsx";
import { SectionTitle, Card, CardHeader } from "../components/ui.jsx";
import { btnBase, FS, RAD, FW } from "../lib/styles.js";
import ProfileSettings from "../components/settings/ProfileSettings.jsx";
import DataSettings from "../components/settings/DataSettings.jsx";
import AccountSettings from "../components/settings/AccountSettings.jsx";
import NotificationSettings from "../components/settings/NotificationSettings.jsx";
import PrivacySettings from "../components/settings/PrivacySettings.jsx";
import AppearanceSettings from "../components/settings/AppearanceSettings.jsx";

const TABS = [
	{ id: "Profile", icon: "🧑" },
	{ id: "Account", icon: "👤" },
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
				borderRadius: RAD.md,
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
							fontSize: FS.sm,
							fontWeight: on ? 650 : FW.medium,
							borderRadius: RAD.sm,
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
								<div style={{ fontSize: FS.base, fontWeight: FW.semibold, color: S.text }}>{f.label}</div>
								<div style={{ fontSize: FS.sm, color: S.textMuted, marginTop: 2 }}>{f.desc}</div>
							</div>
							<button
								onClick={() => toggle(f.id)}
								aria-pressed={on}
								style={{
									...btnBase,
									width: 46,
									height: 26,
									borderRadius: RAD.pill,
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
	const [tab, setTab] = usePersistedState("settingsTab", "Profile");
	// Normalize stale/removed tabs (e.g. the old "Assumptions") to Profile so the
	// chip highlight matches the rendered content.
	const activeTab = TABS.some((t) => t.id === tab) ? tab : "Profile";

	const content = (() => {
		switch (activeTab) {
			case "Account":
				return <AccountSettings />;
			case "Notifications":
				return <NotificationSettings />;
			case "Privacy & Data":
				return (
					<>
						<PrivacySettings />
						<DataSettings />
					</>
				);
			case "Appearance":
				return <AppearanceSettings />;
			case "Labs":
				return <LabsSettings />;
			case "Profile":
			default:
				return <ProfileSettings />;
		}
	})();

	return (
		<div className="fade-in" style={{ display: "grid", gap: 16 }}>
			<SectionTitle sub="Manage your profile, account, billing, and preferences.">
				Settings
			</SectionTitle>
			<TabRow tab={activeTab} setTab={setTab} />
			<div style={{ display: "grid", gap: 16 }}>{content}</div>
		</div>
	);
}
