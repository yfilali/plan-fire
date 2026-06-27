import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";

// ─────────────────────────────────────────────────────────────────────────
//  AuthProvider — the spine's identity layer.
//
//  Fetches /api/me on mount. The same-origin session/guest cookie rides along
//  automatically (credentials: 'include'), so the server namespaces all state
//  per user/guest without any client-side token handling.
//
//  useAuth() exposes:
//    { loading, user, entitlement, isPro, guest,
//      startSignIn(email)->Promise<{devLink?}>, signOut(), refresh(),
//      checkout(plan)->Promise, openPortal() }
//  isPro === entitlement && entitlement.status === 'active'.
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
	const [entitlement, setEntitlement] = useState(null);
	const [guest, setGuest] = useState(true);

	const refresh = useCallback(async () => {
		try {
			const res = await fetch("/api/me", { credentials: "include" });
			const data = await res.json();
			setUser(data.user || null);
			setEntitlement(data.entitlement || null);
			setGuest(!!data.guest);
		} catch {
			// Server unreachable — treat as an anonymous guest so the app still loads.
			setUser(null);
			setEntitlement(null);
			setGuest(true);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const startSignIn = useCallback(async (email) => {
		const res = await fetch("/api/auth/start", opts({ email }));
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Could not start sign-in.");
		return { devLink: data.devLink };
	}, []);

	const signOut = useCallback(async () => {
		try {
			await fetch("/api/auth/signout", opts());
		} catch {
			// ignore — refresh() will reflect the real state
		}
		await refresh();
	}, [refresh]);

	// checkout(plan): POST /api/billing/checkout. A dev url points back at our
	// own dev-activate endpoint — call it and refresh. A real Stripe url means we
	// hand off to the hosted checkout page.
	const checkout = useCallback(
		async (plan) => {
			try {
				const res = await fetch("/api/billing/checkout", opts({ plan }));
				const data = await res.json();
				const url = data.url || "";
				if (url.startsWith("/api/billing/dev-activate")) {
					await fetch(url, opts({ plan }));
					await refresh();
					return;
				}
				if (url && url !== "#") window.location = url;
			} catch (err) {
				console.warn("checkout failed:", err);
			}
		},
		[refresh],
	);

	const openPortal = useCallback(async () => {
		try {
			const res = await fetch("/api/billing/portal", opts());
			const data = await res.json();
			if (data.url && data.url !== "#") window.location = data.url;
		} catch (err) {
			console.warn("portal failed:", err);
		}
	}, []);

	const isPro = !!entitlement && entitlement.status === "active";

	const value = {
		loading,
		user,
		entitlement,
		isPro,
		guest,
		startSignIn,
		signOut,
		refresh,
		checkout,
		openPortal,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
