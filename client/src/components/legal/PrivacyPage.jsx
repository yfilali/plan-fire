import Brand from "../shell/Brand.jsx";
import { useTheme } from "../../theme/ThemeProvider.jsx";

// Standalone /privacy route. Inline styles only, theme-token driven so the
// dark scheme keeps working. Tailored to Firely's real data practices.
export default function PrivacyPage() {
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
	const callout = {
		background: S.accentSoft,
		border: `1px solid ${S.border}`,
		borderRadius: 14,
		padding: "14px 18px",
		color: S.textMuted,
		fontSize: 14,
		lineHeight: 1.6,
		marginBottom: 40,
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

				<h1 style={title}>Privacy Policy</h1>
				<p style={updated}>Last updated: 2026</p>

				<div style={callout}>
					This is a starting template — review with legal counsel before
					launch.
				</div>

				<h2 style={h2}>Introduction</h2>
				<p style={p}>
					Firely ("we", "us") is a financial-independence and retirement
					planner. We take the privacy of your financial information
					seriously — it is the whole point of the product. This policy
					explains what we collect, how we use it, and the choices you
					have.
				</p>

				<h2 style={h2}>Information we collect</h2>
				<ul style={ul}>
					<li style={li}>
						<strong>Account details.</strong> Your email address (and a
						hashed password, or an identifier from an optional social
						sign-in provider).
					</li>
					<li style={li}>
						<strong>The financial figures you enter.</strong> Income,
						spending, savings, account balances, target retirement age,
						assumptions, and the plans you build. You choose what to type
						in.
					</li>
					<li style={li}>
						<strong>Basic usage &amp; session data.</strong> Minimal
						technical information such as which features you use and the
						session tokens needed to keep you logged in.
					</li>
				</ul>

				<h2 style={h2}>How we use it</h2>
				<p style={p}>
					We use your information solely to provide and improve the planner
					— to run your projections, store your plans, power Pro features
					like Monte Carlo, the AI Co-pilot, and the Time Machine, and to
					keep the service secure and working. That's it.
				</p>

				<h2 style={h2}>We do not sell or share your financial data</h2>
				<p style={p}>
					We do not sell, rent, or trade your financial figures, and we do
					not share them with advertisers or data brokers. Your numbers are
					yours.
				</p>

				<h2 style={h2}>Where it's stored</h2>
				<p style={p}>
					Your plans are stored server-side against your account so you can
					reach them from any device. If you use Firely as a guest, your
					data lives only in your own browser until you create an account.
				</p>

				<h2 style={h2}>Cookies &amp; sessions</h2>
				<p style={p}>
					We use cookies and local browser storage strictly to keep you
					signed in, to run guest mode, and to remember preferences such as
					your theme. We do not use third-party advertising cookies.
				</p>

				<h2 style={h2}>Third-party services</h2>
				<p style={p}>
					We rely on a small set of trusted providers to operate Firely:
				</p>
				<ul style={ul}>
					<li style={li}>
						<strong>Resend</strong> — transactional email (e.g. account
						and sign-in messages).
					</li>
					<li style={li}>
						<strong>Stripe</strong> — subscription billing. Card details
						go directly to Stripe; we never see or store them.
					</li>
					<li style={li}>
						<strong>Google &amp; Facebook</strong> — optional social
						sign-in, only if you choose to use it.
					</li>
					<li style={li}>
						<strong>Neon &amp; Vercel</strong> — database and hosting
						infrastructure.
					</li>
				</ul>

				<h2 style={h2}>Data retention &amp; deletion</h2>
				<p style={p}>
					We keep your data for as long as your account is active. You can
					delete your account and all associated data at any time from your
					settings, and it will be removed from our systems.
				</p>

				<h2 style={h2}>Children</h2>
				<p style={p}>
					Firely is not directed at children and is not intended for anyone
					under 18. We do not knowingly collect information from minors.
				</p>

				<h2 style={h2}>Changes to this policy</h2>
				<p style={p}>
					We may update this policy as Firely evolves. When we make material
					changes, we'll update the "last updated" date above and, where
					appropriate, notify you.
				</p>

				<h2 style={h2}>Contact</h2>
				<p style={p}>
					Questions about your privacy? Reach us at{" "}
					<a href="mailto:privacy@firely.money" style={link}>
						privacy@firely.money
					</a>
					.
				</p>
			</div>
		</div>
	);
}
