import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { Modal, Button, Badge } from "../ui.jsx";
import { PRO } from "../../lib/pro.js";

// Premium upsell. Checkout now runs through real/dev billing (useAuth().checkout)
// which sets the server-verified entitlement. `onUnlock` stays optional so legacy
// call sites (e.g. TimeMachine) can react after a successful purchase.
export default function UpgradeModal({ onClose, onUnlock }) {
	const S = useTheme();
	const { checkout } = useAuth();
	const [cycle, setCycle] = useState("yearly");
	const [busy, setBusy] = useState(false);

	const CYCLES = [
		{ id: "monthly", label: "Monthly", price: PRO.monthly, unit: "/mo" },
		{ id: "yearly", label: "Yearly", price: PRO.yearly, unit: "/yr" },
		{ id: "lifetime", label: "Lifetime", price: PRO.lifetime, unit: " once" },
	];
	const sel = CYCLES.find((c) => c.id === cycle);
	const save = Math.round((1 - PRO.yearly / (PRO.monthly * 12)) * 100);

	async function buy() {
		if (busy) return;
		setBusy(true);
		try {
			await checkout(cycle);
			onUnlock?.(true);
			onClose?.();
		} finally {
			setBusy(false);
		}
	}

	return (
		<Modal title="Upgrade to PlanFIRE Pro" onClose={onClose} width={470}>
			<div style={{ textAlign: "center", marginBottom: 18 }}>
				<div style={{ fontSize: 34, marginBottom: 6 }}>✦</div>
				<div style={{ fontSize: 17, fontWeight: 750, color: S.text }}>Everything, unlocked</div>
				<div style={{ fontSize: 13, color: S.textMuted, marginTop: 4, lineHeight: 1.5 }}>
					Time Machine, Monte Carlo success odds, and an AI co-pilot that reads your real numbers.
				</div>
			</div>

			{/* Billing cycle toggle */}
			<div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
				{CYCLES.map((c) => {
					const on = cycle === c.id;
					return (
						<button
							key={c.id}
							onClick={() => setCycle(c.id)}
							style={{
								cursor: "pointer",
								padding: "8px 15px",
								borderRadius: 10,
								border: `1.5px solid ${on ? S.accent : S.border}`,
								background: on ? S.accent + "14" : "transparent",
								color: on ? S.accent : S.textMuted,
								fontWeight: 650,
								fontSize: 13,
								display: "flex",
								alignItems: "center",
								gap: 7,
							}}
						>
							{c.label}
							{c.id === "yearly" && <Badge color={S.accent}>Save {save}%</Badge>}
							{c.id === "lifetime" && <Badge color={S.purple}>Best value</Badge>}
						</button>
					);
				})}
			</div>

			<div style={{ textAlign: "center", marginBottom: 18 }}>
				<span style={{ fontSize: 38, fontWeight: 800, color: S.text, fontFamily: S.mono }}>${sel.price}</span>
				<span style={{ fontSize: 15, color: S.textMuted }}>{sel.unit}</span>
			</div>

			<div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
				{PRO.features.map((f) => (
					<div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: S.text }}>
						<span style={{ color: S.accent, fontWeight: 800, flexShrink: 0 }}>✓</span>
						<span>{f}</span>
					</div>
				))}
			</div>

			<Button variant="primary" size="lg" full onClick={buy} disabled={busy}>
				{busy ? "Starting checkout…" : `Unlock ${PRO.name} — $${sel.price}${sel.unit}`}
			</Button>
			<div style={{ fontSize: 10.5, color: S.textDim, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
				Secure checkout via Stripe. When Stripe isn't configured (demo build), unlocking activates instantly so you can explore Pro.
			</div>
		</Modal>
	);
}
