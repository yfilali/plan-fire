import { useState, useMemo, useRef } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	ResponsiveContainer,
	ReferenceLine,
	CartesianGrid,
	ComposedChart,
	Area,
} from "recharts";
import {
	usePersistedState,
	useStoreStatus,
	exportData,
	importData,
	clearAllData,
} from "./usePersistedState.jsx";
import {
	project,
	buildReturns,
	monthlySpendAtAge,
	fmt,
	uid,
	DEFAULT_CATEGORIES,
	DEFAULT_EXPENSES,
	COLOR_OPTIONS,
	SCENARIO_LABELS,
	LOST_DECADE,
} from "./engine";

// ── Theme ────────────────────────────────────────────────────────────
const S = {
	bg: "#0f1117",
	card: "#1a1d27",
	border: "#2a2d3a",
	text: "#e4e4e7",
	textMuted: "#71717a",
	textDim: "#52525b",
	accent: "#22c55e",
	warning: "#f59e0b",
	danger: "#ef4444",
	blue: "#3b82f6",
	purple: "#8b5cf6",
	font: "'DM Sans','Segoe UI',system-ui,sans-serif",
	mono: "'DM Mono','Menlo',monospace",
};
const btnBase = {
	border: "none",
	cursor: "pointer",
	fontFamily: S.font,
	transition: "all .15s",
};
const inputBase = {
	borderRadius: 6,
	border: `1px solid ${S.border}`,
	background: S.bg,
	color: S.text,
	fontSize: 13,
	fontFamily: S.font,
};

// ── Reusable Components ──────────────────────────────────────────────
function Chip({ active, onClick, children, color }) {
	return (
		<button
			onClick={onClick}
			style={{
				...btnBase,
				padding: "5px 12px",
				borderRadius: 20,
				border: `1.5px solid ${active ? color || S.accent : S.border}`,
				background: active ? (color || S.accent) + "18" : "transparent",
				color: active ? color || S.accent : S.textMuted,
				fontSize: 12,
				fontWeight: 500,
			}}
		>
			{children}
		</button>
	);
}
function StatCard({ label, value, sub, color, small }) {
	return (
		<div
			style={{
				padding: small ? "10px 12px" : "14px 16px",
				background: S.card,
				borderRadius: 10,
				border: `1px solid ${S.border}`,
			}}
		>
			<div
				style={{
					fontSize: 10,
					color: S.textMuted,
					marginBottom: 2,
					textTransform: "uppercase",
					letterSpacing: 0.5,
				}}
			>
				{label}
			</div>
			<div
				style={{
					fontSize: small ? 18 : 24,
					fontWeight: 700,
					color: color || S.text,
				}}
			>
				{value}
			</div>
			{sub && (
				<div style={{ fontSize: 10, color: S.textDim, marginTop: 2 }}>
					{sub}
				</div>
			)}
		</div>
	);
}
function SliderRow({ label, value, onChange, min, max, step, format }) {
	return (
		<div style={{ marginBottom: 12 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: 3,
				}}
			>
				<label style={{ fontSize: 12, color: S.textMuted }}>{label}</label>
				<span style={{ fontSize: 13, fontWeight: 600, fontFamily: S.mono }}>
					{format(value)}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				style={{ width: "100%" }}
			/>
		</div>
	);
}
function ChartTip({ active, payload, label }) {
	if (!active || !payload?.length) return null;
	return (
		<div
			style={{
				background: S.card,
				border: `1px solid ${S.border}`,
				borderRadius: 8,
				padding: "10px 14px",
			}}
		>
			<p
				style={{
					fontWeight: 600,
					marginBottom: 6,
					color: S.text,
					fontSize: 13,
				}}
			>
				Age {label}
			</p>
			{payload.map((p, i) => (
				<p key={i} style={{ color: p.color, margin: "3px 0", fontSize: 12 }}>
					{p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}
				</p>
			))}
		</div>
	);
}
function Tag({ children, color }) {
	return (
		<span
			style={{
				display: "inline-block",
				padding: "1px 7px",
				borderRadius: 10,
				fontSize: 10,
				fontWeight: 500,
				background: (color || S.textDim) + "22",
				color: color || S.textMuted,
				border: `1px solid ${color || S.textDim}44`,
			}}
		>
			{children}
		</span>
	);
}

// ── Category Manager Modal ───────────────────────────────────────────
function CategoryManager({
	categories,
	setCategories,
	expenses,
	setExpenses,
	onClose,
}) {
	const [newCat, setNewCat] = useState({
		label: "",
		icon: "📂",
		color: COLOR_OPTIONS[0],
	});
	const EMOJIS = [
		"📂",
		"🏠",
		"🚗",
		"🍽️",
		"🏥",
		"✈️",
		"🛡️",
		"⚡",
		"👤",
		"🌎",
		"📦",
		"🎓",
		"👶",
		"🐕",
		"🏋️",
		"🎮",
		"🎵",
		"📱",
		"💊",
		"🧹",
		"🎁",
		"💈",
		"🏖️",
		"📚",
		"🛒",
		"💻",
		"🍺",
		"☕",
		"⛽",
		"🔧",
		"🎭",
		"🏕️",
		"🎣",
		"🛥️",
		"📡",
		"🌿",
		"🏗️",
	];
	const addCat = () => {
		if (!newCat.label.trim()) return;
		setCategories((p) => [
			...p,
			{
				id: uid(),
				label: newCat.label.trim(),
				icon: newCat.icon,
				color: newCat.color,
			},
		]);
		setNewCat({
			label: "",
			icon: "📂",
			color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)],
		});
	};
	const removeCat = (catId) => {
		const n = expenses.filter((e) => e.cat === catId).length;
		if (
			n > 0 &&
			!confirm(`Delete ${n} expense${n > 1 ? "s" : ""} in this category?`)
		)
			return;
		setExpenses((p) => p.filter((e) => e.cat !== catId));
		setCategories((p) => p.filter((c) => c.id !== catId));
	};
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,.6)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 100,
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: S.card,
					borderRadius: 16,
					border: `1px solid ${S.border}`,
					padding: 24,
					width: 520,
					maxHeight: "80vh",
					overflowY: "auto",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						marginBottom: 16,
					}}
				>
					<h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
						Manage Categories
					</h3>
					<button
						onClick={onClose}
						style={{
							...btnBase,
							background: "none",
							color: S.textMuted,
							fontSize: 20,
							padding: 4,
						}}
					>
						✕
					</button>
				</div>
				<div
					style={{
						padding: 14,
						background: S.bg,
						borderRadius: 10,
						marginBottom: 16,
					}}
				>
					<div style={{ fontSize: 11, color: S.textDim, marginBottom: 6 }}>
						Icon
					</div>
					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: 3,
							marginBottom: 8,
						}}
					>
						{EMOJIS.map((em) => (
							<button
								key={em}
								onClick={() => setNewCat((p) => ({ ...p, icon: em }))}
								style={{
									...btnBase,
									width: 28,
									height: 28,
									borderRadius: 6,
									fontSize: 14,
									border:
										newCat.icon === em
											? `2px solid ${S.accent}`
											: `1px solid ${S.border}`,
									background:
										newCat.icon === em ? S.accent + "22" : "transparent",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								{em}
							</button>
						))}
					</div>
					<div style={{ fontSize: 11, color: S.textDim, marginBottom: 6 }}>
						Color
					</div>
					<div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
						{COLOR_OPTIONS.map((c) => (
							<button
								key={c}
								onClick={() => setNewCat((p) => ({ ...p, color: c }))}
								style={{
									...btnBase,
									width: 22,
									height: 22,
									borderRadius: 11,
									background: c,
									border:
										newCat.color === c
											? "2px solid white"
											: "2px solid transparent",
								}}
							/>
						))}
					</div>
					<div style={{ display: "flex", gap: 8 }}>
						<div
							style={{
								width: 34,
								height: 34,
								borderRadius: 8,
								background: newCat.color + "22",
								border: `1px solid ${newCat.color}`,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 16,
								flexShrink: 0,
							}}
						>
							{newCat.icon}
						</div>
						<input
							placeholder="Category name"
							value={newCat.label}
							onChange={(e) =>
								setNewCat((p) => ({ ...p, label: e.target.value }))
							}
							onKeyDown={(e) => e.key === "Enter" && addCat()}
							style={{ ...inputBase, flex: 1, padding: "8px 12px" }}
						/>
						<button
							onClick={addCat}
							style={{
								...btnBase,
								padding: "8px 16px",
								borderRadius: 6,
								background: S.accent,
								color: "#000",
								fontWeight: 600,
								fontSize: 13,
							}}
						>
							+ Add
						</button>
					</div>
				</div>
				{categories.map((cat) => (
					<div
						key={cat.id}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
							padding: "6px 10px",
							borderRadius: 8,
							marginBottom: 3,
							border: `1px solid ${S.border}`,
						}}
					>
						<span style={{ fontSize: 15 }}>{cat.icon}</span>
						<span style={{ flex: 1, fontSize: 13 }}>{cat.label}</span>
						<div
							style={{
								width: 10,
								height: 10,
								borderRadius: 5,
								background: cat.color,
							}}
						/>
						<button
							onClick={() => removeCat(cat.id)}
							style={{
								...btnBase,
								padding: "2px 8px",
								borderRadius: 4,
								background: "transparent",
								color: S.danger,
								fontSize: 11,
								border: `1px solid ${S.border}`,
							}}
						>
							✕
						</button>
					</div>
				))}
			</div>
		</div>
	);
}

// ── Main App ─────────────────────────────────────────────────────────
export default function App() {
	const [tab, setTab] = usePersistedState("tab", "dashboard");
	const { loaded, serverOk } = useStoreStatus();
	const fileInputRef = useRef(null);

	// Profile
	const [age, setAge] = usePersistedState("age", 49);
	const [retireAge, setRetireAge] = usePersistedState("retireAge", 49);
	const [portfolio, setPortfolio] = usePersistedState("portfolio", 3000000);
	const [ssAge, setSsAge] = usePersistedState("ssAge", 70);
	const [ssAnnual, setSsAnnual] = usePersistedState("ssAnnual", 40000);

	// Market
	const [nomReturn, setNomReturn] = usePersistedState("nomReturn", 0.1);
	const [inflation, setInflation] = usePersistedState("inflation", 0.03);
	const [marketMode, setMarketMode] = usePersistedState(
		"marketMode",
		"historical",
	);

	// Housing
	const [housingPlan, setHousingPlan] = usePersistedState(
		"housingPlan",
		"sell_move",
	);
	const [ccHomeCost, setCcHomeCost] = usePersistedState("ccHomeCost", 1000000);
	const [transitionYears, setTransitionYears] = usePersistedState(
		"transitionYears",
		1,
	);

	// Landlord
	const [monthlyRent, setMonthlyRent] = usePersistedState("monthlyRent", 4500);
	const [monthlyMortgage, setMonthlyMortgage] = usePersistedState(
		"monthlyMortgage",
		2400,
	);
	const [annualPropTax, setAnnualPropTax] = usePersistedState(
		"annualPropTax",
		14000,
	);
	const [annualLandlordCosts, setAnnualLandlordCosts] = usePersistedState(
		"annualLandlordCosts",
		13000,
	);

	// RE
	const [houseValue, setHouseValue] = usePersistedState("houseValue", 1900000);
	const [mortgageOwed, setMortgageOwed] = usePersistedState(
		"mortgageOwed",
		500000,
	);
	const [byersValue, setByersValue] = usePersistedState("byersValue", 500000);
	const sellingCosts = 0.06;

	// Categories & Expenses
	const [categories, setCategories] = usePersistedState(
		"categories",
		DEFAULT_CATEGORIES,
	);
	const [expenses, setExpenses] = usePersistedState(
		"expenses",
		DEFAULT_EXPENSES,
	);
	const [editingId, setEditingId] = useState(null);
	const [newExpense, setNewExpense] = useState({
		cat: "other",
		name: "",
		amount: "",
		scenarios: ["all"],
		inflOverride: "",
		ageMin: "",
		ageMax: "",
	});
	const [showCatManager, setShowCatManager] = useState(false);

	// ── Computed ──

	const grossRent = monthlyRent * 12;
	const landlordExp =
		monthlyMortgage * 12 + annualPropTax + annualLandlordCosts;
	const netRental = Math.round(grossRent * 0.95 - landlordExp);
	const houseNet = Math.round(houseValue * (1 - sellingCosts) - mortgageOwed);
	const byersNet = Math.round(byersValue * (1 - sellingCosts));
	const totalRENet = houseNet + byersNet;
	const endAge = 95;
	const realRet = (1 + nomReturn) / (1 + inflation) - 1;

	// Spending at key ages for the active scenario (inflation-aware)
	const spendAt = (a, scen) =>
		monthlySpendAtAge(expenses, a, scen || housingPlan, age, inflation) * 12;
	const spendNow = spendAt(
		age,
		housingPlan === "stay"
			? "stay"
			: age < age + transitionYears
				? "stay"
				: housingPlan,
	);
	const spend65 = spendAt(65, housingPlan);
	const spend70 = spendAt(70, housingPlan);

	// ── Projections ──
	const projections = useMemo(() => {
		const avgR = buildReturns("avg", nomReturn);
		const bearR = buildReturns("lost_decade", nomReturn);
		const activeR = marketMode === "lost_decade" ? bearR : avgR;
		const altR = marketMode === "lost_decade" ? avgR : bearR;
		const common = {
			startAge: age,
			endAge,
			retireAge,
			ssAge,
			ssAnnual,
			inflation,
			expenses,
		};

		let trans = null;
		let rental = 0;
		const scenario = housingPlan;

		if (housingPlan === "sell_move") {
			trans = {
				moveAge: age + transitionYears,
				netProceeds: totalRENet,
				newHomeCost: ccHomeCost,
				preSpend: 0,
			};
		} else if (housingPlan === "rent_out") {
			rental = netRental;
			// Portfolio: sell Byers, buy CC home
			// (mortgage stays as landlord expense, not personal)
		}

		const startPort =
			housingPlan === "rent_out"
				? portfolio + byersNet - ccHomeCost
				: portfolio;

		const primary = project({
			...common,
			portfolio: startPort,
			scenario,
			nomReturn: activeR,
			rentalNet: rental,
			transition: trans,
		});
		const alt = project({
			...common,
			portfolio: startPort,
			scenario,
			nomReturn: altR,
			rentalNet: rental,
			transition: trans,
		});

		const postTransAge = trans ? trans.moveAge : age;
		const atPost = primary.find((d) => d.age === postTransAge);

		return {
			primary,
			alt,
			primaryLabel:
				marketMode === "lost_decade" ? "Lost Decade" : "Historical Avg",
			altLabel: marketMode === "lost_decade" ? "Historical Avg" : "Lost Decade",
			startPort: atPost?.balance || startPort,
		};
	}, [
		age,
		retireAge,
		portfolio,
		expenses,
		nomReturn,
		inflation,
		ssAge,
		ssAnnual,
		marketMode,
		housingPlan,
		ccHomeCost,
		transitionYears,
		totalRENet,
		netRental,
		byersNet,
	]);

	const runsOut = projections.primary.find(
		(d) => d.balance <= 0 && d.age >= retireAge,
	);
	const altRunsOut = projections.alt.find(
		(d) => d.balance <= 0 && d.age >= retireAge,
	);
	const getD = (a, d = projections.primary) => d.find((x) => x.age === a) || {};

	// Effective withdrawal rate post-transition
	const postData = getD(
		Math.max(
			retireAge,
			age + (housingPlan === "sell_move" ? transitionYears : 0),
		),
	);
	const effWR =
		postData.balance > 0
			? (postData.netWithdrawal / postData.balance) * 100
			: 0;

	const chartData = useMemo(
		() =>
			projections.primary.map((d, i) => ({
				age: d.age,
				primary: d.balance,
				alt: projections.alt[i]?.balance || 0,
				spending: d.annualSpend,
				income: d.income,
			})),
		[projections],
	);

	// Spending timeline data
	const spendTimeline = useMemo(() => {
		const pts = [];
		for (let a = age; a <= endAge; a += 1) {
			const scen =
				housingPlan !== "stay" && a >= age + transitionYears
					? housingPlan
					: "stay";
			const m = monthlySpendAtAge(expenses, a, scen, age, inflation);
			pts.push({ age: a, monthly: m, annual: m * 12 });
		}
		return pts;
	}, [expenses, age, housingPlan, transitionYears]);

	const status =
		effWR <= 3.5
			? { label: "Excellent", color: S.accent, bg: "#16a34a22" }
			: effWR <= 4.5
				? { label: "Good", color: "#22d3ee", bg: "#22d3ee22" }
				: effWR <= 5.5
					? { label: "Caution", color: S.warning, bg: "#f59e0b22" }
					: { label: "At Risk", color: S.danger, bg: "#ef444422" };

	// ── Expense handlers ──
	const addExpense = () => {
		if (!newExpense.name || !newExpense.amount) return;
		setExpenses((p) => [
			...p,
			{
				id: uid(),
				cat: newExpense.cat,
				name: newExpense.name,
				amount: Number(newExpense.amount),
				scenarios: newExpense.scenarios,
				inflOverride:
					newExpense.inflOverride !== ""
						? Number(newExpense.inflOverride) / 100
						: undefined,
				...(newExpense.ageMin !== ""
					? { ageMin: Number(newExpense.ageMin) }
					: {}),
				...(newExpense.ageMax !== ""
					? { ageMax: Number(newExpense.ageMax) }
					: {}),
			},
		]);
		setNewExpense((p) => ({ ...p, name: "", amount: "" }));
	};
	const removeExpense = (id) =>
		setExpenses((p) => p.filter((e) => e.id !== id));
	const updateExpense = (id, field, val) =>
		setExpenses((p) =>
			p.map((e) =>
				e.id === id
					? {
							...e,
							[field]:
								field === "amount" ||
								field === "ageMin" ||
								field === "ageMax" ||
								field === "inflOverride"
									? val === ""
										? undefined
										: Number(val)
									: val,
						}
					: e,
			),
		);

	// ── Data mgmt ──
	const handleExport = () => exportData();
	const handleImport = (e) => {
		const f = e.target.files?.[0];
		if (!f) return;
		const r = new FileReader();
		r.onload = async (ev) => {
			try {
				await importData(JSON.parse(ev.target.result));
			} catch {
				alert("Invalid");
			}
		};
		r.readAsText(f);
	};
	const handleReset = async () => {
		if (!confirm("Reset all data to defaults?")) return;
		await clearAllData();
		window.location.reload();
	};

	const tabs = [
		{ id: "dashboard", label: "Dashboard", icon: "📊" },
		{ id: "expenses", label: "Expenses", icon: "💰" },
		{ id: "housing", label: "Housing", icon: "🏠" },
		{ id: "simulation", label: "Simulation", icon: "⚙️" },
	];

	if (!loaded)
		return (
			<div
				style={{
					fontFamily: S.font,
					background: S.bg,
					color: S.text,
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div style={{ textAlign: "center" }}>
					<div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
					<div style={{ fontSize: 16, fontWeight: 600 }}>Loading...</div>
				</div>
			</div>
		);

	return (
		<div
			style={{
				fontFamily: S.font,
				background: S.bg,
				color: S.text,
				minHeight: "100vh",
			}}
		>
			<link
				href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
				rel="stylesheet"
			/>
			{showCatManager && (
				<CategoryManager
					categories={categories}
					setCategories={setCategories}
					expenses={expenses}
					setExpenses={setExpenses}
					onClose={() => setShowCatManager(false)}
				/>
			)}

			{/* Header */}
			<div
				style={{
					padding: "14px 28px",
					borderBottom: `1px solid ${S.border}`,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
							Retirement Planner
						</h1>
						<div
							title={serverOk ? "Server synced" : "Offline"}
							style={{
								width: 8,
								height: 8,
								borderRadius: 4,
								background: serverOk ? S.accent : S.warning,
								boxShadow: `0 0 6px ${serverOk ? S.accent : S.warning}`,
							}}
						/>
					</div>
					<p style={{ fontSize: 11, color: S.textMuted, margin: "2px 0 0" }}>
						Age {age} · Retire {retireAge === age ? "now" : `at ${retireAge}`} ·{" "}
						{fmt(portfolio)} portfolio
					</p>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<div
						style={{
							padding: "5px 14px",
							borderRadius: 20,
							background: status.bg,
							border: `1.5px solid ${status.color}`,
							color: status.color,
							fontSize: 12,
							fontWeight: 600,
						}}
					>
						{status.label} — {effWR.toFixed(1)}% WR
					</div>
					<select
						value={housingPlan}
						onChange={(e) => setHousingPlan(e.target.value)}
						style={{
							...inputBase,
							padding: "5px 10px",
							borderRadius: 20,
							fontSize: 12,
							fontWeight: 600,
							background: S.card,
						}}
					>
						<option value="stay">🏙️ Stay BA</option>
						<option value="sell_move">🌲 Sell + CC</option>
						<option value="rent_out">🏠 Rent SJ + CC</option>
					</select>
					<button
						onClick={handleExport}
						title="Export"
						style={{
							...btnBase,
							padding: "5px 8px",
							borderRadius: 6,
							background: S.card,
							border: `1px solid ${S.border}`,
							color: S.textMuted,
							fontSize: 14,
						}}
					>
						📥
					</button>
					<button
						onClick={() => fileInputRef.current?.click()}
						title="Import"
						style={{
							...btnBase,
							padding: "5px 8px",
							borderRadius: 6,
							background: S.card,
							border: `1px solid ${S.border}`,
							color: S.textMuted,
							fontSize: 14,
						}}
					>
						📤
					</button>
					<button
						onClick={handleReset}
						title="Reset"
						style={{
							...btnBase,
							padding: "5px 8px",
							borderRadius: 6,
							background: S.card,
							border: `1px solid ${S.border}`,
							color: S.textMuted,
							fontSize: 14,
						}}
					>
						🗑️
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept=".json"
						onChange={handleImport}
						style={{ display: "none" }}
					/>
				</div>
			</div>

			{/* Tabs */}
			<div
				style={{
					display: "flex",
					gap: 4,
					padding: "8px 28px",
					borderBottom: `1px solid ${S.border}`,
					background: "#14161e",
				}}
			>
				{tabs.map((t) => (
					<button
						key={t.id}
						onClick={() => setTab(t.id)}
						style={{
							...btnBase,
							padding: "7px 16px",
							borderRadius: 8,
							background: tab === t.id ? S.card : "transparent",
							color: tab === t.id ? S.text : S.textMuted,
							fontSize: 13,
							fontWeight: 500,
						}}
					>
						{t.icon} {t.label}
					</button>
				))}
			</div>

			<div style={{ padding: "20px 28px", maxWidth: 1000, margin: "0 auto" }}>
				{/* ═══ DASHBOARD ═══ */}
				{tab === "dashboard" && (
					<>
						{/* Status */}
						<div
							style={{
								padding: "14px 18px",
								borderRadius: 12,
								background: status.bg,
								border: `1px solid ${status.color}44`,
								marginBottom: 16,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<div>
								<div
									style={{ fontSize: 16, fontWeight: 700, color: status.color }}
								>
									{!runsOut
										? "✓ Money never runs out"
										: `⚠ Depleted at age ${runsOut.age}`}
								</div>
								<div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>
									{housingPlan === "stay"
										? "Stay BA"
										: housingPlan === "sell_move"
											? `Sell+CC (${fmt(ccHomeCost)})`
											: "Rent SJ+CC"}
									{" · "}
									{marketMode === "lost_decade" ? "Lost decade" : "Hist. avg"}
									{retireAge > age && ` · Working until ${retireAge}`}
								</div>
							</div>
							<div style={{ textAlign: "right" }}>
								<div style={{ fontSize: 10, color: S.textMuted }}>
									{projections.altLabel}
								</div>
								<div
									style={{
										fontSize: 13,
										fontWeight: 600,
										color: altRunsOut ? S.danger : S.accent,
									}}
								>
									{altRunsOut ? `Out @ ${altRunsOut.age}` : "Survives ✓"}
								</div>
							</div>
						</div>

						{/* Stats */}
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(6, 1fr)",
								gap: 8,
								marginBottom: 16,
							}}
						>
							<StatCard
								label="Portfolio"
								value={fmt(projections.startPort)}
								sub="Post-transition"
								small
							/>
							<StatCard
								label={`Spend @${age}`}
								value={fmt(spendNow)}
								sub="Current/yr"
								small
							/>
							<StatCard
								label="Spend @65"
								value={fmt(spend65)}
								sub="Medicare kicks in"
								small
								color={spend65 < spendNow ? S.accent : S.text}
							/>
							<StatCard
								label="Spend @70"
								value={fmt(spend70)}
								sub="SS starts"
								small
								color={S.accent}
							/>
							<StatCard
								label="W/D Rate"
								value={`${effWR.toFixed(1)}%`}
								color={
									effWR <= 4 ? S.accent : effWR <= 5 ? S.warning : S.danger
								}
								sub="Target: ≤4%"
								small
							/>
							<StatCard
								label="At 90"
								value={fmt(getD(90).balance || 0)}
								color={(getD(90).balance || 0) > 0 ? S.accent : S.danger}
								small
							/>
						</div>

						{/* Portfolio chart */}
						<div
							style={{
								background: S.card,
								borderRadius: 12,
								border: `1px solid ${S.border}`,
								padding: "14px 14px 6px",
								marginBottom: 16,
							}}
						>
							<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
								Portfolio Balance
							</div>
							<ResponsiveContainer width="100%" height={280}>
								<LineChart
									data={chartData}
									margin={{ top: 5, right: 10, bottom: 5, left: 5 }}
								>
									<CartesianGrid strokeDasharray="3 3" stroke={S.border} />
									<XAxis
										dataKey="age"
										tick={{ fontSize: 10, fill: S.textMuted }}
										tickLine={false}
										axisLine={{ stroke: S.border }}
									/>
									<YAxis
										tickFormatter={fmt}
										tick={{ fontSize: 10, fill: S.textMuted }}
										tickLine={false}
										axisLine={false}
										width={50}
									/>
									<Tooltip content={<ChartTip />} />
									<Legend
										formatter={(v) => (
											<span style={{ fontSize: 11, color: S.textMuted }}>
												{v}
											</span>
										)}
									/>
									<ReferenceLine
										y={0}
										stroke={S.danger}
										strokeDasharray="4 4"
										strokeWidth={1}
									/>
									{retireAge > age && (
										<ReferenceLine
											x={retireAge}
											stroke={S.blue}
											strokeDasharray="4 4"
											label={{ value: "Retire", fontSize: 10, fill: S.blue }}
										/>
									)}
									<ReferenceLine
										x={65}
										stroke={S.purple}
										strokeDasharray="4 4"
										label={{ value: "Medicare", fontSize: 10, fill: S.purple }}
									/>
									<ReferenceLine
										x={ssAge}
										stroke={S.accent}
										strokeDasharray="4 4"
										label={{ value: "SS", fontSize: 10, fill: S.accent }}
									/>
									<Line
										type="monotone"
										dataKey="primary"
										name={projections.primaryLabel}
										stroke={S.accent}
										strokeWidth={2.5}
										dot={false}
									/>
									<Line
										type="monotone"
										dataKey="alt"
										name={projections.altLabel}
										stroke={S.textDim}
										strokeWidth={1.5}
										strokeDasharray="6 4"
										dot={false}
										opacity={0.5}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>

						{/* Spending timeline */}
						<div
							style={{
								background: S.card,
								borderRadius: 12,
								border: `1px solid ${S.border}`,
								padding: "14px 14px 6px",
								marginBottom: 16,
							}}
						>
							<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
								Annual Spending Over Time
							</div>
							<div
								style={{ fontSize: 11, color: S.textMuted, marginBottom: 10 }}
							>
								Shows how costs change: healthcare drops at 65 (Medicare),
								mortgage gone when selling, etc.
							</div>
							<ResponsiveContainer width="100%" height={200}>
								<ComposedChart
									data={spendTimeline}
									margin={{ top: 5, right: 10, bottom: 5, left: 5 }}
								>
									<CartesianGrid strokeDasharray="3 3" stroke={S.border} />
									<XAxis
										dataKey="age"
										tick={{ fontSize: 10, fill: S.textMuted }}
										tickLine={false}
										axisLine={{ stroke: S.border }}
									/>
									<YAxis
										tickFormatter={fmt}
										tick={{ fontSize: 10, fill: S.textMuted }}
										tickLine={false}
										axisLine={false}
										width={50}
									/>
									<Tooltip content={<ChartTip />} />
									<Area
										type="stepAfter"
										dataKey="annual"
										name="Annual Spending"
										fill={S.purple + "33"}
										stroke={S.purple}
										strokeWidth={2}
									/>
									<ReferenceLine
										x={65}
										stroke={S.accent}
										strokeDasharray="3 3"
									/>
								</ComposedChart>
							</ResponsiveContainer>
						</div>

						{/* Lost Decade Returns Reference — always shown */}
						<div
							style={{
								background: S.card,
								borderRadius: 12,
								border: `1px solid ${S.border}`,
								padding: 14,
								marginBottom: 16,
							}}
						>
							<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
								Market Returns (Nominal)
							</div>
							<div style={{ fontSize: 10, fontFamily: S.mono }}>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "auto repeat(11, 1fr)",
										gap: "2px 4px",
										marginBottom: 4,
									}}
								>
									<div style={{ color: S.textMuted }}>Year:</div>
									{["1","2","3","4","5","6","7","8","9","10","11+"].map((y, i) => (
										<div key={i} style={{ textAlign: "right", color: S.textMuted }}>{y}</div>
									))}
									<div style={{ color: S.danger, fontWeight: 600 }}>Lost:</div>
									{[...LOST_DECADE, nomReturn].map((r, i) => (
										<div key={i} style={{
											textAlign: "right",
											color: r < 0 ? S.danger : S.accent,
											fontWeight: r < 0 ? 700 : 500,
										}}>
											{(r * 100).toFixed(0)}%
										</div>
									))}
									<div style={{ color: S.accent, fontWeight: 600 }}>Hist:</div>
									{Array(11).fill(nomReturn).map((r, i) => (
										<div key={i} style={{ textAlign: "right", color: S.accent }}>
											{(r * 100).toFixed(0)}%
										</div>
									))}
								</div>
							</div>
						</div>

												{/* Milestones */}
							<div
								style={{
									background: S.card,
									borderRadius: 12,
									border: `1px solid ${S.border}`,
									padding: 14,
								}}
							>
								<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
									Key Milestones
								</div>
								<div style={{
									display: "grid",
									gridTemplateColumns: "1fr 1fr 1fr",
									gap: 8,
								}}
							>
								{[
									...(housingPlan !== "stay"
										? [
												{
													a: age + transitionYears,
													l: "Move to CC",
													icon: "🌲",
												},
											]
										: []),
									...(retireAge > age
										? [{ a: retireAge, l: "Retire", icon: "🎉" }]
										: []),
									{ a: 59, l: "401K penalty-free", icon: "💼" },
									{ a: 62, l: "Early SS eligible", icon: "📋" },
									{ a: 65, l: "Medicare", icon: "🏥", hl: true },
									{
										a: ssAge,
										l: `SS starts (${fmt(ssAnnual)}/yr)`,
										icon: "💵",
										hl: true,
									},
								]
									.filter((m) => m.a >= age && m.a <= endAge)
									.map((m, i) => {
										const d = getD(Math.round(m.a));
										return (
											<div
												key={i}
												style={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													padding: "6px 10px",
													borderRadius: 8,
													background: S.bg,
												}}
											>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 6,
													}}
												>
													<span style={{ fontSize: 14 }}>{m.icon}</span>
													<div>
														<div
															style={{
																fontSize: 12,
																fontWeight: m.hl ? 600 : 400,
																color: m.hl ? S.accent : S.text,
															}}
														>
															{m.l}
														</div>
														<div style={{ fontSize: 10, color: S.textDim }}>
															Age {m.a} · Spend {fmt(spendAt(m.a, housingPlan))}
															/yr
														</div>
													</div>
												</div>
												<span
													style={{
														fontSize: 12,
														fontWeight: 600,
														fontFamily: S.mono,
														color: (d.balance || 0) > 0 ? S.text : S.danger,
													}}
												>
													{fmt(d.balance || 0)}
												</span>
											</div>
										);
									})}
							</div>
						</div>
					</>
				)}

				{/* ═══ EXPENSES ═══ */}
				{tab === "expenses" && (
					<>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 14,
							}}
						>
							<div>
								<h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
									Monthly Expenses
								</h2>
								<p
									style={{ fontSize: 11, color: S.textMuted, margin: "2px 0" }}
								>
									Expenses tagged with scenario + age range. Greyed-out items
									don't apply to your current plan.
								</p>
							</div>
							<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
								<button
									onClick={() => setShowCatManager(true)}
									style={{
										...btnBase,
										padding: "6px 14px",
										borderRadius: 8,
										border: `1px solid ${S.border}`,
										background: S.card,
										color: S.textMuted,
										fontSize: 12,
									}}
								>
									🏷️ Categories
								</button>
								<div style={{ textAlign: "right" }}>
									<div
										style={{
											fontSize: 22,
											fontWeight: 700,
											fontFamily: S.mono,
											color: S.accent,
										}}
									>
										{fmt(spendAt(age, housingPlan))}
										<span style={{ fontSize: 12, color: S.textMuted }}>
											/yr now
										</span>
									</div>
									<div style={{ fontSize: 11, color: S.textMuted }}>
										{fmt(spend65)}/yr @65 · {fmt(spend70)}/yr @70
									</div>
								</div>
							</div>
						</div>

						{/* Add expense form */}
						<div
							style={{
								padding: 12,
								background: S.card,
								borderRadius: 10,
								border: `1px solid ${S.border}`,
								marginBottom: 14,
							}}
						>
							<div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
								<select
									value={newExpense.cat}
									onChange={(e) =>
										setNewExpense((p) => ({ ...p, cat: e.target.value }))
									}
									style={{ ...inputBase, padding: "7px 8px", fontSize: 12 }}
								>
									{categories.map((c) => (
										<option key={c.id} value={c.id}>
											{c.icon} {c.label}
										</option>
									))}
								</select>
								<input
									placeholder="Description"
									value={newExpense.name}
									onChange={(e) =>
										setNewExpense((p) => ({ ...p, name: e.target.value }))
									}
									onKeyDown={(e) => e.key === "Enter" && addExpense()}
									style={{ ...inputBase, flex: 1, padding: "7px 10px" }}
								/>
								<input
									placeholder="$/mo"
									type="number"
									value={newExpense.amount}
									onChange={(e) =>
										setNewExpense((p) => ({ ...p, amount: e.target.value }))
									}
									onKeyDown={(e) => e.key === "Enter" && addExpense()}
									style={{
										...inputBase,
										width: 80,
										padding: "7px 10px",
										fontFamily: S.mono,
									}}
								/>
								<button
									onClick={addExpense}
									style={{
										...btnBase,
										padding: "7px 14px",
										borderRadius: 6,
										background: S.accent,
										color: "#000",
										fontWeight: 600,
										fontSize: 12,
									}}
								>
									+ Add
								</button>
							</div>
							<div
								style={{
									display: "flex",
									gap: 6,
									alignItems: "center",
									flexWrap: "wrap",
								}}
							>
								<span style={{ fontSize: 11, color: S.textDim }}>
									Applies to:
								</span>
								{["all", "stay", "sell_move", "rent_out"].map((s) => (
									<Chip
										key={s}
										active={newExpense.scenarios.includes(s)}
										color={
											s === "all"
												? S.blue
												: s === "stay"
													? S.danger
													: s === "sell_move"
														? S.accent
														: S.purple
										}
										onClick={() =>
											setNewExpense((p) => {
												const has = p.scenarios.includes(s);
												if (s === "all") return { ...p, scenarios: ["all"] };
												const next = has
													? p.scenarios.filter((x) => x !== s)
													: [...p.scenarios.filter((x) => x !== "all"), s];
												return {
													...p,
													scenarios: next.length ? next : ["all"],
												};
											})
										}
									>
										{SCENARIO_LABELS[s]}
									</Chip>
								))}
								<span style={{ fontSize: 11, color: S.textDim, marginLeft: 8 }}>
									Ages:
								</span>
								<input
									placeholder="from"
									type="number"
									value={newExpense.ageMin}
									onChange={(e) =>
										setNewExpense((p) => ({ ...p, ageMin: e.target.value }))
									}
									style={{
										...inputBase,
										width: 50,
										padding: "4px 6px",
										fontSize: 11,
										fontFamily: S.mono,
									}}
								/>
								<span style={{ fontSize: 11, color: S.textDim }}>–</span>
								<input
									placeholder="to"
									type="number"
									value={newExpense.ageMax}
									onChange={(e) =>
										setNewExpense((p) => ({ ...p, ageMax: e.target.value }))
									}
									style={{
										...inputBase,
										width: 50,
										padding: "4px 6px",
										fontSize: 11,
										fontFamily: S.mono,
									}}
								/>
								<span style={{ fontSize: 11, color: S.textDim, marginLeft: 8 }}>
									Infl:
								</span>
								<input
									placeholder="%"
									type="number"
									step="0.5"
									value={newExpense.inflOverride}
									onChange={(e) =>
										setNewExpense((p) => ({
											...p,
											inflOverride: e.target.value,
										}))
									}
									style={{
										...inputBase,
										width: 52,
										padding: "4px 6px",
										fontSize: 11,
										fontFamily: S.mono,
									}}
								/>
								<span style={{ fontSize: 10, color: S.textDim }}>
									(null=CPI, 0=fixed)
								</span>
							</div>
						</div>

						{/* Expense list */}
						{categories
							.filter((c) => expenses.some((e) => e.cat === c.id))
							.map((cat) => {
								const catExps = expenses.filter((e) => e.cat === cat.id);
								return (
									<div key={cat.id} style={{ marginBottom: 14 }}>
										<div
											style={{
												fontSize: 11,
												fontWeight: 600,
												color: cat.color,
												textTransform: "uppercase",
												letterSpacing: 0.5,
												padding: "4px 0",
												marginBottom: 3,
											}}
										>
											{cat.icon} {cat.label}
											<span
												style={{
													color: S.textDim,
													fontWeight: 400,
													marginLeft: 8,
												}}
											>
												$
												{monthlySpendAtAge(
													catExps,
													age,
													housingPlan,
													age,
													inflation,
												).toLocaleString()}
												/mo active
											</span>
										</div>
										{catExps.map((exp) => {
											const scenarioActive =
												!exp.scenarios ||
												exp.scenarios.includes("all") ||
												exp.scenarios.includes(housingPlan);
											const ageActive =
												(exp.ageMin == null || age >= exp.ageMin) &&
												(exp.ageMax == null || age <= exp.ageMax);
											const active = scenarioActive && ageActive;
											return (
												<div
													key={exp.id}
													style={{
														display: "flex",
														alignItems: "center",
														gap: 6,
														padding: "5px 10px",
														background: S.card,
														borderRadius: 8,
														border: `1px solid ${S.border}`,
														marginBottom: 3,
														opacity: active ? 1 : 0.4,
													}}
												>
													{editingId === exp.id ? (
														<>
															<select
																value={exp.cat}
																onChange={(e) =>
																	updateExpense(exp.id, "cat", e.target.value)
																}
																style={{
																	...inputBase,
																	padding: "3px 6px",
																	fontSize: 11,
																	width: 100,
																}}
															>
																{categories.map((c) => (
																	<option key={c.id} value={c.id}>
																		{c.icon} {c.label}
																	</option>
																))}
															</select>
															<input
																value={exp.name}
																onChange={(e) =>
																	updateExpense(exp.id, "name", e.target.value)
																}
																style={{
																	...inputBase,
																	flex: 1,
																	padding: "3px 8px",
																	fontSize: 12,
																}}
															/>
															<input
																type="number"
																value={exp.amount}
																onChange={(e) =>
																	updateExpense(
																		exp.id,
																		"amount",
																		e.target.value,
																	)
																}
																style={{
																	...inputBase,
																	width: 70,
																	padding: "3px 8px",
																	fontFamily: S.mono,
																	fontSize: 12,
																	textAlign: "right",
																}}
															/>
															<input
																placeholder="%"
																type="number"
																step="0.5"
																value={exp.inflOverride != null ? (exp.inflOverride * 100).toString().replace(/\.?0+$/, "") : ""}
																onChange={(e) =>
																	updateExpense(
																		exp.id,
																		"inflOverride",
																		e.target.value === "" ? null : Number(e.target.value) / 100,
																	)
																}
																style={{
																	...inputBase,
																	width: 52,
																	padding: "3px 6px",
																	fontFamily: S.mono,
																	fontSize: 11,
																}}
															/>
															<div
																style={{
																	display: "flex",
																	gap: 2,
																	alignItems: "center",
																}}
															>
																{["all", "stay", "sell_move", "rent_out"].map(
																	(s) => {
																		const label =
																			s === "all"
																				? "All"
																				: s === "stay"
																					? "BA"
																					: s === "sell_move"
																						? "CC"
																						: "Rent";
																		const color =
																			s === "all"
																				? "#3b82f6"
																				: s === "stay"
																					? "#ef4444"
																					: s === "sell_move"
																						? "#22c55e"
																						: "#8b5cf6";
																		return (
																			<button
																				key={s}
																				type="button"
																				onClick={() => {
																					const curr = exp.scenarios || ["all"];
																					if (s === "all") {
																						updateExpense(exp.id, "scenarios", [
																							"all",
																						]);
																					} else {
																						const hasAll = curr.includes("all");
																						const hasS = curr.includes(s);
																						let next;
																						if (hasS) {
																							next = curr.filter(
																								(x) => x !== s,
																							);
																							if (next.length === 0 && !hasAll)
																								next = ["all"];
																						} else {
																							next = hasAll
																								? [s]
																								: [
																										...curr.filter(
																											(x) => x !== "all",
																										),
																										s,
																									];
																						}
																						updateExpense(
																							exp.id,
																							"scenarios",
																							next,
																						);
																					}
																				}}
																				style={{
																					...btnBase,
																					padding: "1px 6px",
																					borderRadius: 10,
																					fontSize: 9,
																					fontWeight: 500,
																					cursor: "pointer",
																					border: `1.5px solid ${(exp.scenarios || ["all"]).includes(s) ? color : "#2a2d3a"}`,
																					background: (
																						exp.scenarios || ["all"]
																					).includes(s)
																						? color + "22"
																						: "transparent",
																					color: (
																						exp.scenarios || ["all"]
																					).includes(s)
																						? color
																						: "#71717a",
																					transition: "all .15s",
																				}}
																			>
																				{label}
																			</button>
																		);
																	},
																)}
															</div>
															<input
																placeholder="age-"
																type="number"
																value={exp.ageMin ?? ""}
																onChange={(e) =>
																	updateExpense(
																		exp.id,
																		"ageMin",
																		e.target.value,
																	)
																}
																style={{
																	...inputBase,
																	width: 40,
																	padding: "3px 4px",
																	fontFamily: S.mono,
																	fontSize: 10,
																}}
															/>
															<input
																placeholder="-"
																type="number"
																value={exp.ageMax ?? ""}
																onChange={(e) =>
																	updateExpense(
																		exp.id,
																		"ageMax",
																		e.target.value,
																	)
																}
																style={{
																	...inputBase,
																	width: 40,
																	padding: "3px 4px",
																	fontFamily: S.mono,
																	fontSize: 10,
																}}
															/>
															<button
																onClick={() => setEditingId(null)}
																style={{
																	...btnBase,
																	padding: "3px 8px",
																	borderRadius: 4,
																	background: S.accent,
																	color: "#000",
																	fontSize: 11,
																}}
															>
																✓
															</button>
														</>
													) : (
														<>
															<span style={{ flex: 1, fontSize: 12 }}>
																{exp.name}
															</span>
															{exp.scenarios &&
																!exp.scenarios.includes("all") &&
																exp.scenarios.map((s) => (
																	<Tag
																		key={s}
																		color={
																			s === "stay"
																				? S.danger
																				: s === "sell_move"
																					? S.accent
																					: S.purple
																		}
																	>
																		{s === "stay"
																			? "BA"
																			: s === "sell_move"
																				? "Sell+CC"
																				: "Rent+CC"}
																	</Tag>
																))}
															{(exp.ageMin != null || exp.ageMax != null) && (
																<Tag color={S.blue}>
																	{exp.ageMin ?? ""}–{exp.ageMax ?? ""}
																</Tag>
															)}
															<span
																style={{
																	fontSize: 12,
																	fontWeight: 600,
																	fontFamily: S.mono,
																}}
															>
																${exp.amount.toLocaleString()}
															</span>
															<button
																onClick={() => setEditingId(exp.id)}
																style={{
																	...btnBase,
																	padding: "2px 6px",
																	borderRadius: 4,
																	border: `1px solid ${S.border}`,
																	background: "transparent",
																	color: S.textMuted,
																	fontSize: 10,
																}}
															>
																edit
															</button>
															<button
																onClick={() => removeExpense(exp.id)}
																style={{
																	...btnBase,
																	padding: "2px 6px",
																	borderRadius: 4,
																	border: `1px solid ${S.border}`,
																	background: "transparent",
																	color: S.danger,
																	fontSize: 10,
																}}
															>
																✕
															</button>
														</>
													)}
												</div>
											);
										})}
									</div>
								);
							})}
					</>
				)}

				{/* ═══ HOUSING ═══ */}
				{tab === "housing" && (
					<>
						<h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>
							Housing Plan
						</h2>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr 1fr",
								gap: 10,
								marginBottom: 20,
							}}
						>
							{[
								{
									id: "stay",
									label: "Stay in Bay Area",
									desc: "Keep house + mortgage",
									icon: "🏙️",
									color: S.danger,
								},
								{
									id: "sell_move",
									label: "Sell + Move to CC",
									desc: "Sell house + Byers, buy CC",
									icon: "🌲",
									color: S.accent,
								},
								{
									id: "rent_out",
									label: "Rent SJ + Move CC",
									desc: "Keep as rental, sell Byers",
									icon: "🏠",
									color: S.blue,
								},
							].map((o) => (
								<button
									key={o.id}
									onClick={() => setHousingPlan(o.id)}
									style={{
										...btnBase,
										padding: "14px 16px",
										borderRadius: 12,
										textAlign: "left",
										border: `2px solid ${housingPlan === o.id ? o.color : S.border}`,
										background: housingPlan === o.id ? o.color + "15" : S.card,
									}}
								>
									<div style={{ fontSize: 18, marginBottom: 4 }}>{o.icon}</div>
									<div
										style={{
											fontSize: 13,
											fontWeight: 600,
											color: housingPlan === o.id ? o.color : S.text,
										}}
									>
										{o.label}
									</div>
									<div
										style={{ fontSize: 11, color: S.textMuted, marginTop: 3 }}
									>
										{o.desc}
									</div>
								</button>
							))}
						</div>

						<div style={{ padding: 14, background: S.bg, borderRadius: 8 }}>
							<p
								style={{
									fontSize: 12,
									color: S.textMuted,
									lineHeight: 1.6,
									marginBottom: 10,
								}}
							>
								<strong>Housing Plan</strong> — select your path in the dropdown
								above. Each scenario changes costs and projections differently.
							</p>
							<div style={{ display: "grid", gap: 8 }}>
								<div>
									<span
										style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}
									>
										🏙️ Stay in Bay Area
									</span>
									<p
										style={{
											fontSize: 11,
											color: S.textMuted,
											margin: "3px 0 0",
										}}
									>
										Keep your house and mortgage. Higher monthly costs but no
										transition. Property taxes at current assessed value.
									</p>
								</div>
								<div>
									<span
										style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}
									>
										🌲 Sell + Move to CC
									</span>
									<p
										style={{
											fontSize: 11,
											color: S.textMuted,
											margin: "3px 0 0",
										}}
									>
										Sell SJ house + Byers property, buy in Crescent City. Lower
										ongoing costs but transition gap (you'll need temporary
										housing). Net proceeds shown in the calculator below.
									</p>
								</div>
								<div>
									<span
										style={{ fontSize: 12, fontWeight: 600, color: "#3b82f6" }}
									>
										🏠 Rent SJ + Move CC
									</span>
									<p
										style={{
											fontSize: 11,
											color: S.textMuted,
											margin: "3px 0 0",
										}}
									>
										Keep SJ house as rental property, sell Byers, buy in CC.
										Rental income offsets costs but adds landlord
										responsibilities and vacancy risk.
									</p>
								</div>
							</div>
						</div>
					</>
				)}

				{/* ═══ SIMULATION ═══ */}
				{tab === "simulation" && (
					<>
						<h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>
							Simulation
						</h2>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: 16,
							}}
						>
							<div
								style={{
									background: S.card,
									borderRadius: 12,
									border: `1px solid ${S.border}`,
									padding: 18,
								}}
							>
								<div
									style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}
								>
									👤 Profile
								</div>
								<SliderRow
									label="Current Age"
									value={age}
									onChange={setAge}
									min={40}
									max={65}
									step={1}
									format={(v) => `${v}`}
								/>
								<SliderRow
									label="Retirement Age"
									value={retireAge}
									onChange={setRetireAge}
									min={age}
									max={70}
									step={1}
									format={(v) => (v === age ? `${v} (now)` : `${v}`)}
								/>
								<SliderRow
									label="Portfolio"
									value={portfolio}
									onChange={setPortfolio}
									min={1e6}
									max={1e7}
									step={100000}
									format={fmt}
								/>
								<SliderRow
									label="SS Start Age"
									value={ssAge}
									onChange={setSsAge}
									min={62}
									max={70}
									step={1}
									format={(v) => `${v}`}
								/>
								<SliderRow
									label="SS Annual"
									value={ssAnnual}
									onChange={setSsAnnual}
									min={0}
									max={60000}
									step={2000}
									format={fmt}
								/>
							</div>
							<div
								style={{
									background: S.card,
									borderRadius: 12,
									border: `1px solid ${S.border}`,
									padding: 18,
								}}
							>
								<div
									style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}
								>
									📈 Market
								</div>
								<div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
									<Chip
										active={marketMode === "historical"}
										onClick={() => setMarketMode("historical")}
										color={S.accent}
									>
										📈 Historical
									</Chip>
									<Chip
										active={marketMode === "lost_decade"}
										onClick={() => setMarketMode("lost_decade")}
										color={S.danger}
									>
										📉 Lost Decade
									</Chip>
								</div>
								<div style={{ marginBottom: 12, fontSize: 10, fontFamily: S.mono }}>
									<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
										{[{ label: "Year", years: ["1","2","3","4","5","6","7","8","9","10","11+"] }].map((row) => (
											row.years.map((y, i) => (
												<div key={i} style={{ width: 28, textAlign: "right", color: S.textMuted }}>{y}</div>
											))
										))}
									</div>
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, marginBottom: 2 }}>
										<span style={{ color: marketMode === "lost_decade" ? S.danger : S.textMuted, width: 28 }}>{marketMode === "lost_decade" ? "Lost" : "Avg"}:</span>
										{(marketMode === "lost_decade" ? [...LOST_DECADE, null] : Array(11).fill(null)).map((r, i) => (
											<div key={i} style={{ width: 28, textAlign: "right", color: r !== null ? (r < 0 ? S.danger : S.accent) : S.accent, fontWeight: r !== null && r < 0 ? 700 : 500 }}>
												{r !== null ? `${(r * 100).toFixed(0)}%` : `${(nomReturn * 100).toFixed(0)}%`}
											</div>
										))}
									</div>
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
										<span style={{ color: marketMode === "historical" ? S.accent : S.textMuted, width: 28 }}>Hist:</span>
										{Array(11).fill(nomReturn).map((r, i) => (
											<div key={i} style={{ width: 28, textAlign: "right", color: S.accent, opacity: marketMode === "historical" ? 1 : 0.4 }}>{r ? `${(r * 100).toFixed(0)}%` : "—"}</div>
										))}
									</div>
								</div>
								<SliderRow
									label="Nominal Return"
									value={nomReturn}
									onChange={setNomReturn}
									min={0.04}
									max={0.12}
									step={0.005}
									format={(v) => `${(v * 100).toFixed(1)}%`}
								/>
								<SliderRow
									label="Inflation"
									value={inflation}
									onChange={setInflation}
									min={0.01}
									max={0.06}
									step={0.005}
									format={(v) => `${(v * 100).toFixed(1)}%`}
								/>
								<div
									style={{
										padding: 10,
										background: S.bg,
										borderRadius: 8,
										marginTop: 8,
									}}
								>
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<span style={{ fontSize: 11, color: S.textMuted }}>
											Real Return
										</span>
										<span
											style={{ fontSize: 13, fontWeight: 700, color: S.accent }}
										>
											{(realRet * 100).toFixed(1)}%
										</span>
									</div>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											marginTop: 4,
										}}
									>
										<span style={{ fontSize: 11, color: S.textMuted }}>
											Growth on {fmt(projections.startPort)}
										</span>
										<span
											style={{ fontSize: 13, fontWeight: 700, color: S.blue }}
										>
											{fmt(Math.round(projections.startPort * realRet))}/yr
										</span>
									</div>
								</div>
							</div>
						</div>
					
						<div
							style={{
								background: S.card,
								borderRadius: 12,
								border: `1px solid ${S.border}`,
								padding: 18,
								marginTop: 16,
							}}
						>
							<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🏘️ Property Values</div>
							<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
								<SliderRow label="SJ House Value" value={houseValue} onChange={setHouseValue} min={1e6} max={3e6} step={50000} format={fmt} />
								<SliderRow label="Mortgage Owed" value={mortgageOwed} onChange={setMortgageOwed} min={0} max={1e6} step={25000} format={fmt} />
								<SliderRow label="Byers Value" value={byersValue} onChange={setByersValue} min={200000} max={1e6} step={25000} format={fmt} />
							</div>
							{housingPlan !== "stay" && (
								<div style={{ background: S.bg, borderRadius: 8, padding: 14, marginBottom: 16 }}>
									<div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>🌲 Crescent City</div>
									<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
										<SliderRow label="CC Home Price" value={ccHomeCost} onChange={setCcHomeCost} min={200000} max={1500000} step={25000} format={fmt} />
										{housingPlan === "sell_move" && <SliderRow label="Transition Years" value={transitionYears} onChange={setTransitionYears} min={0} max={3} step={1} format={(v) => `${v} yr`} />}
									</div>
									<div style={{ display: "grid", gridTemplateColumns: housingPlan === "sell_move" ? "repeat(4, 1fr)" : "repeat(3, 1fr)", gap: 8, marginTop: 10, padding: 10, background: S.card, borderRadius: 6 }}>
										{(housingPlan === "sell_move" ? [
											{ l: "House Net", v: fmt(houseNet), c: S.accent },
											{ l: "Byers Net", v: fmt(byersNet), c: S.accent },
											{ l: "CC Buy", v: `-${fmt(ccHomeCost)}`, c: S.danger },
											{ l: "Proceeds to Portfolio", v: fmt(totalRENet - ccHomeCost), c: totalRENet - ccHomeCost >= 0 ? S.accent : S.danger },
										] : [
											{ l: "Byers Net", v: fmt(byersNet), c: S.accent },
											{ l: "CC Buy", v: `-${fmt(ccHomeCost)}`, c: S.danger },
											{ l: "From Portfolio", v: fmt(byersNet - ccHomeCost), c: byersNet - ccHomeCost >= 0 ? S.accent : S.danger },
										]).map((x, i) => (
											<div key={i} style={{ textAlign: "center" }}>
												<div style={{ fontSize: 10, color: S.textMuted }}>{x.l}</div>
												<div style={{ fontSize: 15, fontWeight: 700, color: x.c }}>{x.v}</div>
											</div>
										))}
									</div>
								</div>
							)}
							{housingPlan === "rent_out" && (
								<div style={{ background: S.bg, borderRadius: 8, padding: 14 }}>
									<div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>🏠 SJ Rental P&L</div>
									<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
										<SliderRow label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} min={3000} max={7000} step={100} format={(v) => `$${v.toLocaleString()}/mo`} />
										<SliderRow label="Monthly Mortgage" value={monthlyMortgage} onChange={setMonthlyMortgage} min={1500} max={4000} step={100} format={(v) => `$${v.toLocaleString()}/mo`} />
										<SliderRow label="Annual Property Tax" value={annualPropTax} onChange={setAnnualPropTax} min={5000} max={25000} step={500} format={(v) => `${fmt(v)}/yr`} />
										<SliderRow label="Ins+Maint+Mgmt" value={annualLandlordCosts} onChange={setAnnualLandlordCosts} min={5000} max={25000} step={500} format={(v) => `${fmt(v)}/yr`} />
									</div>
									<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10, padding: 10, background: S.card, borderRadius: 6 }}>
										{[
											{ l: "Gross Rent", v: fmt(grossRent), c: S.accent },
											{ l: "Expenses", v: fmt(landlordExp), c: S.danger },
											{ l: "Net Flow", v: `${netRental >= 0 ? "+" : ""}${fmt(netRental)}/yr`, c: netRental >= 0 ? S.accent : S.danger },
										].map((x, i) => (
											<div key={i} style={{ textAlign: "center" }}>
												<div style={{ fontSize: 10, color: S.textMuted }}>{x.l}</div>
												<div style={{ fontSize: 16, fontWeight: 700, color: x.c }}>{x.v}</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
</>
				)}
			</div>
			<div
				style={{
					padding: "14px 28px",
					borderTop: `1px solid ${S.border}`,
					marginTop: 20,
					fontSize: 10,
					color: S.textDim,
					textAlign: "center",
				}}
			>
				Data {serverOk ? "synced to server" : "saved locally (offline)"} · Not
				financial advice
			</div>
		</div>
	);
}
