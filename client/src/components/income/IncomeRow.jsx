import { useTheme } from "../../theme/ThemeProvider.jsx";
import { btnBase, RAD } from "../../lib/styles.js";
import { Tag, Select, TextInput, IconButton } from "../ui.jsx";
import Icon from "../Icon.jsx";
import { INCOME_TYPES, fmt } from "../../engine.js";
import { planColor, tagColor, tagLabel } from "../../lib/planMeta.js";

// Pencil/edit glyph in the shared Icon stroke style (24×24, currentColor).
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

const TYPE_META = Object.fromEntries(INCOME_TYPES.map((t) => [t.id, t]));

export default function IncomeRow({ inc, plans, active, editing, onEdit, onDone, onUpdate, onRemove }) {
	const S = useTheme();
	const type = TYPE_META[inc.type] || TYPE_META.other;
	const hasSchedule = Array.isArray(inc.schedule);
	const scheduleTotal = hasSchedule ? inc.schedule.reduce((s, t) => s + t.amount, 0) : 0;

	const togglePlan = (s) => {
		const curr = inc.plans || ["all"];
		if (s === "all") return onUpdate(inc.id, "plans", ["all"]);
		const hasAll = curr.includes("all");
		const hasS = curr.includes(s);
		let next;
		if (hasS) {
			next = curr.filter((x) => x !== s);
			if (next.length === 0 && !hasAll) next = ["all"];
		} else {
			next = hasAll ? [s] : [...curr.filter((x) => x !== "all"), s];
		}
		onUpdate(inc.id, "plans", next);
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

	const updateTranche = (age, val) => {
		const next = inc.schedule.map((t) => (t.age === age ? { ...t, amount: Number(val) || 0 } : t));
		onUpdate(inc.id, "schedule", next);
	};

	if (editing) {
		const tagBtns = [{ id: "all" }, ...plans];
		return (
			<div style={rowStyle}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", width: "100%" }}>
					<Select value={inc.type} onChange={(e) => onUpdate(inc.id, "type", e.target.value)} style={{ width: 140, padding: "4px 7px", fontSize: 12 }}>
						{INCOME_TYPES.map((t) => (
							<option key={t.id} value={t.id}>{t.icon} {t.label}</option>
						))}
					</Select>
					<TextInput value={inc.name} onChange={(e) => onUpdate(inc.id, "name", e.target.value)} style={{ flex: 1, minWidth: 110, padding: "4px 9px", fontSize: 12 }} />
					{!hasSchedule && (
						<>
							<TextInput type="number" value={inc.amount} onChange={(e) => onUpdate(inc.id, "amount", e.target.value)} style={{ width: 76, padding: "4px 9px", fontFamily: S.mono, fontSize: 12, textAlign: "right" }} />
							<TextInput placeholder="growth" title="Growth rate override (%)" type="number" step="0.5" value={inc.growth != null ? +(inc.growth * 100).toFixed(2) : ""} onChange={(e) => onUpdate(inc.id, "growth", e.target.value === "" ? undefined : Number(e.target.value) / 100)} style={{ width: 60, padding: "4px 6px", fontFamily: S.mono, fontSize: 11 }} />
							<TextInput placeholder="age" type="number" value={inc.ageMin ?? ""} onChange={(e) => onUpdate(inc.id, "ageMin", e.target.value)} style={{ width: 44, padding: "4px 5px", fontFamily: S.mono, fontSize: 10.5 }} />
							<TextInput placeholder="–" type="number" value={inc.ageMax ?? ""} onChange={(e) => onUpdate(inc.id, "ageMax", e.target.value)} style={{ width: 44, padding: "4px 5px", fontFamily: S.mono, fontSize: 10.5 }} />
						</>
					)}
					<div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
						{tagBtns.map((pl) => {
							const on = (inc.plans || ["all"]).includes(pl.id);
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
					<button onClick={onDone} style={{ ...btnBase, padding: "5px 11px", borderRadius: 7, background: S.accent, color: "#fff", fontSize: 12, fontWeight: 600 }}>✓</button>
				</div>
				{hasSchedule && (
					<div style={{ display: "flex", gap: 6, flexWrap: "wrap", width: "100%", paddingLeft: 2 }}>
						{inc.schedule.map((t) => (
							<div key={t.age} style={{ display: "flex", alignItems: "center", gap: 4 }}>
								<span style={{ fontSize: 10.5, color: S.textDim, fontFamily: S.mono }}>{t.age}:</span>
								<TextInput
									type="number"
									value={t.amount}
									onChange={(e) => updateTranche(t.age, e.target.value)}
									style={{ width: 72, padding: "3px 6px", fontFamily: S.mono, fontSize: 11 }}
								/>
							</div>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className={active ? "row-hover" : ""} style={rowStyle}>
			<span style={{ fontSize: 12.5, color: S.text, flex: 1, minWidth: 110 }}>{inc.name}</span>
			<Tag color={S.accent}>{type.icon} {type.label}</Tag>
			{inc.plans && !inc.plans.includes("all") &&
				inc.plans.map((s) => (
					<Tag key={s} color={tagColor(S, s, plans)}>{tagLabel(s, plans)}</Tag>
				))}
			{hasSchedule ? (
				<Tag color={S.blue}>Vests {inc.schedule[0].age}–{inc.schedule[inc.schedule.length - 1].age}</Tag>
			) : (
				(inc.ageMin != null || inc.ageMax != null) && (
					<Tag color={S.blue}>{inc.ageMin ?? ""}–{inc.ageMax ?? ""}</Tag>
				)
			)}
			<span style={{ fontSize: 12.5, fontWeight: 650, fontFamily: S.mono, color: S.text }}>
				{hasSchedule ? `${fmt(scheduleTotal)} total` : `$${inc.amount.toLocaleString()}/mo`}
			</span>
			<IconButton
				title={`Edit ${inc.name}`}
				onClick={() => onEdit(inc.id)}
				style={{ width: 28, height: 28, borderRadius: RAD.sm, color: S.textMuted }}
			>
				<EditGlyph />
			</IconButton>
			<IconButton
				title={`Delete ${inc.name}`}
				onClick={() => onRemove(inc.id)}
				style={{ width: 28, height: 28, borderRadius: RAD.sm, color: S.danger }}
			>
				<Icon name="x-circle" size={16} />
			</IconButton>
		</div>
	);
}
