import { useRef } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import {
	exportData,
	importData,
	clearAllData,
} from "../../usePersistedState.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { Card, CardHeader, Button } from "../ui.jsx";
import { FS, FW } from "../../lib/styles.js";

export default function DataSettings() {
	const S = useTheme();
	const fileRef = useRef(null);
	const { restartOnboarding } = usePlanner();
	const { guest } = useAuth();

	const handleImport = (e) => {
		const f = e.target.files?.[0];
		if (!f) return;
		const r = new FileReader();
		r.onload = async (ev) => {
			try {
				await importData(JSON.parse(ev.target.result), guest);
			} catch {
				alert("That file isn't valid plan data.");
			}
		};
		r.readAsText(f);
	};

	const handleReset = async () => {
		if (!confirm("Reset ALL data and plans to defaults? This cannot be undone.")) return;
		await clearAllData(guest);
		window.location.reload();
	};

	const handleRestartOnboarding = () => {
		if (
			!confirm(
				"Restart guided setup? This clears your current plans, expenses, and assets so the wizard starts from a blank slate.",
			)
		)
			return;
		restartOnboarding();
	};

	const row = (title, desc, action) => (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: 16,
				padding: "13px 0",
				borderBottom: `1px solid ${S.border}`,
				flexWrap: "wrap",
			}}
		>
			<div>
				<div style={{ fontSize: FS.base, fontWeight: FW.semibold, color: S.text }}>{title}</div>
				<div style={{ fontSize: FS.sm, color: S.textMuted, marginTop: 2 }}>{desc}</div>
			</div>
			{action}
		</div>
	);

	return (
		<Card>
			<CardHeader
				icon="⚙️"
				title="Data"
				subtitle={
					guest
						? "Back up, restore, or reset your plans. As a guest, everything is saved only on this device."
						: "Back up, restore, or reset your plans. Data is saved to your server and mirrored locally."
				}
			/>

			{row("Guided setup", "Re-run the step-by-step walkthrough for age, savings, and Social Security. Clears current plans, expenses, and assets first.", <Button onClick={handleRestartOnboarding}>↺ Restart</Button>)}
			{row("Export backup", "Download every plan as a JSON file.", <Button onClick={() => exportData(guest)}>⤓ Export</Button>)}
			{row("Import backup", "Replace current data from a JSON file.", <Button onClick={() => fileRef.current?.click()}>⤒ Import</Button>)}
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", flexWrap: "wrap" }}>
				<div>
					<div style={{ fontSize: FS.base, fontWeight: FW.semibold, color: S.danger }}>Reset everything</div>
					<div style={{ fontSize: FS.sm, color: S.textMuted, marginTop: 2 }}>Wipe all plans and restore defaults.</div>
				</div>
				<Button variant="danger" onClick={handleReset}>Reset all data</Button>
			</div>

			<input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
		</Card>
	);
}
