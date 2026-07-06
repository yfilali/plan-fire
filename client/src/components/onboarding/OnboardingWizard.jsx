import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { Card, Button, Segmented, Tag } from "../ui.jsx";
import Icon from "../Icon.jsx";
import SliderRow from "../SliderRow.jsx";
import { fmt } from "../../engine.js";

const SS_AGES = [62, 65, 67, 68, 70];

// Fixed (not random) ids for the wizard's own expense lines, so re-running
// onboarding (e.g. "Restart" in Settings) can find-and-update exactly these
// entries — never mistaking some other real, itemized expense for one of
// these just because it happened to be first. Three distinct lines (rather
// than one flat number) so the review step and dashboard actually show off
// what makes this app's expense modeling different: a cost that grows with
// inflation (essentials), one that doesn't (a fixed-rate mortgage), and one
// that phases out at a specific age (health insurance before Medicare).
const EXPENSE_IDS = {
	essentials: "onboarding_essentials",
	fixed: "onboarding_fixed",
	healthPre65: "onboarding_health_pre65",
	healthPost65: "onboarding_health_post65",
};

// A post-65 Medicare + Medigap cost is typically a fraction of pre-65 ACA
// premiums — used to auto-generate the second, cheaper age-phased entry
// without asking a 4th question.
const post65Estimate = (pre65Amount) => Math.round((pre65Amount * 0.35) / 50) * 50;

const STEPS = ["welcome", "age", "savings", "expenses", "income", "review"];

function StepDots({ index }) {
	const S = useTheme();
	return (
		<div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 22 }}>
			{STEPS.map((s, i) => (
				<span
					key={s}
					style={{
						width: i === index ? 20 : 7,
						height: 7,
						borderRadius: 4,
						background: i <= index ? S.accent : S.border,
						transition: "all .2s ease",
					}}
				/>
			))}
		</div>
	);
}

function Bullet({ icon, children }) {
	const S = useTheme();
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0" }}>
			<div
				style={{
					width: 32,
					height: 32,
					borderRadius: 10,
					flexShrink: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: S.accentSoft,
					color: S.accent,
				}}
			>
				<Icon name={icon} size={16} />
			</div>
			<div style={{ fontSize: 13.5, color: S.text, lineHeight: 1.4 }}>{children}</div>
		</div>
	);
}

function ReviewRow({ label, value }) {
	const S = useTheme();
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				padding: "11px 0",
				borderBottom: `1px solid ${S.border}`,
			}}
		>
			<div style={{ fontSize: 13, color: S.textMuted }}>{label}</div>
			<div style={{ fontSize: 14, fontWeight: 650, color: S.text, fontFamily: S.mono }}>{value}</div>
		</div>
	);
}

// A big selectable option block — used for the "estimate vs. itemize later"
// expense choice, where a Segmented control would be too cramped to explain
// each option.
function OptionCard({ selected, onClick, icon, title, desc }) {
	const S = useTheme();
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={selected}
			style={{
				textAlign: "left",
				display: "flex",
				alignItems: "flex-start",
				gap: 12,
				padding: "12px 14px",
				borderRadius: 12,
				border: `1.5px solid ${selected ? S.accent : S.border}`,
				background: selected ? S.accentSoft : "transparent",
				cursor: "pointer",
				width: "100%",
				fontFamily: S.font,
			}}
		>
			<div
				style={{
					width: 30,
					height: 30,
					borderRadius: 9,
					flexShrink: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: selected ? S.accent : S.bg,
					color: selected ? "#fff" : S.textMuted,
				}}
			>
				<Icon name={icon} size={15} />
			</div>
			<div>
				<div style={{ fontSize: 13.5, fontWeight: 650, color: S.text }}>{title}</div>
				<div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{desc}</div>
			</div>
		</button>
	);
}

// Full-screen, one-time guided setup for a brand-new account. Writes straight
// through the same planner setters the rest of the app uses (setAge,
// updateAsset, setExpenses, ...), so every step is already "live" — Review
// just reflects real projected state rather than a separate draft copy. A
// brand-new account starts with zero expenses and a $0 portfolio (see
// PlannerProvider's buildFreshPlans/buildFreshAssets) so this wizard is the
// only source of any non-zero numbers — nothing here is assumed.
export default function OnboardingWizard() {
	const S = useTheme();
	const {
		age,
		setAge,
		retireAge,
		setRetireAge,
		ssAge,
		setSsAge,
		ssAnnual,
		setSsAnnual,
		portfolio,
		assets,
		updateAsset,
		expenses,
		setExpenses,
		categories,
		runsOut,
		endAge,
		completeOnboarding,
	} = usePlanner();

	const [step, setStep] = useState(0);
	const portfolioAsset = assets.find((a) => a.type === "investment");

	const setPortfolio = (v) => {
		if (portfolioAsset) updateAsset(portfolioAsset.id, { value: v });
	};

	const changeAge = (v) => {
		setAge(v);
		if (retireAge < v) setRetireAge(v);
	};

	// Expenses: up to four line items, each upserted by a fixed id so any
	// other real, itemized expenses the account already has are left
	// untouched — or none at all if the user would rather itemize for real
	// afterward. Only pre-selects "estimate" if this step already ran before
	// (one of these ids is present) — otherwise it always forces an explicit
	// choice. NOTE: each handler below issues exactly one setExpenses call —
	// usePersistedState resolves functional updates against a stale,
	// per-render closure, so two setExpenses calls back-to-back in the same
	// tick would have the second clobber the first (see setBacktestWindow's
	// comment above for the same gotcha).
	const findOnboardingAmt = (id, fallback) => expenses.find((e) => e.id === id)?.amount ?? fallback;
	const hasAnyOnboardingExpense = Object.values(EXPENSE_IDS).some((id) =>
		expenses.some((e) => e.id === id),
	);
	const [expenseMode, setExpenseMode] = useState(() => (hasAnyOnboardingExpense ? "estimate" : null));
	const [essentials, setEssentials] = useState(() => findOnboardingAmt(EXPENSE_IDS.essentials, 3000));
	const [fixedCost, setFixedCost] = useState(() => findOnboardingAmt(EXPENSE_IDS.fixed, 0));
	const [healthPre65, setHealthPre65] = useState(() =>
		findOnboardingAmt(EXPENSE_IDS.healthPre65, age < 65 ? 1200 : 0),
	);

	// Upserts/removes are batched into one setExpenses call per invocation.
	const applyExpensePatch = (upserts = [], removeIds = []) => {
		setExpenses((prev) => {
			const base = (prev || []).filter(
				(e) => !removeIds.includes(e.id) && !upserts.some((u) => u.id === e.id),
			);
			return [...base, ...upserts];
		});
	};

	const applyEssentials = (amount) => {
		setEssentials(amount);
		applyExpensePatch([
			{ id: EXPENSE_IDS.essentials, cat: "other", name: "Everyday essentials", amount, plans: ["all"], tier: "essential" },
		]);
	};
	const applyFixed = (amount) => {
		setFixedCost(amount);
		if (amount > 0) {
			applyExpensePatch([
				{ id: EXPENSE_IDS.fixed, cat: "housing", name: "Fixed payment (e.g. mortgage)", amount, plans: ["all"], tier: "essential", inflOverride: 0 },
			]);
		} else {
			applyExpensePatch([], [EXPENSE_IDS.fixed]);
		}
	};
	const applyHealthPre65 = (amount) => {
		setHealthPre65(amount);
		if (amount > 0) {
			applyExpensePatch([
				{ id: EXPENSE_IDS.healthPre65, cat: "health", name: "Health insurance (pre-Medicare)", amount, plans: ["all"], tier: "essential", inflOverride: 0.065, ageMax: 64 },
				{ id: EXPENSE_IDS.healthPost65, cat: "health", name: "Medicare + Medigap (est.)", amount: post65Estimate(amount), plans: ["all"], tier: "essential", ageMin: 65 },
			]);
		} else {
			applyExpensePatch([], [EXPENSE_IDS.healthPre65, EXPENSE_IDS.healthPost65]);
		}
	};

	const chooseEstimate = () => {
		setExpenseMode("estimate");
		applyEssentials(essentials);
	};
	const chooseLater = () => {
		setExpenseMode("later");
		applyExpensePatch([], Object.values(EXPENSE_IDS));
	};

	const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
	const back = () => setStep((s) => Math.max(s - 1, 0));
	const nextDisabled = STEPS[step] === "expenses" && expenseMode === null;

	const longevity = runsOut ? `Runs out around age ${runsOut.age}` : `Lasts through age ${endAge}+`;

	const stepContent = () => {
		switch (STEPS[step]) {
			case "welcome":
				return (
					<>
						<div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
							<div
								style={{
									width: 52,
									height: 52,
									borderRadius: 16,
									flexShrink: 0,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									background: S.accentGradient,
									color: "#fff",
								}}
							>
								<Icon name="sparkle" size={24} />
							</div>
							<h1 style={{ fontSize: 22, fontWeight: 750, color: S.text }}>
								Let's set up your plan
							</h1>
						</div>
						<p style={{ fontSize: 13.5, color: S.textMuted, lineHeight: 1.55, marginBottom: 6 }}>
							A few quick questions — under a minute — and you'll have a real
							projection. Everything here can be refined later.
						</p>
						<div style={{ marginTop: 10 }}>
							<Bullet icon="retire">Model when you can retire and how long your money lasts</Bullet>
							<Bullet icon="shield">Stress-test your plan against market downturns</Bullet>
							<Bullet icon="relocate">Compare staying put vs. relocating side by side</Bullet>
						</div>
					</>
				);
			case "age":
				return (
					<>
						<h2 style={{ fontSize: 17, fontWeight: 700, color: S.text, marginBottom: 4 }}>About you</h2>
						<p style={{ fontSize: 12.5, color: S.textMuted, marginBottom: 18 }}>
							We'll use this to line up your projection year by year.
						</p>
						<SliderRow
							label="Your current age"
							value={age}
							onChange={changeAge}
							min={18}
							max={85}
							step={1}
							format={(v) => `${v}`}
						/>
						<SliderRow
							label="Target retirement age"
							value={retireAge}
							onChange={setRetireAge}
							min={age}
							max={90}
							step={1}
							format={(v) => `${v}`}
						/>
					</>
				);
			case "savings":
				return (
					<>
						<h2 style={{ fontSize: 17, fontWeight: 700, color: S.text, marginBottom: 4 }}>Your savings</h2>
						<p style={{ fontSize: 12.5, color: S.textMuted, marginBottom: 18 }}>
							Total investable savings — 401(k), IRA, brokerage, cash. Add
							individual accounts and real estate later under Assets.
						</p>
						<SliderRow
							label="Current investment portfolio"
							value={portfolio}
							onChange={setPortfolio}
							min={0}
							max={5000000}
							step={10000}
							format={fmt}
							editMax={100000000}
						/>
					</>
				);
			case "expenses":
				return (
					<>
						<h2 style={{ fontSize: 17, fontWeight: 700, color: S.text, marginBottom: 4 }}>Monthly expenses</h2>
						<p style={{ fontSize: 12.5, color: S.textMuted, marginBottom: 16 }}>
							How do you want to handle spending for now?
						</p>
						<div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
							<OptionCard
								selected={expenseMode === "estimate"}
								onClick={chooseEstimate}
								icon="flag"
								title="Rough monthly estimate"
								desc="A couple of quick numbers, so today's projection has real spending in it."
							/>
							<OptionCard
								selected={expenseMode === "later"}
								onClick={chooseLater}
								icon="briefcase"
								title="I'll itemize later"
								desc="Skip for now — add each expense by category afterward."
							/>
						</div>
						{expenseMode === "estimate" && (
							<div style={{ display: "grid", gap: 16 }}>
								<div>
									<SliderRow
										label="Everyday essentials"
										value={essentials}
										onChange={applyEssentials}
										min={0}
										max={20000}
										step={100}
										format={fmt}
										editMax={200000}
									/>
									<div style={{ fontSize: 11, color: S.textDim, marginTop: -8 }}>
										Rent, groceries, utilities — grows with inflation like most spending.
									</div>
								</div>
								<div>
									<SliderRow
										label="Fixed payments (optional)"
										value={fixedCost}
										onChange={applyFixed}
										min={0}
										max={5000}
										step={50}
										format={fmt}
										editMax={50000}
									/>
									<div style={{ fontSize: 11, color: S.textDim, marginTop: -8 }}>
										Stays flat forever — e.g. a fixed-rate mortgage. Leave at $0 if none.
									</div>
								</div>
								{age < 65 && (
									<div>
										<SliderRow
											label="Health insurance before 65 (optional)"
											value={healthPre65}
											onChange={applyHealthPre65}
											min={0}
											max={5000}
											step={50}
											format={fmt}
											editMax={50000}
										/>
										<div style={{ fontSize: 11, color: S.textDim, marginTop: -8 }}>
											Runs through 64, then drops when Medicare starts at 65.
											{healthPre65 > 0 && ` → est. ${fmt(post65Estimate(healthPre65))}/mo after 65.`}
										</div>
									</div>
								)}
							</div>
						)}
						{expenseMode === "later" && (
							<div style={{ padding: "12px 14px", borderRadius: 10, background: S.bg, border: `1px dashed ${S.border}` }}>
								<div style={{ fontSize: 12.5, color: S.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
									No problem — after setup, open <b style={{ color: S.text }}>Expenses</b> in
									the sidebar to add each one with its own category, amount, and
									inflation assumptions:
								</div>
								<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
									{categories.slice(0, 6).map((c) => (
										<Tag key={c.id} color={c.color}>
											{c.icon} {c.label}
										</Tag>
									))}
								</div>
							</div>
						)}
					</>
				);
			case "income":
				return (
					<>
						<h2 style={{ fontSize: 17, fontWeight: 700, color: S.text, marginBottom: 4 }}>Social Security</h2>
						<p style={{ fontSize: 12.5, color: S.textMuted, marginBottom: 18 }}>
							A rough estimate is fine — check your latest statement at
							ssa.gov/myaccount when you get a chance.
						</p>
						<SliderRow
							label="Estimated annual benefit"
							value={ssAnnual}
							onChange={setSsAnnual}
							min={0}
							max={80000}
							step={1000}
							format={fmt}
							editMax={200000}
						/>
						<div style={{ marginTop: 16 }}>
							<div style={{ fontSize: 12.5, color: S.textMuted, marginBottom: 8 }}>Claiming age</div>
							<Segmented
								options={SS_AGES.map((a) => ({ value: a, label: a }))}
								value={ssAge}
								onChange={setSsAge}
							/>
						</div>
					</>
				);
			case "review":
			default:
				return (
					<>
						<h2 style={{ fontSize: 17, fontWeight: 700, color: S.text, marginBottom: 4 }}>You're all set</h2>
						<p style={{ fontSize: 12.5, color: S.textMuted, marginBottom: 16 }}>
							Here's your starting point — dive into the dashboard to explore
							scenarios, expenses, and more.
						</p>
						<div>
							<ReviewRow label="Current age" value={age} />
							<ReviewRow label="Target retirement age" value={retireAge} />
							<ReviewRow label="Investment portfolio" value={fmt(portfolio)} />
							{expenseMode === "estimate" ? (
								<>
									<ReviewRow label="Everyday essentials" value={`${fmt(essentials)}/mo`} />
									{fixedCost > 0 && <ReviewRow label="Fixed payments" value={`${fmt(fixedCost)}/mo`} />}
									{age < 65 && healthPre65 > 0 && (
										<ReviewRow
											label="Health insurance"
											value={`${fmt(healthPre65)}/mo → ${fmt(post65Estimate(healthPre65))}/mo at 65`}
										/>
									)}
								</>
							) : (
								<ReviewRow label="Monthly spending" value="Add later in Expenses" />
							)}
							<ReviewRow label="Social Security" value={`${fmt(ssAnnual)}/yr at ${ssAge}`} />
						</div>
						<div
							style={{
								marginTop: 16,
								padding: "12px 14px",
								borderRadius: 10,
								background: S.accentSoft,
								color: S.text,
								fontSize: 13,
								display: "flex",
								alignItems: "center",
								gap: 10,
							}}
						>
							<Icon name="flag" size={16} color={S.accent} />
							<span>
								{longevity} in your baseline scenario.
								{expenseMode !== "estimate" && " Add your expenses for a more accurate picture."}
								{expenseMode === "estimate" && age < 65 && healthPre65 > 0 && " Health costs step down at 65 when Medicare starts."}
							</span>
						</div>
					</>
				);
		}
	};

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 50,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: S.bg,
				padding: 16,
			}}
		>
			<div style={{ width: 520, maxWidth: "100%" }}>
				<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
					<Button variant="ghost" size="sm" onClick={completeOnboarding}>
						Skip setup
					</Button>
				</div>
				<Card pad={28} style={{ boxShadow: S.shadowLg }} className="fade-in">
					<StepDots index={step} />
					<div key={step} className="fade-in">
						{stepContent()}
					</div>
					<div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
						<Button variant="ghost" onClick={back} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
							Back
						</Button>
						{step === STEPS.length - 1 ? (
							<Button variant="primary" onClick={completeOnboarding}>
								Go to my dashboard
							</Button>
						) : (
							<Button
								variant="primary"
								onClick={next}
								disabled={nextDisabled}
								style={{ opacity: nextDisabled ? 0.5 : 1, cursor: nextDisabled ? "not-allowed" : "pointer" }}
							>
								{step === 0 ? "Let's get started" : "Continue"}
							</Button>
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}
