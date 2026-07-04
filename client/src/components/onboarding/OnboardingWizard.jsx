import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { Card, Button, Segmented } from "../ui.jsx";
import Icon from "../Icon.jsx";
import SliderRow from "../SliderRow.jsx";
import { fmt } from "../../engine.js";

const SS_AGES = [62, 65, 67, 68, 70];

const STEPS = ["welcome", "age", "savings", "income", "review"];

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

// Full-screen, one-time guided setup for a brand-new account. Writes straight
// through the same planner setters the rest of the app uses (setAge,
// updateAsset, ...), so every step is already "live" — Review just reflects
// real projected state rather than a separate draft copy.
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

	const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
	const back = () => setStep((s) => Math.max(s - 1, 0));

	const longevity = runsOut ? `Runs out around age ${runsOut.age}` : `Lasts through age ${endAge}+`;

	const stepContent = () => {
		switch (STEPS[step]) {
			case "welcome":
				return (
					<>
						<div
							style={{
								width: 52,
								height: 52,
								borderRadius: 16,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								background: S.accentGradient,
								color: "#fff",
								marginBottom: 18,
							}}
						>
							<Icon name="sparkle" size={24} />
						</div>
						<h1 style={{ fontSize: 22, fontWeight: 750, color: S.text, marginBottom: 8 }}>
							Let's set up your plan
						</h1>
						<p style={{ fontSize: 13.5, color: S.textMuted, lineHeight: 1.55, marginBottom: 6 }}>
							Four quick questions — under a minute — and you'll have a real
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
							<span>{longevity} in your baseline scenario.</span>
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
							<Button variant="primary" onClick={next}>
								{step === 0 ? "Let's get started" : "Continue"}
							</Button>
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}
