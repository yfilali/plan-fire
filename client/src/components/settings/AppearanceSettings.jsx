import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { usePersistedState } from "../../usePersistedState.jsx";
import { Card, CardHeader, Select } from "../ui.jsx";
import { FS, RAD, FW } from "../../lib/styles.js";
import ThemeToggle from "../shell/ThemeToggle.jsx";

function Toggle({ S, on, onClick }) {
	return (
		<button
			onClick={onClick}
			aria-pressed={on}
			style={{ width: 46, height: 26, borderRadius: RAD.pill, background: on ? S.accent : S.border, position: "relative", border: "none", cursor: "pointer", transition: "background .15s ease", flexShrink: 0 }}
		>
			<span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.3)", transition: "left .15s ease" }} />
		</button>
	);
}

function SettingRow({ S, title, desc, children, last }) {
	return (
		<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", borderBottom: last ? "none" : `1px solid ${S.border}`, flexWrap: "wrap" }}>
			<div>
				<div style={{ fontSize: FS.base, fontWeight: FW.semibold, color: S.text }}>{title}</div>
				{desc && <div style={{ fontSize: FS.sm, color: S.textMuted, marginTop: 2 }}>{desc}</div>}
			</div>
			{children}
		</div>
	);
}

export default function AppearanceSettings() {
	const S = useTheme();
	const { realDollars, setRealDollars } = usePlanner();
	const [currency, setCurrency] = usePersistedState("currency", "USD");
	const [numberFormat, setNumberFormat] = usePersistedState("numberFormat", "compact");
	const [defaultView, setDefaultView] = usePersistedState("defaultView", "dashboard");

	return (
		<Card>
			<CardHeader icon="🎨" title="Appearance" subtitle="How Firly looks and formats numbers." />

			<SettingRow S={S} title="Theme" desc="Light, dark, or follow your system.">
				<ThemeToggle />
			</SettingRow>

			<SettingRow S={S} title="Show today's dollars" desc="Display projections in inflation-adjusted (real) dollars instead of nominal.">
				<Toggle S={S} on={!!realDollars} onClick={() => setRealDollars((v) => !v)} />
			</SettingRow>

			<SettingRow S={S} title="Currency" desc="Symbol used across the app.">
				<Select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: 150 }}>
					<option value="USD">$ USD</option>
					<option value="EUR">€ EUR</option>
					<option value="GBP">£ GBP</option>
					<option value="CAD">$ CAD</option>
					<option value="AUD">$ AUD</option>
				</Select>
			</SettingRow>

			<SettingRow S={S} title="Number format" desc="Compact ($1.2M) or full ($1,234,567).">
				<Select value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)} style={{ width: 150 }}>
					<option value="compact">Compact</option>
					<option value="full">Full</option>
				</Select>
			</SettingRow>

			<SettingRow S={S} title="Default landing tab" desc="Where Firly opens when you launch it." last>
				<Select value={defaultView} onChange={(e) => setDefaultView(e.target.value)} style={{ width: 150 }}>
					<option value="dashboard">Dashboard</option>
					<option value="copilot">Co-pilot</option>
					<option value="expenses">Expenses</option>
					<option value="assets">Assets</option>
					<option value="plan">Plans</option>
				</Select>
			</SettingRow>
		</Card>
	);
}
