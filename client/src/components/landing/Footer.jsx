import { useTheme } from "../../theme/ThemeProvider.jsx";
import Brand from "../shell/Brand.jsx";

// Minimal 16px icon set, stroke-based (feather-style) except GitHub which
// uses its official filled mark. All inherit color from the link's text.
function IconZap(props) {
	return (
		<svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" {...props}>
			<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
		</svg>
	);
}
function IconHelpCircle(props) {
	return (
		<svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
			<circle cx="12" cy="12" r="10" />
			<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4" />
			<line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
	);
}
function IconLock(props) {
	return (
		<svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
			<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" />
		</svg>
	);
}
function IconFileText(props) {
	return (
		<svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<polyline points="14 2 14 8 20 8" />
			<line x1="16" y1="13" x2="8" y2="13" />
			<line x1="16" y1="17" x2="8" y2="17" />
		</svg>
	);
}
function IconGithub(props) {
	return (
		<svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" {...props}>
			<path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.593 1.028 2.686 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
		</svg>
	);
}
function IconAtSign(props) {
	return (
		<svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
			<circle cx="12" cy="12" r="4" />
			<path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-5.5 8.28" />
		</svg>
	);
}

const LINKS = [
	{ label: "Features", href: "#features", icon: IconZap },
	{ label: "FAQ", href: "#faq", icon: IconHelpCircle },
	{ label: "Privacy", href: "/privacy", icon: IconLock },
	{ label: "Terms", href: "/terms", icon: IconFileText },
	{ label: "GitHub", href: "https://github.com/yfilali/plan-fire", external: true, icon: IconGithub },
	{ label: "Threads", href: "https://www.threads.net/@yacfilali", external: true, icon: IconAtSign },
];

function FooterLink({ link, S }) {
	const Icon = link.icon;
	return (
		<a
			href={link.href}
			target={link.external ? "_blank" : undefined}
			rel={link.external ? "noopener noreferrer" : undefined}
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 7,
				color: S.textMuted,
				textDecoration: "none",
				fontSize: 14.5,
				lineHeight: 1.9,
				transition: "color 0.15s ease",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.color = S.text;
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.color = S.textMuted;
			}}
		>
			<Icon style={{ flexShrink: 0 }} />
			{link.label}
		</a>
	);
}

export default function Footer() {
	const S = useTheme();
	const year = new Date().getFullYear();

	return (
		<footer
			style={{
				width: "100%",
				background: S.bgElev,
				borderTop: `1px solid ${S.border}`,
			}}
		>
			<div
				style={{
					maxWidth: 1120,
					margin: "0 auto",
					padding: "clamp(48px,7vw,72px) clamp(20px,5vw,40px)",
				}}
			>
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "space-between",
						gap: "clamp(32px,6vw,72px)",
					}}
				>
					<div style={{ maxWidth: 300 }}>
						<Brand />
						<p
							style={{
								margin: "18px 0 6px",
								fontSize: 15,
								color: S.textMuted,
								lineHeight: 1.5,
							}}
						>
							Plan your escape.
						</p>
						<p
							style={{
								margin: 0,
								fontSize: 12.5,
								color: S.textDim,
								lineHeight: 1.5,
							}}
						>
							We never sell your financial data.
						</p>
					</div>

					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							alignContent: "flex-start",
							columnGap: 28,
							rowGap: 10,
							maxWidth: 360,
						}}
					>
						{LINKS.map((link) => (
							<FooterLink key={link.label} link={link} S={S} />
						))}
					</div>
				</div>

				<div
					style={{
						marginTop: "clamp(36px,5vw,56px)",
						paddingTop: 22,
						borderTop: `1px solid ${S.border}`,
						display: "flex",
						flexWrap: "wrap",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 12,
					}}
				>
					<span style={{ fontSize: 13, color: S.textMuted }}>© {year} PlanFIRE</span>
					<span style={{ fontSize: 12.5, color: S.textDim }}>
						Estimates, not financial advice. Your numbers, your call.
					</span>
				</div>
			</div>
		</footer>
	);
}
