import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";

const QA = [
	{
		q: "Is PlanFire free?",
		a: "Completely. PlanFire is free and open source — every feature, including Monte Carlo, the AI Co-pilot, and the Time Machine, is unlocked for everyone. No paid tier, no upsell.",
	},
	{
		q: "Is my financial data private?",
		a: "Yes. Your figures are stored on your account and mirrored to your browser. We never sell or share your financial data.",
	},
	{
		q: "What is FIRE?",
		a: "Financial Independence, Retire Early — the point where your investments cover your living expenses, so work becomes optional.",
	},
	{
		q: "Do I need to link my bank accounts?",
		a: "No. You enter the numbers yourself — nothing is auto-connected.",
	},
	{
		q: "Can I try it without signing up?",
		a: "Yes — choose ‘Continue as guest’. Your work is saved locally and carried into your account when you sign up.",
	},
	{
		q: "Is PlanFire open source?",
		a: "Yes — the whole project is open source. You can self-host it, read the code, and contribute.",
	},
];

function Row({ item, open, onToggle, isLast, S }) {
	return (
		<div style={{ borderBottom: isLast ? "none" : `1px solid ${S.border}` }}>
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={open}
				style={{
					width: "100%",
					background: "none",
					border: "none",
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 16,
					textAlign: "left",
					padding: "20px 4px",
					font: "inherit",
					color: "inherit",
				}}
			>
				<span
					style={{
						fontSize: 16.5,
						fontWeight: 600,
						color: S.text,
						lineHeight: 1.4,
					}}
				>
					{item.q}
				</span>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
					style={{
						flexShrink: 0,
						color: S.textMuted,
						transform: open ? "rotate(180deg)" : "rotate(0deg)",
						transition: "transform 0.22s ease",
					}}
				>
					<path
						d="M6 9l6 6 6-6"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>
			<div
				style={{
					display: "grid",
					gridTemplateRows: open ? "1fr" : "0fr",
					transition: "grid-template-rows 0.24s ease",
				}}
			>
				<div style={{ overflow: "hidden" }}>
					<p
						style={{
							margin: 0,
							padding: "0 4px 22px",
							fontSize: 15,
							lineHeight: 1.65,
							color: S.textMuted,
							maxWidth: 640,
						}}
					>
						{item.a}
					</p>
				</div>
			</div>
		</div>
	);
}

export default function FAQ() {
	const S = useTheme();
	const [openIndex, setOpenIndex] = useState(0);

	return (
		<section
			id="faq"
			style={{
				scrollMarginTop: 80,
				padding: "clamp(56px,9vw,100px) 0",
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
						margin: "0 0 clamp(28px,4vw,44px)",
						textAlign: "center",
						fontSize: "clamp(28px,4.5vw,42px)",
						fontWeight: 800,
						letterSpacing: "-0.5px",
						color: S.text,
					}}
				>
					Frequently asked questions
				</h2>

				<div
					style={{
						maxWidth: 760,
						margin: "0 auto",
						background: S.card,
						border: `1px solid ${S.border}`,
						borderRadius: 18,
						boxShadow: S.shadowSm,
						padding: "8px clamp(16px,3vw,28px)",
					}}
				>
					{QA.map((item, i) => (
						<Row
							key={item.q}
							item={item}
							open={openIndex === i}
							onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
							isLast={i === QA.length - 1}
							S={S}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
