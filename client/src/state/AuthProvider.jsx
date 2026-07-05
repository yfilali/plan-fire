import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import { authClient } from "../lib/authClient.js";

// ─────────────────────────────────────────────────────────────────────────
//  AuthProvider — the spine's identity layer (Better Auth).
//
//  Auth actions go through the Better Auth client (email/password, Google,
//  Facebook, password reset). Guest / provider info comes from our own
//  /api/me. The same-origin session cookie rides along automatically.
//
//  useAuth() exposes:
//    { loading, user, guest, providers,
//      signUpEmail({name,email,password}), signInEmail({email,password}),
//      signInSocial(provider), requestPasswordReset(email),
//      resetPassword({token,newPassword}), signOut(), refresh() }
//  Auth-action methods resolve to { error } on failure (never throw).
// ─────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

const opts = (body) => ({
	method: "POST",
	credentials: "include",
	headers: { "Content-Type": "application/json" },
	body: body ? JSON.stringify(body) : undefined,
});

export function AuthProvider({ children }) {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);
	const [guest, setGuest] = useState(true);
	const [providers, setProviders] = useState({ google: false, facebook: false });

	const refresh = useCallback(async () => {
		try {
			const res = await fetch("/api/me", { credentials: "include" });
			const data = await res.json();
			setUser(data.user || null);
			setGuest(!!data.guest);
			if (data.providers) setProviders(data.providers);
			return data;
		} catch {
			// Server unreachable — treat as an anonymous guest so the app still loads.
			setUser(null);
			setGuest(true);
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	// Fold any pre-signup guest work into the account. Idempotent server-side
	// (no-op once the guest cookie is consumed). Returns whether a merge ran.
	const claimGuest = useCallback(async () => {
		try {
			const res = await fetch("/api/account/claim-guest", opts());
			const data = await res.json();
			return !!data.migrated;
		} catch {
			return false; // non-fatal — the account is still usable without the merge
		}
	}, []);

	// On load, resolve identity. If we're authenticated, run the guest-claim —
	// this also covers OAuth (Google/Facebook), which redirect back here rather
	// than resolving inline. A merge means stale guest data is already loaded,
	// so reload to pull the freshly-migrated account state.
	useEffect(() => {
		let cancelled = false;
		(async () => {
			const data = await refresh();
			if (cancelled || !data || data.guest || !data.user) return;
			if (await claimGuest()) window.location.reload();
		})();
		return () => {
			cancelled = true;
		};
	}, [refresh, claimGuest]);

	// After an inline (email/password) sign-in, claim guest work then refresh.
	const finishSignIn = useCallback(async () => {
		if (await claimGuest()) {
			window.location.reload();
			return;
		}
		await refresh();
	}, [refresh, claimGuest]);

	const signUpEmail = useCallback(async ({ name, email, password }) => {
		const { error } = await authClient.signUp.email({
			name: name || email.split("@")[0],
			email,
			password,
			// Where the emailed verification link lands after Better Auth confirms
			// it and signs the user in — the planner, not the marketing homepage,
			// with a flag AppShell uses to show a one-time confirmation banner.
			callbackURL: "/app?verified=1",
		});
		if (error) return { error: error.message || "Could not create account." };
		// With email verification on, there's no session yet — the user must
		// confirm via the emailed link before signing in.
		return { ok: true, needsVerification: true };
	}, []);

	const signInEmail = useCallback(
		async ({ email, password }) => {
			const { error } = await authClient.signIn.email({ email, password });
			if (error) {
				return {
					error: error.message || "Wrong email or password.",
					code: error.code,
				};
			}
			await finishSignIn();
			return { ok: true };
		},
		[finishSignIn],
	);

	const signInSocial = useCallback(async (provider) => {
		// Redirects to the provider, then back to "/" where refresh() + the
		// guest-claim run on mount.
		const { error } = await authClient.signIn.social({
			provider,
			callbackURL: "/app",
		});
		if (error) return { error: error.message || "Sign-in failed." };
		return { ok: true };
	}, []);

	const requestPasswordReset = useCallback(async (email) => {
		const { error } = await authClient.forgetPassword({
			email,
			redirectTo: "/reset-password",
		});
		if (error) return { error: error.message || "Could not send reset email." };
		return { ok: true };
	}, []);

	const doResetPassword = useCallback(async ({ token, newPassword }) => {
		const { error } = await authClient.resetPassword({ token, newPassword });
		if (error) return { error: error.message || "Could not reset password." };
		return { ok: true };
	}, []);

	const signOut = useCallback(async () => {
		try {
			await authClient.signOut();
		} catch {
			// ignore — refresh() will reflect the real state
		}
		await refresh();
	}, [refresh]);

	const value = {
		loading,
		user,
		guest,
		providers,
		signUpEmail,
		signInEmail,
		signInSocial,
		requestPasswordReset,
		resetPassword: doResetPassword,
		signOut,
		refresh,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
