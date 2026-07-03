import Brand from "../shell/Brand.jsx";
import { useTheme } from "../../theme/ThemeProvider.jsx";

// Standalone /terms route. Inline styles only, theme-token driven.
export default function TermsPage() {
	const S = useTheme();

	const page = {
		background: S.bg,
		color: S.text,
		minHeight: "100vh",
		fontFamily: S.font,
	};
	const col = {
		maxWidth: 760,
		margin: "0 auto",
		padding: "48px clamp(20px,5vw,40px) 80px",
	};
	const headerRow = {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 16,
		flexWrap: "wrap",
		marginBottom: 40,
	};
	const backLink = {
		color: S.textMuted,
		textDecoration: "none",
		fontSize: 14,
		fontWeight: 600,
	};
	const title = {
		fontSize: "clamp(30px,6vw,46px)",
		fontWeight: 800,
		letterSpacing: "-1px",
		margin: "0 0 8px",
		color: S.text,
	};
	const updated = {
		color: S.textDim,
		fontSize: 14,
		margin: "0 0 24px",
	};
	const h2 = {
		fontSize: 20,
		fontWeight: 700,
		letterSpacing: "-0.3px",
		color: S.text,
		margin: "36px 0 10px",
	};
	const p = {
		color: S.textMuted,
		fontSize: 15.5,
		lineHeight: 1.65,
		margin: "0 0 12px",
	};
	const li = { ...p, margin: "0 0 8px" };
	const ul = { margin: "0 0 12px", paddingLeft: 22 };
	const link = { color: S.accent, textDecoration: "none", fontWeight: 600 };
	const disclaimer = {
		background: S.accentSoft,
		border: `1px solid ${S.borderStrong}`,
		borderRadius: 14,
		padding: "18px 20px",
		margin: "8px 0 12px",
	};
	const disclaimerText = {
		color: S.text,
		fontSize: 15.5,
		lineHeight: 1.65,
		fontWeight: 600,
		margin: 0,
	};

	return (
		<div style={page}>
			<div style={col}>
				<div style={headerRow}>
					<a href="/" style={{ textDecoration: "none" }}>
						<Brand />
					</a>
					<a href="/" style={backLink}>
						← Back to home
					</a>
				</div>

				<h1 style={title}>Terms of Service</h1>
				<p style={updated}>Last updated: July 2, 2026</p>

				<h2 style={h2}>Acceptance of terms</h2>
				<p style={p}>
					By creating an account or using PlanFIRE ("the service"), you agree
					to these Terms of Service. If you do not agree, please do not use
					PlanFIRE.
				</p>

				<h2 style={h2}>What PlanFIRE is</h2>
				<p style={p}>
					PlanFIRE is a financial-independence planning and modeling{" "}
					<strong>tool</strong>. It lets you enter your own numbers and
					explore projections, runway, plan comparisons, and market
					scenarios. It is software that helps you think — not an advisor.
				</p>

				<h2 style={h2}>Important disclaimer</h2>
				<div style={disclaimer}>
					<p style={disclaimerText}>
						PlanFIRE is for informational and educational purposes only and
						is NOT financial, investment, tax, or legal advice. All
						projections are estimates based on the assumptions you provide
						— they are not guarantees of future results. Always consult a
						qualified professional before making financial decisions.
					</p>
				</div>

				<h2 style={h2}>Accounts &amp; security</h2>
				<p style={p}>
					You are responsible for keeping your login credentials safe and
					for all activity under your account. Please provide accurate
					information and notify us of any unauthorized use.
				</p>

				<h2 style={h2}>Free &amp; open source</h2>
				<p style={p}>
					PlanFIRE is free to use and open source. Every feature is
					available to everyone at no cost — there are no paid tiers,
					subscriptions, or in-app purchases.
				</p>

				<h2 style={h2}>Acceptable use</h2>
				<p style={p}>You agree not to:</p>
				<ul style={ul}>
					<li style={li}>
						Misuse, disrupt, or attempt to gain unauthorized access to the
						service or other users' data.
					</li>
					<li style={li}>
						Reverse-engineer, scrape, or resell the service without
						permission.
					</li>
					<li style={li}>
						Use PlanFIRE for unlawful purposes or in violation of these
						terms.
					</li>
				</ul>

				<h2 style={h2}>Intellectual property</h2>
				<p style={p}>
					PlanFIRE, including its software, design, and branding, is owned by
					us and protected by applicable law. The financial data you enter
					remains yours; you grant us only the limited rights needed to
					operate the service for you.
				</p>

				<h2 style={h2}>Disclaimers &amp; limitation of liability</h2>
				<p style={p}>
					The service is provided "as is" and "as available" without
					warranties of any kind. To the fullest extent permitted by law,
					PlanFIRE and its operators are not liable for any indirect,
					incidental, or consequential damages, or for any financial
					decisions or losses arising from your use of the service or
					reliance on its projections.
				</p>

				<h2 style={h2}>Changes to the service &amp; terms</h2>
				<p style={p}>
					We may modify, add, or remove features, and we may update these
					terms from time to time. When we make material changes, we'll
					update the "last updated" date above. Continued use after changes
					means you accept the updated terms.
				</p>

				<h2 style={h2}>Governing law</h2>
				<p style={p}>
					These terms are governed by the laws of the State of Delaware,
					United States, without regard to its conflict-of-laws rules.
				</p>

				<h2 style={h2}>Contact</h2>
				<p style={p}>
					Questions about these terms? Reach us at{" "}
					<a href="mailto:support@planfire.dev" style={link}>
						support@planfire.dev
					</a>
					.
				</p>
			</div>
		</div>
	);
}
