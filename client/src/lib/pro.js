import { usePersistedState } from "../usePersistedState.jsx";

// ─────────────────────────────────────────────────────────────────────────
//  "Firly Pro" entitlement.
//
//  Firly has no accounts, so the entitlement is a persisted boolean synced
//  with the rest of the user's state. Unlocking flips it to true. Real billing
//  (Stripe/Paddle/etc.) would set this flag from a verified webhook — the
//  unlock button here is a deliberate stub for that integration point.
// ─────────────────────────────────────────────────────────────────────────

export const PRO = {
	name: "Firly Pro",
	monthly: 6,
	yearly: 49,
	features: [
		"Time Machine — backtest any era since 1928",
		"Real returns for stocks, bonds, gold, real estate & cash",
		"Allocate across asset classes and replay history on your money",
		"Famous-era presets and custom windows",
	],
};

export function usePro() {
	const [pro, setPro] = usePersistedState("pro", false);
	return [!!pro, setPro];
}
