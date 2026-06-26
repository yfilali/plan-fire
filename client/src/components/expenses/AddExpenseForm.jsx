import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { uid } from "../../engine.js";
import { Card, Chip, TextInput, Select, Button, Segmented } from "../ui.jsx";
import { planColor } from "../../lib/planMeta.js";

const BLANK = {
	cat: "other",
	name: "",
	amount: "",
	plans: ["all"],
	tier: "essential",
	inflOverride: "",
	ageMin: "",
	ageMax: "",
};

const PRIORITY_OPTIONS = [
	{ value: "essential", label: "🛡️ Essential" },
	{ value: "discretionary", label: "⚠️ Discretionary" },
	{ value: "luxury", label: "💎 Luxury" },
];

const PRIORITY_HINT = {
	essential: "Always funded — never trimmed, even in a downturn.",
	discretionary: "Trimmed first when markets drop (set the cut on the Plan page).",
	luxury: "Cut the most in a downturn — nice-to-haves like big trips.",
};

// Small uppercase label that introduces each tagging group.
function GroupLabel({ children }) {
	const S = useTheme();
	return (
		<span
			style={{
				fontSize: 10.5,
				fontWeight: 700,
				color: S.textMuted,
				textTransform: "uppercase",
				letterSpacing: 0.6,
			}}
		>
			{children}
		</span>
	);
}

export default function AddExpenseForm({ categories, onAdd }) {
	const S = useTheme();
	const { plans } = usePlanner();
	const [draft, setDraft] = useState(BLANK);
	const [showAdvanced, setShowAdvanced] = useState(false);

	const canAdd = draft.name.trim() && draft.amount !== "" && Number(draft.amount) > 0;

	const submit = () => {
		if (!canAdd) return;
		onAdd({
			id: uid(),
			cat: draft.cat,
			name: draft.name.trim(),
			amount: Number(draft.amount),
			plans: draft.plans,
			tier: draft.tier || "essential",
			inflOverride: draft.inflOverride !== "" ? Number(draft.inflOverride) / 100 : undefined,
			...(draft.ageMin !== "" ? { ageMin: Number(draft.ageMin) } : {}),
			...(draft.ageMax !== "" ? { ageMax: Number(draft.ageMax) } : {}),
		});
		// Keep category / plan / priority so adding several similar rows is quick.
		setDraft((p) => ({ ...p, name: "", amount: "" }));
	};

	const togglePlan = (s) =>
		setDraft((p) => {
			if (s === "all") return { ...p, plans: ["all"] };
			const has = p.plans.includes(s);
			const next = has
				? p.plans.filter((x) => x !== s)
				: [...p.plans.filter((x) => x !== "all"), s];
			return { ...p, plans: next.length ? next : ["all"] };
		});

	const allPlans = draft.plans.includes("all");
	const numStyle = { width: 64, fontFamily: S.mono, padding: "6px 9px", fontSize: 12.5 };

	return (
		<Card style={{ marginBottom: 16 }}>
			{/* Step 1 — the essentials: what, which bucket, how much */}
			<div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
				<span style={{ fontSize: 13, fontWeight: 650, color: S.text }}>Add an expense</span>
				<span style={{ fontSize: 11.5, color: S.textDim }}>
					Name it, pick a category, and enter a monthly amount.
				</span>
			</div>

			<div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
				<Select
					value={draft.cat}
					onChange={(e) => setDraft((p) => ({ ...p, cat: e.target.value }))}
					style={{ width: 168 }}
				>
					{categories.map((c) => (
						<option key={c.id} value={c.id}>
							{c.icon} {c.label}
						</option>
					))}
				</Select>
				<TextInput
					placeholder="What is it? e.g. Groceries"
					value={draft.name}
					onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
					onKeyDown={(e) => e.key === "Enter" && submit()}
					style={{ flex: 1, minWidth: 160 }}
				/>
				<div style={{ position: "relative", width: 120 }}>
					<span
						style={{
							position: "absolute",
							left: 10,
							top: "50%",
							transform: "translateY(-50%)",
							fontSize: 12.5,
							color: S.textDim,
							pointerEvents: "none",
						}}
					>
						$
					</span>
					<TextInput
						placeholder="0"
						type="number"
						value={draft.amount}
						onChange={(e) => setDraft((p) => ({ ...p, amount: e.target.value }))}
						onKeyDown={(e) => e.key === "Enter" && submit()}
						style={{ fontFamily: S.mono, textAlign: "right", padding: "8px 36px 8px 18px" }}
					/>
					<span
						style={{
							position: "absolute",
							right: 10,
							top: "50%",
							transform: "translateY(-50%)",
							fontSize: 11,
							color: S.textDim,
							pointerEvents: "none",
						}}
					>
						/mo
					</span>
				</div>
				<Button variant="primary" onClick={submit} disabled={!canAdd} style={!canAdd ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
					＋ Add
				</Button>
			</div>

			{/* Step 2 — tagging, with plain-language labels so it isn't a guessing game */}
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: 20,
					rowGap: 14,
					paddingTop: 14,
					borderTop: `1px solid ${S.border}`,
				}}
			>
				<div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 240 }}>
					<GroupLabel>Applies to which plans?</GroupLabel>
					<div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
						<Chip active={allPlans} color={S.textMuted} onClick={() => togglePlan("all")}>
							All plans
						</Chip>
						{plans.map((pl) => (
							<Chip
								key={pl.id}
								active={draft.plans.includes(pl.id)}
								color={planColor(S, pl)}
								onClick={() => togglePlan(pl.id)}
							>
								{pl.icon} {pl.name}
							</Chip>
						))}
					</div>
					<span style={{ fontSize: 10.5, color: S.textDim }}>
						{allPlans
							? "Counted in every plan you compare."
							: "Only counted in the selected plan(s)."}
					</span>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 240 }}>
					<GroupLabel>How essential is it?</GroupLabel>
					<Segmented
						size="sm"
						options={PRIORITY_OPTIONS}
						value={draft.tier}
						onChange={(v) => setDraft((p) => ({ ...p, tier: v }))}
					/>
					<span style={{ fontSize: 10.5, color: S.textDim }}>{PRIORITY_HINT[draft.tier]}</span>
				</div>
			</div>

			{/* Step 3 — rarely-needed knobs, hidden until asked for */}
			<div style={{ marginTop: 14 }}>
				<button
					onClick={() => setShowAdvanced((v) => !v)}
					style={{
						background: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 0,
						fontSize: 11.5,
						fontWeight: 550,
						color: S.textMuted,
						display: "inline-flex",
						alignItems: "center",
						gap: 5,
					}}
				>
					<span style={{ transition: "transform .15s ease", transform: showAdvanced ? "rotate(90deg)" : "none" }}>
						▸
					</span>
					Advanced — age range &amp; inflation
				</button>

				{showAdvanced && (
					<div
						className="fade-in"
						style={{ display: "flex", flexWrap: "wrap", gap: 20, rowGap: 12, marginTop: 12 }}
					>
						<div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
							<GroupLabel>Only between ages</GroupLabel>
							<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
								<TextInput
									placeholder="from"
									type="number"
									value={draft.ageMin}
									onChange={(e) => setDraft((p) => ({ ...p, ageMin: e.target.value }))}
									style={numStyle}
								/>
								<span style={{ fontSize: 11, color: S.textDim }}>–</span>
								<TextInput
									placeholder="to"
									type="number"
									value={draft.ageMax}
									onChange={(e) => setDraft((p) => ({ ...p, ageMax: e.target.value }))}
									style={numStyle}
								/>
								<span style={{ fontSize: 10.5, color: S.textDim, marginLeft: 4 }}>
									Leave blank to apply at every age.
								</span>
							</div>
						</div>

						<div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
							<GroupLabel>Custom inflation</GroupLabel>
							<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
								<TextInput
									placeholder="CPI"
									type="number"
									step="0.5"
									value={draft.inflOverride}
									onChange={(e) => setDraft((p) => ({ ...p, inflOverride: e.target.value }))}
									style={numStyle}
								/>
								<span style={{ fontSize: 11, color: S.textDim }}>%</span>
								<span style={{ fontSize: 10.5, color: S.textDim, marginLeft: 4 }}>
									Blank = follow inflation. Use 0 for fixed costs like a mortgage.
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
