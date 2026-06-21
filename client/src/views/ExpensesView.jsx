import { useState } from "react";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePlanner } from "../state/PlannerProvider.jsx";
import { monthlySpendAtAge, fmt } from "../engine.js";
import { SectionTitle, Button } from "../components/ui.jsx";
import AddExpenseForm from "../components/expenses/AddExpenseForm.jsx";
import ExpenseRow from "../components/expenses/ExpenseRow.jsx";
import CategoryManager from "../components/expenses/CategoryManager.jsx";

export default function ExpensesView() {
	const S = useTheme();
	const {
		categories,
		expenses,
		setExpenses,
		age,
		activePlanId,
		activePlan,
		plans,
		inflation,
		spendAt,
		spend65,
		spend70,
	} = usePlanner();

	const [editingId, setEditingId] = useState(null);
	const [showCatManager, setShowCatManager] = useState(false);

	const addExpense = (exp) => setExpenses((p) => [...p, exp]);
	const removeExpense = (id) => setExpenses((p) => p.filter((e) => e.id !== id));
	const updateExpense = (id, field, val) =>
		setExpenses((p) =>
			p.map((e) =>
				e.id === id
					? {
							...e,
							[field]:
								field === "amount" || field === "ageMin" || field === "ageMax"
									? val === ""
										? undefined
										: Number(val)
									: val,
						}
					: e,
			),
		);

	const usedCategories = categories.filter((c) => expenses.some((e) => e.cat === c.id));

	return (
		<div className="fade-in">
			{showCatManager && <CategoryManager onClose={() => setShowCatManager(false)} />}

			<SectionTitle
				sub={`Tag each expense by plan, age range, and tier. Greyed-out rows don't apply to "${activePlan?.name}".`}
				right={
					<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
						<Button variant="secondary" onClick={() => setShowCatManager(true)}>🏷️ Categories</Button>
						<div style={{ textAlign: "right" }}>
							<div style={{ fontSize: 20, fontWeight: 750, fontFamily: S.mono, color: S.accent }}>
								{fmt(spendAt(age, activePlanId))}
								<span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.font }}> /yr now</span>
							</div>
							<div style={{ fontSize: 11, color: S.textMuted }}>
								{fmt(spend65)}/yr @65 · {fmt(spend70)}/yr @70
							</div>
						</div>
					</div>
				}
			>
				Monthly Expenses
			</SectionTitle>

			<AddExpenseForm categories={categories} onAdd={addExpense} />

			{usedCategories.map((cat) => {
				const catExps = expenses.filter((e) => e.cat === cat.id);
				const activeMonthly = monthlySpendAtAge(catExps, age, activePlanId, age, inflation);
				return (
					<div key={cat.id} style={{ marginBottom: 16 }}>
						<div
							style={{
								fontSize: 11,
								fontWeight: 700,
								color: cat.color,
								textTransform: "uppercase",
								letterSpacing: 0.6,
								padding: "4px 0",
								marginBottom: 4,
							}}
						>
							{cat.icon} {cat.label}
							<span style={{ color: S.textDim, fontWeight: 500, marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>
								${activeMonthly.toLocaleString()}/mo active
							</span>
						</div>
						{catExps.map((exp) => {
							const scenarioActive =
								!exp.scenarios ||
								exp.scenarios.includes("all") ||
								exp.scenarios.includes(activePlanId);
							const ageActive =
								(exp.ageMin == null || age >= exp.ageMin) &&
								(exp.ageMax == null || age <= exp.ageMax);
							return (
								<ExpenseRow
									key={exp.id}
									exp={exp}
									categories={categories}
									plans={plans}
									active={scenarioActive && ageActive}
									editing={editingId === exp.id}
									onEdit={setEditingId}
									onDone={() => setEditingId(null)}
									onUpdate={updateExpense}
									onRemove={removeExpense}
								/>
							);
						})}
					</div>
				);
			})}
		</div>
	);
}
