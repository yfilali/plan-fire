import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { Button } from "../ui.jsx";

// Real auth: email/password (sign up + log in), Google & Facebook OAuth, and
// password reset. Social buttons appear only for providers the server has
// configured (useAuth().providers).
export default function LoginScreen({ onGuest }) {
	const S = useTheme();
	const {
		providers,
		signInEmail,
		signUpEmail,
		signInSocial,
		requestPasswordReset,
	} = useAuth();

	const [mode, setMode] = useState("login"); // login | signup | forgot
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState(null);
	const [notice, setNotice] = useState(null);

	const emailValid = /\S+@\S+\.\S+/.test(email);
	const pwValid = password.length >= 8;
	const canSubmit =
		mode === "forgot" ? emailValid : emailValid && pwValid && !busy;

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
		if (!canSubmit || busy) return;
		setBusy(true);
		setErr(null);
		setNotice(null);
		try {
			if (mode === "login") {
				const r = await signInEmail({ email, password });
				if (r.error) {
					setErr(
						r.code === "EMAIL_NOT_VERIFIED"
							? "Please verify your email first — check your inbox."
							: r.error,
					);
				}
				// on success the app re-renders into the authenticated shell
			} else if (mode === "signup") {
				const r = await signUpEmail({ name, email, password });
				if (r.error) setErr(r.error);
				else
					setNotice(
						"Account created. Check your email for a verification link to finish signing up.",
					);
			} else if (mode === "forgot") {
				const r = await requestPasswordReset(email);
				if (r.error) setErr(r.error);
				else
					setNotice(
						"If that email has an account, a password-reset link is on its way.",
					);
			}
		} catch {
			setErr("Something went wrong. Try again.");
		} finally {
			setBusy(false);
		}
	}

	const SocialButton = ({ provider, label, glyph, glyphColor }) => (
		<button
			type="button"
			onClick={() => signInSocial(provider)}
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 9,
				padding: "11px 14px",
				borderRadius: 11,
				border: `1px solid ${S.border}`,
				background: S.bg,
				color: S.text,
				fontSize: 13.5,
				fontWeight: 600,
				cursor: "pointer",
			}}
		>
			<span style={{ fontWeight: 800, color: glyphColor }}>{glyph}</span>
			{label}
		</button>
	);

	const anySocial = providers.google || providers.facebook;

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
					<div style={{ fontSize: 14, color: S.textMuted, marginTop: 4 }}>
						{mode === "signup"
							? "Create your account."
							: mode === "forgot"
								? "Reset your password."
								: "Plan your escape."}
					</div>
				</div>

				<form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
					{mode === "signup" && (
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name (optional)"
							style={inputStyle}
						/>
					)}
					<input
						type="email"
						autoFocus
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@email.com"
						style={inputStyle}
					/>
					{mode !== "forgot" && (
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder={mode === "signup" ? "Create a password (8+ chars)" : "Password"}
							style={inputStyle}
						/>
					)}

					<Button type="submit" variant="primary" size="lg" full disabled={!canSubmit}>
						{busy
							? "Working…"
							: mode === "signup"
								? "Create account →"
								: mode === "forgot"
									? "Send reset link →"
									: "Log in →"}
					</Button>

					{err && <div style={{ fontSize: 12, color: S.danger, textAlign: "center" }}>{err}</div>}
					{notice && <div style={{ fontSize: 12.5, color: S.accent, textAlign: "center", lineHeight: 1.5 }}>{notice}</div>}

					{mode === "login" && (
						<button
							type="button"
							onClick={() => { setMode("forgot"); setErr(null); setNotice(null); }}
							style={{ background: "none", border: "none", color: S.textMuted, fontSize: 12, cursor: "pointer", justifySelf: "center" }}
						>
							Forgot your password?
						</button>
					)}

					{mode !== "login" && (
						<button
							type="button"
							onClick={() => { setMode("login"); setErr(null); setNotice(null); }}
							style={{ background: "none", border: "none", color: S.textMuted, fontSize: 12, cursor: "pointer", justifySelf: "center" }}
						>
							← Back to log in
						</button>
					)}

					{anySocial && mode !== "forgot" && (
						<>
							<div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0", color: S.textDim, fontSize: 11.5 }}>
								<div style={{ flex: 1, height: 1, background: S.border }} />
								or
								<div style={{ flex: 1, height: 1, background: S.border }} />
							</div>
							{providers.google && (
								<SocialButton provider="google" label="Continue with Google" glyph="G" glyphColor="#4285F4" />
							)}
							{providers.facebook && (
								<SocialButton provider="facebook" label="Continue with Facebook" glyph="f" glyphColor="#1877F2" />
							)}
						</>
					)}
				</form>

				{mode === "login" && (
					<div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: S.textMuted }}>
						New to Firly?{" "}
						<button onClick={() => { setMode("signup"); setErr(null); setNotice(null); }} style={{ background: "none", border: "none", color: S.accent, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
							Create an account
						</button>
					</div>
				)}

				<div style={{ textAlign: "center", marginTop: 18 }}>
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
