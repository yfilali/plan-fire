import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { Modal, Button, Badge } from "../ui.jsx";
import { PRO } from "../../lib/pro.js";

// Premium upsell. `onUnlock` flips the entitlement on (stub for real billing).
export default function UpgradeModal({ onClose, onUnlock }) {
	const S = useTheme();
	const [cycle, setCycle] = useState("yearly");
	const price = cycle === "yearly" ? PRO.yearly : PRO.monthly;
	const unit = cycle === "yearly" ? "/yr" : "/mo";
	const save = Math.round((1 - PRO.yearly / (PRO.monthly * 12)) * 100);

	return (
		<Modal title="Upgrade to Firly Pro" onClose={onClose} width={460}>
			<div style={{ textAlign: "center", marginBottom: 18 }}>
				<div style={{ fontSize: 34, marginBottom: 6 }}>⏳</div>
				<div style={{ fontSize: 17, fontWeight: 750, color: S.text }}>The Time Machine</div>
				<div style={{ fontSize: 13, color: S.textMuted, marginTop: 4, lineHeight: 1.5 }}>
					Replay any real market era on your actual portfolio — every asset class, every year, since 1928.
				</div>
			</div>

			{/* Billing cycle toggle */}
			<div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
				{["monthly", "yearly"].map((c) => {
					const on = cycle === c;
					return (
						<button
							key={c}
							onClick={() => setCycle(c)}
							style={{
								cursor: "pointer",
								padding: "8px 16px",
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
							{c === "yearly" ? "Yearly" : "Monthly"}
							{c === "yearly" && <Badge color={S.accent}>Save {save}%</Badge>}
						</button>
					);
				})}
			</div>

			<div style={{ textAlign: "center", marginBottom: 18 }}>
				<span style={{ fontSize: 38, fontWeight: 800, color: S.text, fontFamily: S.mono }}>${price}</span>
				<span style={{ fontSize: 15, color: S.textMuted }}>{unit}</span>
			</div>

			<div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
				{PRO.features.map((f) => (
					<div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: S.text }}>
						<span style={{ color: S.accent, fontWeight: 800, flexShrink: 0 }}>✓</span>
						<span>{f}</span>
					</div>
				))}
			</div>

			<Button variant="primary" size="lg" full onClick={onUnlock}>
				Unlock {PRO.name} — ${price}{unit}
			</Button>
			<div style={{ fontSize: 10.5, color: S.textDim, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
				Demo build: unlocking is instant and free — no card, no account. This is where real checkout would go.
			</div>
		</Modal>
	);
}
