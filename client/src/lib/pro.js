import { useAuth } from "../state/AuthProvider.jsx";

// ─────────────────────────────────────────────────────────────────────────
//  "Firely Pro" entitlement.
//
//  The entitlement now lives server-side (verified via /api/me) and is unlocked
//  through real or dev billing. usePro() bridges that to the existing call
//  sites: it returns [isPro, unlock] where unlock(plan) triggers checkout.
//
//  Back-compat: TimeMachine calls `const [pro,setPro]=usePro()` then `setPro(true)`
//  on unlock; unlock ignores a boolean arg and kicks off checkout instead.
// ─────────────────────────────────────────────────────────────────────────

export const PRO = {
	name: "Firely Pro",
	monthly: 6,
	yearly: 49,
	lifetime: 149,
	features: [
		"Time Machine — backtest any era since 1928",
		"Real returns for stocks, bonds, gold, real estate & cash",
		"Allocate across asset classes and replay history on your money",
		"Famous-era presets and custom windows",
		"AI co-pilot grounded in your real plan numbers",
	],
};

export function usePro() {
	const { isPro, checkout } = useAuth();

	// Accept either a plan string ('monthly'|'yearly'|'lifetime') or a legacy
	// boolean (from setPro(true)). Booleans default to the yearly plan.
	const unlock = (planOrBool) => {
		const plan = typeof planOrBool === "string" ? planOrBool : "yearly";
		return checkout(plan);
	};

	return [isPro, unlock];
}
