import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { Button, Badge } from "../ui.jsx";

// Passwordless sign-in. Sends a magic link; in the demo build (no email
// transport) the server returns the link directly so you can click through.
export default function LoginScreen({ onGuest }) {
	const S = useTheme();
	const { startSignIn } = useAuth();
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [devLink, setDevLink] = useState(null);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState(null);

	const valid = /\S+@\S+\.\S+/.test(email);

	async function submit(e) {
		e.preventDefault();
		if (!valid || busy) return;
		setBusy(true);
		setErr(null);
		try {
			const { devLink } = await startSignIn(email);
			setSent(true);
			setDevLink(devLink || null);
		} catch {
			setErr("Couldn't send the link. Try again.");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: S.appBg || S.bg, padding: 20 }}>
			<div
				style={{
					width: 420,
					maxWidth: "100%",
					background: S.surface,
					border: `1px solid ${S.borderStrong}`,
					borderRadius: 20,
					boxShadow: S.shadowLg,
					padding: "34px 30px",
				}}
			>
				<div style={{ textAlign: "center", marginBottom: 22 }}>
					<div style={{ fontSize: 30, fontWeight: 850, color: S.accent, letterSpacing: -0.5 }}>Firly</div>
					<div style={{ fontSize: 14, color: S.textMuted, marginTop: 4 }}>Plan your escape.</div>
				</div>

				{!sent ? (
					<form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
						<input
							type="email"
							autoFocus
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@email.com"
							style={{
								padding: "12px 14px",
								borderRadius: 11,
								border: `1px solid ${S.border}`,
								background: S.bg,
								color: S.text,
								fontSize: 14,
								outline: "none",
							}}
						/>
						<Button type="submit" variant="primary" size="lg" full disabled={!valid || busy}>
							{busy ? "Sending…" : "Email me a link →"}
						</Button>
						{err && <div style={{ fontSize: 12, color: S.danger, textAlign: "center" }}>{err}</div>}

						<div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0", color: S.textDim, fontSize: 11.5 }}>
							<div style={{ flex: 1, height: 1, background: S.border }} />
							or
							<div style={{ flex: 1, height: 1, background: S.border }} />
						</div>

						<button
							type="button"
							disabled
							title="Coming soon"
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: 9,
								padding: "11px 14px",
								borderRadius: 11,
								border: `1px solid ${S.border}`,
								background: S.bg,
								color: S.textMuted,
								fontSize: 13.5,
								fontWeight: 600,
								cursor: "not-allowed",
								opacity: 0.8,
							}}
						>
							<span style={{ fontWeight: 800, color: "#4285F4" }}>G</span>
							Continue with Google
							<Badge color={S.textMuted}>soon</Badge>
						</button>
					</form>
				) : (
					<div style={{ textAlign: "center", display: "grid", gap: 14 }}>
						<div style={{ fontSize: 34 }}>📬</div>
						<div style={{ fontSize: 15, fontWeight: 700, color: S.text }}>Check your email</div>
						<div style={{ fontSize: 13, color: S.textMuted, lineHeight: 1.5 }}>
							We sent a sign-in link to <strong style={{ color: S.text }}>{email}</strong>. It expires in 15 minutes.
						</div>
						{devLink && (
							<a href={devLink} style={{ textDecoration: "none" }}>
								<Button variant="primary" size="md" full>Open magic link (demo)</Button>
							</a>
						)}
						<button onClick={() => setSent(false)} style={{ background: "none", border: "none", color: S.textMuted, fontSize: 12, cursor: "pointer" }}>
							← Use a different email
						</button>
					</div>
				)}

				<div style={{ textAlign: "center", marginTop: 20 }}>
					<button onClick={onGuest} style={{ background: "none", border: "none", color: S.textDim, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>
						Continue as guest
					</button>
				</div>

				<div style={{ fontSize: 10.5, color: S.textDim, textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
					Your numbers are private. We never sell financial data.
				</div>
			</div>
		</div>
	);
}
