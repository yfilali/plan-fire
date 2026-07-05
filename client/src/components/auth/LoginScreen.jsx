import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { Button } from "../ui.jsx";
import { GUEST_CONTINUE_KEY } from "../../lib/guest.js";

// Real auth: email/password (sign up + log in), Google & Facebook OAuth, and
// password reset. Social buttons appear only for providers the server has
// configured (useAuth().providers). Rendered as a full-screen route at
// "/login" and "/signup" (initialMode selects the starting mode).
export default function LoginScreen({ initialMode = "login" }) {
	const S = useTheme();
	const {
		providers,
		signInEmail,
		signUpEmail,
		signInSocial,
		requestPasswordReset,
	} = useAuth();

	const [mode, setMode] = useState(initialMode); // login | signup | forgot

	// Persist the guest-continue flag (same key AppShell reads) and head to the
	// planner.
	const continueAsGuest = () => {
		try {
			localStorage.setItem(GUEST_CONTINUE_KEY, "1");
		} catch {
			// ignore storage failures — session-only guest is fine
		}
		window.location.href = "/app";
	};
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState(null);
	const [notice, setNotice] = useState(null);
	const [unverifiedEmail, setUnverifiedEmail] = useState(null);
	const [resendBusy, setResendBusy] = useState(false);

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
		setUnverifiedEmail(null);
		try {
			if (mode === "login") {
				const r = await signInEmail({ email, password });
				if (r.error) {
					if (r.code === "EMAIL_NOT_VERIFIED") {
						setErr("Please verify your email first — check your inbox.");
						setUnverifiedEmail(email);
					} else {
						setErr(r.error);
					}
				}
				else window.location.href = "/app"; // authenticated — go to planner
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

	async function resendVerification() {
		if (!unverifiedEmail || resendBusy) return;
		setResendBusy(true);
		setErr(null);
		try {
			const res = await fetch("/api/account/resend-verification", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: unverifiedEmail }),
			});
			const data = await res.json();
			if (data.code === "RATE_LIMITED") {
				const mins = Math.max(1, Math.ceil(data.retryAfterSeconds / 60));
				setErr(`Please wait about ${mins} minute${mins === 1 ? "" : "s"} before requesting another email.`);
			} else if (data.code === "MAX_ATTEMPTS") {
				setErr("You've reached the limit for resending this email. Contact support if you still need help.");
			} else {
				setNotice("Verification email sent — check your inbox.");
			}
		} catch {
			setErr("Something went wrong sending the email. Try again.");
		} finally {
			setResendBusy(false);
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
					<a href="/" style={{ textDecoration: "none" }}>
						<div style={{ fontSize: 30, fontWeight: 850, color: S.accent, letterSpacing: -0.5 }}>PlanFIRE</div>
					</a>
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
					{unverifiedEmail && (
						<button
							type="button"
							onClick={resendVerification}
							disabled={resendBusy}
							style={{ background: "none", border: "none", color: S.accent, fontSize: 12.5, fontWeight: 600, cursor: resendBusy ? "default" : "pointer", justifySelf: "center" }}
						>
							{resendBusy ? "Sending…" : "Resend verification email"}
						</button>
					)}

					{mode === "login" && (
						<button
							type="button"
							onClick={() => { setMode("forgot"); setErr(null); setNotice(null); setUnverifiedEmail(null); }}
							style={{ background: "none", border: "none", color: S.textMuted, fontSize: 12, cursor: "pointer", justifySelf: "center" }}
						>
							Forgot your password?
						</button>
					)}

					{mode !== "login" && (
						<button
							type="button"
							onClick={() => { setMode("login"); setErr(null); setNotice(null); setUnverifiedEmail(null); }}
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
						New to PlanFIRE?{" "}
						<button onClick={() => { setMode("signup"); setErr(null); setNotice(null); setUnverifiedEmail(null); }} style={{ background: "none", border: "none", color: S.accent, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
							Create an account
						</button>
					</div>
				)}

				<div style={{ textAlign: "center", marginTop: 18 }}>
					<button onClick={continueAsGuest} style={{ background: "none", border: "none", color: S.textDim, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>
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
