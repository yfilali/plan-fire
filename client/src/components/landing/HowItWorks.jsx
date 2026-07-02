import { useTheme } from "../../theme/ThemeProvider.jsx";

const STEPS = [
	{
		n: 1,
		title: "Add your numbers",
		line: "Income, spending, savings, accounts — the raw material of your plan.",
	},
	{
		n: 2,
		title: "Model scenarios",
		line: "Retirement age, housing, market assumptions. Tweak and compare freely.",
	},
	{
		n: 3,
		title: "See your FIRE date",
		line: "The exact date you're free — with success odds and years of runway.",
	},
];

export default function HowItWorks() {
	const S = useTheme();
	return (
		<section
			style={{
				padding: "clamp(56px,9vw,100px) 0",
				background: S.bg,
			}}
		>
			<div
				style={{
					maxWidth: 1120,
					margin: "0 auto",
					padding: "0 clamp(20px,5vw,40px)",
				}}
			>
				<h2
					style={{
						fontSize: "clamp(28px,4.5vw,44px)",
						fontWeight: 750,
						color: S.text,
						letterSpacing: "-0.5px",
						textAlign: "center",
						marginBottom: "clamp(36px,6vw,60px)",
					}}
				>
					From numbers to a plan in minutes
				</h2>

				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						gap: "clamp(24px,4vw,48px)",
					}}
				>
					{STEPS.map((s) => (
						<div
							key={s.n}
							style={{
								flex: "1 1 260px",
								maxWidth: 320,
								textAlign: "center",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
							}}
						>
							<div
								style={{
									width: 52,
									height: 52,
									borderRadius: "50%",
									background: S.accentGradient,
									color: "#fff",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: 20,
									fontWeight: 750,
									fontFamily: S.mono,
									boxShadow: S.shadowSm,
									marginBottom: 18,
								}}
							>
								{s.n}
							</div>
							<div
								style={{
									fontSize: 17,
									fontWeight: 700,
									color: S.text,
									marginBottom: 8,
								}}
							>
								{s.title}
							</div>
							<p
								style={{
									fontSize: 14,
									lineHeight: 1.6,
									color: S.textMuted,
									maxWidth: 260,
								}}
							>
								{s.line}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
