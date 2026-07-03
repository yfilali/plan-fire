import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { Button } from "../ui.jsx";
import Brand from "../shell/Brand.jsx";

// Sticky translucent top navbar for the marketing site. Middle section links
// collapse below ~720px; the CTAs stay put so signup is always one tap away.
const LINKS = [
	{ label: "Features", href: "#features" },
	{ label: "FAQ", href: "#faq" },
];

export default function Nav() {
	const S = useTheme();
	const { user } = useAuth();

	return (
		<nav
			style={{
				position: "sticky",
				top: 0,
				zIndex: 50,
				height: 64,
				background: `${S.surface}e6`,
				backdropFilter: "saturate(180%) blur(10px)",
				WebkitBackdropFilter: "saturate(180%) blur(10px)",
				borderBottom: `1px solid ${S.border}`,
			}}
		>
			<style>{`
				@media (max-width: 720px) {
					.fly-nav-links { display: none !important; }
				}
			`}</style>
			<div
				style={{
					height: "100%",
					maxWidth: 1120,
					margin: "0 auto",
					padding: "0 clamp(20px,5vw,40px)",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 20,
				}}
			>
				<a href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
					<Brand />
				</a>

				<div
					className="fly-nav-links"
					style={{
						display: "flex",
						alignItems: "center",
						gap: 30,
					}}
				>
					{LINKS.map((l) => (
						<a
							key={l.href}
							href={l.href}
							style={{
								fontSize: 14,
								fontWeight: 550,
								color: S.textMuted,
								textDecoration: "none",
								transition: "color .14s ease",
							}}
							onMouseEnter={(e) => (e.currentTarget.style.color = S.text)}
							onMouseLeave={(e) => (e.currentTarget.style.color = S.textMuted)}
						>
							{l.label}
						</a>
					))}
				</div>

				<div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
					{user ? (
						<a href="/app" style={{ textDecoration: "none" }}>
							<Button variant="primary">Open app</Button>
						</a>
					) : (
						<>
							<a
								href="/login"
								style={{
									fontSize: 14,
									fontWeight: 550,
									color: S.textMuted,
									textDecoration: "none",
									padding: "8px 6px",
									transition: "color .14s ease",
								}}
								onMouseEnter={(e) => (e.currentTarget.style.color = S.text)}
								onMouseLeave={(e) => (e.currentTarget.style.color = S.textMuted)}
							>
								Log in
							</a>
							<a href="/signup" style={{ textDecoration: "none" }}>
								<Button variant="primary">Get started</Button>
							</a>
						</>
					)}
				</div>
			</div>
		</nav>
	);
}
