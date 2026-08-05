import { useRef, useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import {
	exportData,
	importData,
	clearAllData,
} from "../../usePersistedState.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { Card, CardHeader, Button, ConfirmDialog } from "../ui.jsx";
import { FS, FW } from "../../lib/styles.js";

// "3 plan" / "3 plans" — used to spell out exactly what Reset all data wipes.
const count = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function DataSettings() {
	const S = useTheme();
	const fileRef = useRef(null);
	const { restartOnboarding, plans, expenses, incomes, assets } = usePlanner();
	const { guest } = useAuth();
	const [confirmingReset, setConfirmingReset] = useState(false);
	const [confirmingRestart, setConfirmingRestart] = useState(false);

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
		await clearAllData(guest);
		window.location.reload();
	};

	const resetSummary = [
		count(plans.length, "plan"),
		count(expenses.length, "expense"),
		count(incomes.length, "income source"),
		count(assets.length, "asset"),
	].join(", ");

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

			{row("Guided setup", "Re-run the step-by-step walkthrough for age, savings, and Social Security. Clears current plans, expenses, and assets first.", <Button onClick={() => setConfirmingRestart(true)}>↺ Restart</Button>)}
			{row("Export backup", "Download every plan as a JSON file.", <Button onClick={() => exportData(guest)}>⤓ Export</Button>)}
			{row("Import backup", "Replace current data from a JSON file.", <Button onClick={() => fileRef.current?.click()}>⤒ Import</Button>)}
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", flexWrap: "wrap" }}>
				<div>
					<div style={{ fontSize: FS.base, fontWeight: FW.semibold, color: S.danger }}>Reset everything</div>
					<div style={{ fontSize: FS.sm, color: S.textMuted, marginTop: 2 }}>Wipe all plans and restore defaults.</div>
				</div>
				<Button variant="danger" onClick={() => setConfirmingReset(true)}>Reset all data</Button>
			</div>

			<input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />

			{confirmingReset && (
				<ConfirmDialog
					title="Reset all data?"
					message={`Deletes ${resetSummary} and restores defaults. This cannot be undone.`}
					confirmLabel="Reset everything"
					onConfirm={() => {
						setConfirmingReset(false);
						handleReset();
					}}
					onCancel={() => setConfirmingReset(false)}
				>
					<div style={{ marginTop: 14, padding: 12, background: S.bg, border: `1px solid ${S.border}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
						<span style={{ fontSize: 12, color: S.textMuted }}>Export a backup first?</span>
						<Button size="sm" onClick={() => exportData(guest)}>⤓ Export</Button>
					</div>
				</ConfirmDialog>
			)}

			{confirmingRestart && (
				<ConfirmDialog
					title="Restart guided setup?"
					message="This clears your current plans, expenses, and assets so the wizard starts from a blank slate."
					confirmLabel="Restart"
					onConfirm={() => {
						setConfirmingRestart(false);
						restartOnboarding();
					}}
					onCancel={() => setConfirmingRestart(false)}
				/>
			)}
		</Card>
	);
}
