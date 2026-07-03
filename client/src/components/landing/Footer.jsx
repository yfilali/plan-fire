import { useTheme } from "../../theme/ThemeProvider.jsx";
import Brand from "../shell/Brand.jsx";

const COLUMNS = [
	{
		title: "Product",
		links: [
			{ label: "Features", href: "#features" },
			{ label: "FAQ", href: "#faq" },
		],
	},
	{
		title: "Company",
		links: [
			{ label: "Privacy", href: "/privacy" },
			{ label: "Terms", href: "/terms" },
		],
	},
];

function FooterLink({ link, S }) {
	return (
		<a
			href={link.href}
			style={{
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
							gap: "clamp(40px,8vw,88px)",
						}}
					>
						{COLUMNS.map((col) => (
							<div key={col.title}>
								<div
									style={{
										fontSize: 12,
										fontWeight: 700,
										letterSpacing: 0.6,
										textTransform: "uppercase",
										color: S.textDim,
										marginBottom: 12,
									}}
								>
									{col.title}
								</div>
								<div style={{ display: "flex", flexDirection: "column" }}>
									{col.links.map((link) => (
										<FooterLink key={link.label} link={link} S={S} />
									))}
								</div>
							</div>
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
					<span style={{ fontSize: 13, color: S.textMuted }}>© {year} PlanFire</span>
					<span style={{ fontSize: 12.5, color: S.textDim }}>
						Estimates, not financial advice. Your numbers, your call.
					</span>
				</div>
			</div>
		</footer>
	);
}
