import { useState } from "react";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePlanner } from "../state/PlannerProvider.jsx";
import { INCOME_TYPES, fmt } from "../engine.js";
import { SectionTitle } from "../components/ui.jsx";
import AddIncomeForm from "../components/income/AddIncomeForm.jsx";
import IncomeRow from "../components/income/IncomeRow.jsx";

export default function IncomeView() {
	const S = useTheme();
	const {
		incomes,
		setIncomes,
		age,
		retireAge,
		activePlanId,
		activePlan,
		plans,
		incomeNow,
	} = usePlanner();

	const [editingId, setEditingId] = useState(null);

	const addIncome = (inc) => setIncomes((p) => [...(p || []), inc]);
	const removeIncome = (id) => setIncomes((p) => (p || []).filter((i) => i.id !== id));
	const updateIncome = (id, field, val) =>
		setIncomes((p) =>
			(p || []).map((i) => {
				if (i.id !== id) return i;
				if (field === "schedule") return { ...i, schedule: val };
				const numeric = field === "amount" || field === "ageMin" || field === "ageMax";
				return { ...i, [field]: numeric ? (val === "" ? undefined : Number(val)) : val };
			}),
		);

	const usedTypes = INCOME_TYPES.filter((t) => incomes.some((i) => i.type === t.id));

	const isRetired = age >= retireAge;

	return (
		<div className="fade-in">
			<SectionTitle
				sub={`Salary, bonus, RSUs and other pay while you're still working — tag it to the plans it belongs to. It stops automatically at retirement (age ${retireAge}). Greyed-out rows don't apply to "${activePlan?.name}".`}
				right={
					<div style={{ textAlign: "right" }}>
						<div style={{ fontSize: 20, fontWeight: 750, fontFamily: S.mono, color: S.accent }}>
							{fmt(incomeNow)}
							<span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.font }}> /yr now</span>
						</div>
						<div style={{ fontSize: 11, color: S.textMuted }}>
							{isRetired ? "Already retired" : `Stops at ${retireAge}`}
						</div>
					</div>
				}
			>
				Recurring Income
			</SectionTitle>

			<AddIncomeForm onAdd={addIncome} />

			{incomes.length === 0 && (
				<div
					style={{
						textAlign: "center",
						padding: "44px 20px",
						border: `1px dashed ${S.border}`,
						borderRadius: 14,
						color: S.textMuted,
					}}
				>
					<div style={{ fontSize: 30, marginBottom: 10 }}>💼</div>
					<div style={{ fontSize: 14, fontWeight: 600, color: S.text, marginBottom: 6 }}>
						No income sources yet
					</div>
					<div style={{ fontSize: 12.5, color: S.textMuted, maxWidth: 420, margin: "0 auto", lineHeight: 1.5 }}>
						If you're still working toward retirement, add your salary, bonus, and
						RSU vesting here — the surplus over your expenses compounds into your
						portfolio every year you keep working.
					</div>
				</div>
			)}

			{usedTypes.map((type) => {
				const typeIncomes = incomes.filter((i) => i.type === type.id);
				const activeMonthly = isRetired
					? 0
					: typeIncomes.reduce((sum, i) => {
							const planActive = !i.plans || i.plans.includes("all") || i.plans.includes(activePlanId);
							if (!planActive) return sum;
							if (Array.isArray(i.schedule)) {
								const t = i.schedule.find((s) => s.age === age);
								return sum + (t ? t.amount / 12 : 0);
							}
							const ageMatch = (i.ageMin == null || age >= i.ageMin) && (i.ageMax == null || age <= i.ageMax);
							return ageMatch ? sum + i.amount : sum;
						}, 0);
				return (
					<div key={type.id} style={{ marginBottom: 18 }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 9,
								padding: "4px 0 8px",
								marginBottom: 8,
								borderBottom: `1px solid ${S.border}`,
							}}
						>
							<span
								style={{
									fontSize: 11,
									fontWeight: 700,
									color: S.accent,
									textTransform: "uppercase",
									letterSpacing: 0.6,
								}}
							>
								{type.icon} {type.label}
							</span>
							<span style={{ flex: 1 }} />
							<span style={{ fontSize: 11.5, color: S.textDim, fontFamily: S.mono }}>
								${activeMonthly.toLocaleString()}<span style={{ fontFamily: S.font }}>/mo active</span>
							</span>
						</div>
						{typeIncomes.map((inc) => {
							const planActive =
								!inc.plans ||
								inc.plans.includes("all") ||
								inc.plans.includes(activePlanId);
							const ageActive = Array.isArray(inc.schedule)
								? inc.schedule.some((t) => t.age === age)
								: (inc.ageMin == null || age >= inc.ageMin) && (inc.ageMax == null || age <= inc.ageMax);
							return (
								<IncomeRow
									key={inc.id}
									inc={inc}
									plans={plans}
									active={planActive && ageActive && !isRetired}
									editing={editingId === inc.id}
									onEdit={setEditingId}
									onDone={() => setEditingId(null)}
									onUpdate={updateIncome}
									onRemove={removeIncome}
								/>
							);
						})}
					</div>
				);
			})}
		</div>
	);
}
