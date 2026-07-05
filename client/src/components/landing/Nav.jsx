import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { Button, IconButton } from "../ui.jsx";
import Brand from "../shell/Brand.jsx";

// Sticky translucent top navbar for the marketing site. Middle section links
// collapse below ~720px into a hamburger menu so they stay reachable on
// mobile instead of just disappearing; the CTA stays a single button so the
// bar never has to squeeze a Log in link in alongside it.
const LINKS = [
	{ label: "Features", href: "#features" },
	{ label: "FAQ", href: "#faq" },
];

const MenuIcon = (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
		<path d="M3 6h18M3 12h18M3 18h18" />
	</svg>
);

export default function Nav() {
	const S = useTheme();
	const { user } = useAuth();
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		if (!open) return;
		const onDoc = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open]);

	return (
		<nav
			className="site-nav"
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
				.fly-nav-toggle { display: none; }
				@media (max-width: 720px) {
					.fly-nav-links { display: none !important; }
					.fly-nav-toggle { display: inline-flex !important; }
				}
			`}</style>
			<div
				style={{
					height: "100%",
					maxWidth: 1120,
					margin: "0 auto",
					padding: "0 clamp(16px,5vw,40px)",
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
					<div className="fly-nav-toggle" style={{ position: "relative" }} ref={ref}>
						<IconButton title="Menu" active={open} onClick={() => setOpen((o) => !o)}>
							{MenuIcon}
						</IconButton>
						{open && (
							<div
								className="fade-in"
								style={{
									position: "absolute",
									top: "calc(100% + 8px)",
									right: 0,
									minWidth: 160,
									background: S.surface,
									border: `1px solid ${S.border}`,
									borderRadius: 12,
									boxShadow: S.shadow,
									padding: 6,
									zIndex: 60,
								}}
							>
								{LINKS.map((l) => (
									<a
										key={l.href}
										href={l.href}
										onClick={() => setOpen(false)}
										style={{
											display: "block",
											padding: "9px 12px",
											borderRadius: 8,
											fontSize: 14,
											fontWeight: 550,
											color: S.text,
											textDecoration: "none",
										}}
									>
										{l.label}
									</a>
								))}
							</div>
						)}
					</div>

					<a href={user ? "/app" : "/login"} style={{ textDecoration: "none" }}>
						<Button variant="primary">Open app</Button>
					</a>
				</div>
			</div>
		</nav>
	);
}
