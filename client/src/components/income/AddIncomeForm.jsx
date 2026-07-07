import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { uid, INCOME_TYPES, buildVestingSchedule, fmt } from "../../engine.js";
import { Card, Chip, TextInput, Select, Button, Segmented } from "../ui.jsx";
import { planColor } from "../../lib/planMeta.js";

const BLANK = {
	type: "salary",
	name: "",
	amount: "",
	plans: ["all"],
	growth: "",
	ageMin: "",
	ageMax: "",
};

const VEST_PATTERNS = [
	{ value: "equal", label: "Equal" },
	{ value: "backloaded", label: "Back-loaded (5/15/40/40)" },
];

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

export default function AddIncomeForm({ onAdd }) {
	const S = useTheme();
	const { plans, age, retireAge } = usePlanner();
	const [draft, setDraft] = useState(BLANK);
	const [showAdvanced, setShowAdvanced] = useState(false);

	// RSUs can either be a flat recurring amount (e.g. a steady annual refresh
	// already averaged out) or an explicit multi-year vesting schedule.
	const [rsuMode, setRsuMode] = useState("flat");
	const [vest, setVest] = useState({
		grantValue: "",
		startAge: age,
		years: 4,
		pattern: "equal",
	});

	const isRsu = draft.type === "rsu";
	const usingSchedule = isRsu && rsuMode === "schedule";

	const schedulePreview =
		usingSchedule && vest.grantValue !== "" && Number(vest.grantValue) > 0
			? buildVestingSchedule({
					grantValue: Number(vest.grantValue),
					startAge: Number(vest.startAge) || age,
					years: Number(vest.years) || 4,
					pattern: vest.pattern,
				})
			: [];

	const canAdd = usingSchedule
		? draft.name.trim() && schedulePreview.length > 0
		: draft.name.trim() && draft.amount !== "" && Number(draft.amount) > 0;

	const submit = () => {
		if (!canAdd) return;
		const base = {
			id: uid(),
			type: draft.type,
			name: draft.name.trim(),
			plans: draft.plans,
		};
		if (usingSchedule) {
			onAdd({ ...base, amount: 0, schedule: schedulePreview });
		} else {
			onAdd({
				...base,
				amount: Number(draft.amount),
				growth: draft.growth !== "" ? Number(draft.growth) / 100 : undefined,
				...(draft.ageMin !== "" ? { ageMin: Number(draft.ageMin) } : {}),
				...(draft.ageMax !== "" ? { ageMax: Number(draft.ageMax) } : {}),
			});
		}
		// Keep type / plan tags so adding several similar rows is quick.
		setDraft((p) => ({ ...p, name: "", amount: "" }));
		setVest((p) => ({ ...p, grantValue: "" }));
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
			<div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
				<span style={{ fontSize: 13, fontWeight: 650, color: S.text }}>Add income</span>
				<span style={{ fontSize: 11.5, color: S.textDim }}>
					Recurring pay while you're still working — it stops automatically at retirement.
				</span>
			</div>

			<div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
				<Select
					value={draft.type}
					onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}
					style={{ width: 168 }}
				>
					{INCOME_TYPES.map((t) => (
						<option key={t.id} value={t.id}>
							{t.icon} {t.label}
						</option>
					))}
				</Select>
				<TextInput
					placeholder="What is it? e.g. Base salary"
					value={draft.name}
					onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
					onKeyDown={(e) => e.key === "Enter" && !usingSchedule && submit()}
					style={{ flex: 1, minWidth: 160 }}
				/>
				{!usingSchedule && (
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
				)}
				{!isRsu && (
					<Button variant="primary" onClick={submit} disabled={!canAdd} style={!canAdd ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
						＋ Add
					</Button>
				)}
			</div>

			{isRsu && (
				<div style={{ marginBottom: 12 }}>
					<Segmented
						size="sm"
						value={rsuMode}
						onChange={setRsuMode}
						options={[
							{ value: "flat", label: "Flat monthly amount" },
							{ value: "schedule", label: "Vesting schedule" },
						]}
					/>
				</div>
			)}

			{usingSchedule && (
				<div
					className="fade-in"
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: 20,
						rowGap: 12,
						marginBottom: 14,
						padding: "12px 14px",
						background: S.bg,
						borderRadius: 10,
						border: `1px solid ${S.border}`,
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
						<GroupLabel>Total grant value</GroupLabel>
						<TextInput
							placeholder="$0"
							type="number"
							value={vest.grantValue}
							onChange={(e) => setVest((p) => ({ ...p, grantValue: e.target.value }))}
							style={{ width: 120, fontFamily: S.mono }}
						/>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
						<GroupLabel>First vest age</GroupLabel>
						<TextInput
							type="number"
							value={vest.startAge}
							onChange={(e) => setVest((p) => ({ ...p, startAge: e.target.value }))}
							style={numStyle}
						/>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
						<GroupLabel>Vesting years</GroupLabel>
						<TextInput
							type="number"
							value={vest.years}
							onChange={(e) => setVest((p) => ({ ...p, years: e.target.value }))}
							style={numStyle}
						/>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
						<GroupLabel>Pattern</GroupLabel>
						<Segmented
							size="sm"
							value={vest.pattern}
							onChange={(v) => setVest((p) => ({ ...p, pattern: v }))}
							options={VEST_PATTERNS}
						/>
					</div>

					{schedulePreview.length > 0 && (
						<div style={{ flexBasis: "100%", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
							<GroupLabel>Preview</GroupLabel>
							{schedulePreview.map((t) => (
								<span
									key={t.age}
									style={{
										fontSize: 11,
										fontFamily: S.mono,
										color: S.text,
										background: S.card,
										border: `1px solid ${S.border}`,
										borderRadius: 8,
										padding: "3px 8px",
									}}
								>
									{t.age}: {fmt(t.amount)}
								</span>
							))}
						</div>
					)}

					<div style={{ flexBasis: "100%" }}>
						<Button variant="primary" onClick={submit} disabled={!canAdd} style={!canAdd ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
							＋ Add vesting schedule
						</Button>
					</div>
				</div>
			)}

			{/* Tagging, with plain-language labels so it isn't a guessing game */}
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
			</div>

			{/* Rarely-needed knobs, hidden until asked for — not shown for a
			    vesting schedule, whose tranches already carry their own ages. */}
			{!usingSchedule && (
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
						Advanced — age range &amp; growth rate
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
										Always stops by retirement (age {retireAge}) regardless.
									</span>
								</div>
							</div>

							<div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
								<GroupLabel>Custom growth rate</GroupLabel>
								<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
									<TextInput
										placeholder="CPI"
										type="number"
										step="0.5"
										value={draft.growth}
										onChange={(e) => setDraft((p) => ({ ...p, growth: e.target.value }))}
										style={numStyle}
									/>
									<span style={{ fontSize: 11, color: S.textDim }}>%</span>
									<span style={{ fontSize: 10.5, color: S.textDim, marginLeft: 4 }}>
										Blank = grows with inflation. Use 0 for a fixed amount, or your expected raise rate.
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</Card>
	);
}
