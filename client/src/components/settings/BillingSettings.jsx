import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { Card, CardHeader, Button, Badge } from "../ui.jsx";
import { PRO } from "../../lib/pro.js";
import UpgradeModal from "./UpgradeModal.jsx";

const TIERS = [
	{ id: "free", name: "Free", price: "$0", blurb: "Core forecast", points: ["1 active plan", "Expenses & assets", "Local + sync"] },
	{ id: "pro", name: "Pro", price: `$${PRO.yearly}/yr`, blurb: "Everything unlocked", points: ["Unlimited plans", "Time Machine", "Monte Carlo", "AI Co-pilot"], star: true },
	{ id: "lifetime", name: "Lifetime", price: `$${PRO.lifetime}`, blurb: "Pay once", points: ["Everything in Pro", "Forever", "Founder badge"] },
];

export default function BillingSettings() {
	const S = useTheme();
	const { entitlement, openPortal } = useAuth();
	const [showUpgrade, setShowUpgrade] = useState(false);
	const active = entitlement?.status === "active";
	const tier = active ? entitlement.tier || "pro" : "free";
	const renews = entitlement?.renews ? new Date(entitlement.renews).toLocaleDateString() : null;

	return (
		<Card>
			<CardHeader icon="✦" title="Billing" subtitle="Your subscription and payment details." />

			{active ? (
				<div style={{ display: "grid", gap: 14 }}>
					<div style={{ padding: "14px 16px", background: S.accentSoft, border: `1px solid ${S.accent}33`, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
						<div>
							<div style={{ fontSize: 14, fontWeight: 750, color: S.text }}>
								✦ PlanFIRE {tier === "lifetime" ? "Lifetime" : "Pro"}
							</div>
							<div style={{ fontSize: 12.5, color: S.textMuted, marginTop: 3 }}>
								{tier === "lifetime" ? "Lifetime access — no renewal." : renews ? `Renews ${renews}` : "Active"}
								{entitlement.priceId && <span style={{ fontFamily: S.mono, marginLeft: 8, color: S.textDim }}>{entitlement.priceId}</span>}
							</div>
						</div>
						<Button onClick={openPortal}>Manage subscription</Button>
					</div>
					<div style={{ fontSize: 12, color: S.textMuted, padding: "8px 0", borderTop: `1px solid ${S.border}` }}>
						Invoices and receipts are available in the billing portal.
					</div>
				</div>
			) : (
				<>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
						{TIERS.map((t) => (
							<div
								key={t.id}
								style={{
									padding: "16px 14px",
									borderRadius: 14,
									border: `1.5px solid ${t.star ? S.accent : S.border}`,
									background: t.star ? S.accentSoft : S.bg,
									position: "relative",
								}}
							>
								{t.star && <div style={{ position: "absolute", top: -10, right: 12 }}><Badge color={S.accent}>Popular</Badge></div>}
								<div style={{ fontSize: 13, fontWeight: 700, color: S.text }}>{t.name}</div>
								<div style={{ fontSize: 20, fontWeight: 800, color: t.star ? S.accent : S.text, fontFamily: S.mono, margin: "4px 0 2px" }}>{t.price}</div>
								<div style={{ fontSize: 11.5, color: S.textMuted, marginBottom: 10 }}>{t.blurb}</div>
								<div style={{ display: "grid", gap: 5 }}>
									{t.points.map((pt) => (
										<div key={pt} style={{ fontSize: 11.5, color: S.text, display: "flex", gap: 6 }}>
											<span style={{ color: t.id === "free" ? S.textDim : S.accent }}>{t.id === "free" ? "•" : "✓"}</span>
											{pt}
										</div>
									))}
								</div>
							</div>
						))}
					</div>
					<Button variant="primary" size="lg" full onClick={() => setShowUpgrade(true)}>Upgrade to PlanFIRE Pro</Button>
				</>
			)}

			{showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
		</Card>
	);
}
