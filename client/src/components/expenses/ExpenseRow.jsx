import { useTheme } from "../../theme/ThemeProvider.jsx";
import { btnBase, RAD } from "../../lib/styles.js";
import { Tag, Select, TextInput, IconButton } from "../ui.jsx";
import Icon from "../Icon.jsx";
import { planColor, tagColor, tagLabel } from "../../lib/planMeta.js";

// Pencil/edit glyph in the shared Icon stroke style (24×24, currentColor).
// The Icon set has no pencil, so it's drawn inline here to stay emoji-free.
function EditGlyph({ size = 15 }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.9"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
			style={{ display: "block", flexShrink: 0 }}
		>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
		</svg>
	);
}

const TIER_META = {
	essential: { tone: "accent", icon: "🛡️" },
	discretionary: { tone: "warning", icon: "⚠️" },
	luxury: { tone: "danger", icon: "💎" },
};

export default function ExpenseRow({ exp, categories, plans, active, editing, onEdit, onDone, onUpdate, onRemove }) {
	const S = useTheme();
	const tier = TIER_META[exp.tier || "essential"];

	const togglePlan = (s) => {
		const curr = exp.plans || ["all"];
		if (s === "all") return onUpdate(exp.id, "plans", ["all"]);
		const hasAll = curr.includes("all");
		const hasS = curr.includes(s);
		let next;
		if (hasS) {
			next = curr.filter((x) => x !== s);
			if (next.length === 0 && !hasAll) next = ["all"];
		} else {
			next = hasAll ? [s] : [...curr.filter((x) => x !== "all"), s];
		}
		onUpdate(exp.id, "plans", next);
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
		const tagBtns = [{ id: "all" }, ...plans];
		return (
			<div style={rowStyle}>
				<Select value={exp.cat} onChange={(e) => onUpdate(exp.id, "cat", e.target.value)} style={{ width: 130, padding: "4px 7px", fontSize: 12 }}>
					{categories.map((c) => (
						<option key={c.id} value={c.id}>{c.icon} {c.label}</option>
					))}
				</Select>
				<TextInput value={exp.name} onChange={(e) => onUpdate(exp.id, "name", e.target.value)} style={{ flex: 1, minWidth: 110, padding: "4px 9px", fontSize: 12 }} />
				<TextInput type="number" value={exp.amount} onChange={(e) => onUpdate(exp.id, "amount", e.target.value)} style={{ width: 76, padding: "4px 9px", fontFamily: S.mono, fontSize: 12, textAlign: "right" }} />
				<Select value={exp.tier || "essential"} onChange={(e) => onUpdate(exp.id, "tier", e.target.value)} style={{ width: 60, padding: "4px 6px", fontSize: 12 }}>
					<option value="essential">🛡️</option>
					<option value="discretionary">⚠️</option>
					<option value="luxury">💎</option>
				</Select>
				<TextInput placeholder="CPI" title="Inflation override (%)" type="number" step="0.5" value={exp.inflOverride != null ? +(exp.inflOverride * 100).toFixed(2) : ""} onChange={(e) => onUpdate(exp.id, "inflOverride", e.target.value === "" ? undefined : Number(e.target.value) / 100)} style={{ width: 52, padding: "4px 6px", fontFamily: S.mono, fontSize: 11 }} />
				<div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
					{tagBtns.map((pl) => {
						const on = (exp.plans || ["all"]).includes(pl.id);
						const c = pl.id === "all" ? S.textMuted : planColor(S, pl);
						return (
							<button
								key={pl.id}
								type="button"
								onClick={() => togglePlan(pl.id)}
								title={pl.id === "all" ? "All plans" : pl.name}
								style={{ ...btnBase, padding: "2px 7px", borderRadius: 10, fontSize: 9.5, fontWeight: 600, border: `1.5px solid ${on ? c : S.border}`, background: on ? c + "22" : "transparent", color: on ? c : S.textMuted }}
							>
								{pl.id === "all" ? "All" : pl.icon}
							</button>
						);
					})}
				</div>
				<TextInput placeholder="age" type="number" value={exp.ageMin ?? ""} onChange={(e) => onUpdate(exp.id, "ageMin", e.target.value)} style={{ width: 44, padding: "4px 5px", fontFamily: S.mono, fontSize: 10.5 }} />
				<TextInput placeholder="–" type="number" value={exp.ageMax ?? ""} onChange={(e) => onUpdate(exp.id, "ageMax", e.target.value)} style={{ width: 44, padding: "4px 5px", fontFamily: S.mono, fontSize: 10.5 }} />
				<button onClick={onDone} style={{ ...btnBase, padding: "5px 11px", borderRadius: 7, background: S.accent, color: "#fff", fontSize: 12, fontWeight: 600 }}>✓</button>
			</div>
		);
	}

	const tagTone = tier.tone === "accent" ? S.accent : tier.tone === "warning" ? S.warning : S.danger;
	return (
		<div className={active ? "row-hover" : ""} style={rowStyle}>
			<span style={{ fontSize: 12.5, color: S.text, flex: 1, minWidth: 110 }}>{exp.name}</span>
			<Tag color={tagTone}>{tier.icon}</Tag>
			{exp.plans && !exp.plans.includes("all") &&
				exp.plans.map((s) => (
					<Tag key={s} color={tagColor(S, s, plans)}>{tagLabel(s, plans)}</Tag>
				))}
			{(exp.ageMin != null || exp.ageMax != null) && (
				<Tag color={S.blue}>{exp.ageMin ?? ""}–{exp.ageMax ?? ""}</Tag>
			)}
			<span style={{ fontSize: 12.5, fontWeight: 650, fontFamily: S.mono, color: S.text }}>${exp.amount.toLocaleString()}</span>
			<IconButton
				title={`Edit ${exp.name}`}
				onClick={() => onEdit(exp.id)}
				style={{ width: 28, height: 28, borderRadius: RAD.sm, color: S.textMuted }}
			>
				<EditGlyph />
			</IconButton>
			<IconButton
				title={`Delete ${exp.name}`}
				onClick={() => onRemove(exp.id)}
				style={{ width: 28, height: 28, borderRadius: RAD.sm, color: S.danger }}
			>
				<Icon name="x-circle" size={16} />
			</IconButton>
		</div>
	);
}
