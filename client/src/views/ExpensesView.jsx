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
				sub={`Add what you spend each month, then tag it to the plans it belongs to and how essential it is. Greyed-out rows don't apply to "${activePlan?.name}".`}
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

			{expenses.length === 0 && (
				<div
					style={{
						textAlign: "center",
						padding: "44px 20px",
						border: `1px dashed ${S.border}`,
						borderRadius: 14,
						color: S.textMuted,
					}}
				>
					<div style={{ fontSize: 30, marginBottom: 10 }}>🧾</div>
					<div style={{ fontSize: 14, fontWeight: 600, color: S.text, marginBottom: 6 }}>
						No expenses yet
					</div>
					<div style={{ fontSize: 12.5, color: S.textMuted, maxWidth: 380, margin: "0 auto", lineHeight: 1.5 }}>
						Use the form above to add your first one. Start with the big essentials —
						housing, food, healthcare — then layer in the extras. Everything tagged
						“All plans” is shared; tag a plan to make it plan-specific.
					</div>
				</div>
			)}

			{usedCategories.map((cat) => {
				const catExps = expenses.filter((e) => e.cat === cat.id);
				const activeMonthly = monthlySpendAtAge(catExps, age, activePlanId, age, inflation);
				return (
					<div key={cat.id} style={{ marginBottom: 18 }}>
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
									width: 7,
									height: 7,
									borderRadius: 3,
									background: cat.color,
									boxShadow: `0 0 8px ${cat.color}88`,
									flexShrink: 0,
								}}
							/>
							<span
								style={{
									fontSize: 11,
									fontWeight: 700,
									color: cat.color,
									textTransform: "uppercase",
									letterSpacing: 0.6,
								}}
							>
								{cat.icon} {cat.label}
							</span>
							<span style={{ flex: 1 }} />
							<span style={{ fontSize: 11.5, color: S.textDim, fontFamily: S.mono }}>
								${activeMonthly.toLocaleString()}<span style={{ fontFamily: S.font }}>/mo active</span>
							</span>
						</div>
						{catExps.map((exp) => {
							const planActive =
								!exp.plans ||
								exp.plans.includes("all") ||
								exp.plans.includes(activePlanId);
							const ageActive =
								(exp.ageMin == null || age >= exp.ageMin) &&
								(exp.ageMax == null || age <= exp.ageMax);
							return (
								<ExpenseRow
									key={exp.id}
									exp={exp}
									categories={categories}
									plans={plans}
									active={planActive && ageActive}
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
