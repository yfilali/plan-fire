import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { Button } from "../ui.jsx";

// Landing page for the password-reset email link: /reset-password?token=…
// Reads the token from the URL, collects a new password, and on success sends
// the user back to the login screen.
export default function ResetPasswordScreen() {
	const S = useTheme();
	const { resetPassword } = useAuth();

	const params = new URLSearchParams(window.location.search);
	const token = params.get("token") || "";
	// Better Auth appends ?error=… when a link is invalid/expired.
	const linkError = params.get("error");

	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState(null);
	const [done, setDone] = useState(false);

	const valid = password.length >= 8 && password === confirm;

	const inputStyle = {
		padding: "12px 14px",
		borderRadius: 11,
		border: `1px solid ${S.border}`,
		background: S.bg,
		color: S.text,
		fontSize: 14,
		outline: "none",
	};

	async function submit(e) {
		e.preventDefault();
		if (!valid || busy) return;
		setBusy(true);
		setErr(null);
		const r = await resetPassword({ token, newPassword: password });
		setBusy(false);
		if (r.error) setErr(r.error);
		else setDone(true);
	}

	const goHome = () => {
		window.location.href = "/";
	};

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
					<div style={{ fontSize: 30, fontWeight: 850, color: S.accent, letterSpacing: -0.5 }}>PlanFIRE</div>
					<div style={{ fontSize: 14, color: S.textMuted, marginTop: 4 }}>Set a new password.</div>
				</div>

				{linkError || !token ? (
					<div style={{ textAlign: "center", display: "grid", gap: 14 }}>
						<div style={{ fontSize: 13.5, color: S.danger, lineHeight: 1.5 }}>
							This reset link is invalid or has expired. Request a new one from the login screen.
						</div>
						<Button variant="primary" size="md" full onClick={goHome}>Back to log in</Button>
					</div>
				) : done ? (
					<div style={{ textAlign: "center", display: "grid", gap: 14 }}>
						<div style={{ fontSize: 34 }}>✅</div>
						<div style={{ fontSize: 15, fontWeight: 700, color: S.text }}>Password updated</div>
						<Button variant="primary" size="md" full onClick={goHome}>Log in</Button>
					</div>
				) : (
					<form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
						<input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (8+ chars)" style={inputStyle} />
						<input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" style={inputStyle} />
						<Button type="submit" variant="primary" size="lg" full disabled={!valid || busy}>
							{busy ? "Updating…" : "Update password →"}
						</Button>
						{err && <div style={{ fontSize: 12, color: S.danger, textAlign: "center" }}>{err}</div>}
						{confirm && password !== confirm && (
							<div style={{ fontSize: 12, color: S.textMuted, textAlign: "center" }}>Passwords don't match.</div>
						)}
					</form>
				)}
			</div>
		</div>
	);
}
