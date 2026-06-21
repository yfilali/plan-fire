import { useRef } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import {
	exportData,
	importData,
	clearAllData,
} from "../../usePersistedState.jsx";
import { Card, CardHeader, Button } from "../ui.jsx";
import ThemeToggle from "../shell/ThemeToggle.jsx";

export default function DataSettings() {
	const S = useTheme();
	const fileRef = useRef(null);

	const handleImport = (e) => {
		const f = e.target.files?.[0];
		if (!f) return;
		const r = new FileReader();
		r.onload = async (ev) => {
			try {
				await importData(JSON.parse(ev.target.result));
			} catch {
				alert("That file isn't valid plan data.");
			}
		};
		r.readAsText(f);
	};

	const handleReset = async () => {
		if (!confirm("Reset ALL data and scenarios to defaults? This cannot be undone.")) return;
		await clearAllData();
		window.location.reload();
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
				<div style={{ fontSize: 13.5, fontWeight: 600, color: S.text }}>{title}</div>
				<div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{desc}</div>
			</div>
			{action}
		</div>
	);

	return (
		<Card>
			<CardHeader icon="⚙️" title="Appearance & data" subtitle="Theme preference and backup tools. Data is saved to your server and mirrored locally." />

			{row("Theme", "Light, dark, or follow your system.", <ThemeToggle />)}
			{row("Export backup", "Download every scenario as a JSON file.", <Button onClick={exportData}>⤓ Export</Button>)}
			{row("Import backup", "Replace current data from a JSON file.", <Button onClick={() => fileRef.current?.click()}>⤒ Import</Button>)}
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", flexWrap: "wrap" }}>
				<div>
					<div style={{ fontSize: 13.5, fontWeight: 600, color: S.danger }}>Reset everything</div>
					<div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>Wipe all scenarios and restore defaults.</div>
				</div>
				<Button variant="danger" onClick={handleReset}>Reset all data</Button>
			</div>

			<input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
		</Card>
	);
}
