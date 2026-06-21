import { useTheme } from "../../theme/ThemeProvider.jsx";
import { btnBase } from "../../lib/styles.js";
import { Tag, Select, TextInput } from "../ui.jsx";
import { scenarioColor, SCENARIO_TAGS, SCENARIO_SHORT } from "../../lib/scenarioMeta.js";

const TIER_META = {
	essential: { label: "Essential", tone: "accent", icon: "🛡️" },
	discretionary: { label: "Discretionary", tone: "warning", icon: "⚠️" },
	luxury: { label: "Luxury", tone: "danger", icon: "💎" },
};

export default function ExpenseRow({ exp, categories, active, editing, onEdit, onDone, onUpdate, onRemove }) {
	const S = useTheme();
	const tier = TIER_META[exp.tier || "essential"];

	const toggleScenario = (s) => {
		const curr = exp.scenarios || ["all"];
		if (s === "all") return onUpdate(exp.id, "scenarios", ["all"]);
		const hasAll = curr.includes("all");
		const hasS = curr.includes(s);
		let next;
		if (hasS) {
			next = curr.filter((x) => x !== s);
			if (next.length === 0 && !hasAll) next = ["all"];
		} else {
			next = hasAll ? [s] : [...curr.filter((x) => x !== "all"), s];
		}
		onUpdate(exp.id, "scenarios", next);
	};

	const rowStyle = {
		display: "flex",
		alignItems: "center",
		gap: 8,
		padding: "7px 12px",
		background: S.card,
		borderRadius: 10,
		border: `1px solid ${S.border}`,
		marginBottom: 4,
		opacity: active ? 1 : 0.42,
		flexWrap: "wrap",
	};

	if (editing) {
		return (
			<div style={rowStyle}>
				<Select value={exp.cat} onChange={(e) => onUpdate(exp.id, "cat", e.target.value)} style={{ width: 130, padding: "4px 7px", fontSize: 12 }}>
					{categories.map((c) => (
						<option key={c.id} value={c.id}>{c.icon} {c.label}</option>
					))}
				</Select>
				<TextInput value={exp.name} onChange={(e) => onUpdate(exp.id, "name", e.target.value)} style={{ flex: 1, minWidth: 120, padding: "4px 9px", fontSize: 12 }} />
				<TextInput
					type="number"
					value={exp.amount}
					onChange={(e) => onUpdate(exp.id, "amount", e.target.value)}
					style={{ width: 78, padding: "4px 9px", fontFamily: S.mono, fontSize: 12, textAlign: "right" }}
				/>
				<Select value={exp.tier || "essential"} onChange={(e) => onUpdate(exp.id, "tier", e.target.value)} style={{ width: 64, padding: "4px 6px", fontSize: 12 }}>
					<option value="essential">🛡️</option>
					<option value="discretionary">⚠️</option>
					<option value="luxury">💎</option>
				</Select>
				<TextInput
					placeholder="CPI"
					title="Inflation override (%)"
					type="number"
					step="0.5"
					value={exp.inflOverride != null ? +(exp.inflOverride * 100).toFixed(2) : ""}
					onChange={(e) => onUpdate(exp.id, "inflOverride", e.target.value === "" ? undefined : Number(e.target.value) / 100)}
					style={{ width: 56, padding: "4px 6px", fontFamily: S.mono, fontSize: 11 }}
				/>
				<div style={{ display: "flex", gap: 3 }}>
					{SCENARIO_TAGS.map((s) => {
						const on = (exp.scenarios || ["all"]).includes(s);
						const c = scenarioColor(S, s);
						return (
							<button
								key={s}
								type="button"
								onClick={() => toggleScenario(s)}
								style={{
									...btnBase,
									padding: "2px 7px",
									borderRadius: 10,
									fontSize: 9.5,
									fontWeight: 600,
									border: `1.5px solid ${on ? c : S.border}`,
									background: on ? c + "22" : "transparent",
									color: on ? c : S.textMuted,
								}}
							>
								{SCENARIO_SHORT[s]}
							</button>
						);
					})}
				</div>
				<TextInput placeholder="age" type="number" value={exp.ageMin ?? ""} onChange={(e) => onUpdate(exp.id, "ageMin", e.target.value)} style={{ width: 46, padding: "4px 5px", fontFamily: S.mono, fontSize: 10.5 }} />
				<TextInput placeholder="–" type="number" value={exp.ageMax ?? ""} onChange={(e) => onUpdate(exp.id, "ageMax", e.target.value)} style={{ width: 46, padding: "4px 5px", fontFamily: S.mono, fontSize: 10.5 }} />
				<button onClick={onDone} style={{ ...btnBase, padding: "5px 11px", borderRadius: 7, background: S.accent, color: "#fff", fontSize: 12, fontWeight: 600 }}>✓</button>
			</div>
		);
	}

	return (
		<div style={rowStyle}>
			<span style={{ fontSize: 12.5, color: S.text, flex: 1, minWidth: 120 }}>{exp.name}</span>
			<Tag color={tier.tone === "accent" ? S.accent : tier.tone === "warning" ? S.warning : S.danger}>
				{tier.icon}
			</Tag>
			{exp.scenarios && !exp.scenarios.includes("all") &&
				exp.scenarios.map((s) => (
					<Tag key={s} color={scenarioColor(S, s)}>{SCENARIO_SHORT[s]}</Tag>
				))}
			{(exp.ageMin != null || exp.ageMax != null) && (
				<Tag color={S.blue}>{exp.ageMin ?? ""}–{exp.ageMax ?? ""}</Tag>
			)}
			<span style={{ fontSize: 12.5, fontWeight: 650, fontFamily: S.mono, color: S.text }}>
				${exp.amount.toLocaleString()}
			</span>
			<button onClick={() => onEdit(exp.id)} style={{ ...btnBase, padding: "3px 8px", borderRadius: 6, border: `1px solid ${S.border}`, background: "transparent", color: S.textMuted, fontSize: 10.5 }}>edit</button>
			<button onClick={() => onRemove(exp.id)} style={{ ...btnBase, padding: "3px 8px", borderRadius: 6, border: `1px solid ${S.border}`, background: "transparent", color: S.danger, fontSize: 10.5 }}>✕</button>
		</div>
	);
}
