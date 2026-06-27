import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePersistedState } from "../../usePersistedState.jsx";
import { Card, CardHeader, Select } from "../ui.jsx";

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

export default function PrivacySettings() {
	const S = useTheme();
	const [aiUse, setAiUse] = usePersistedState("ai_data_use", true);
	const [region, setRegion] = usePersistedState("ai_region", "us");

	return (
		<Card>
			<CardHeader icon="🛡️" title="Privacy" subtitle="You control what leaves your device. Export, import, and reset live under Privacy & Data above." />

			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", borderBottom: `1px solid ${S.border}`, flexWrap: "wrap" }}>
				<div style={{ maxWidth: 460 }}>
					<div style={{ fontSize: 13.5, fontWeight: 600, color: S.text }}>AI data use</div>
					<div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>
						When on, the co-pilot sends a minimal numeric snapshot of your plan (ages, balances, rates) to generate answers. No name, email, or account data is sent, and your data is never used to train models. Turn this off to disable AI features.
					</div>
				</div>
				<Toggle S={S} on={!!aiUse} onClick={() => setAiUse((v) => !v)} />
			</div>

			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", borderBottom: `1px solid ${S.border}`, flexWrap: "wrap" }}>
				<div>
					<div style={{ fontSize: 13.5, fontWeight: 600, color: S.text }}>Processing region</div>
					<div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>Where AI requests are processed.</div>
				</div>
				<Select value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: 160 }}>
					<option value="us">United States</option>
					<option value="eu">European Union</option>
				</Select>
			</div>

			<div style={{ fontSize: 11.5, color: S.textDim, marginTop: 12, lineHeight: 1.5 }}>
				Firly stores your plans on your own server instance and mirrors them to this browser. We don't sell or share financial data.
			</div>
		</Card>
	);
}
