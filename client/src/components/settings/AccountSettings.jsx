import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { clearAllData } from "../../usePersistedState.jsx";
import { Card, CardHeader, Button, Badge } from "../ui.jsx";

function Row({ S, title, desc, children, danger }) {
	return (
		<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", borderBottom: `1px solid ${S.border}`, flexWrap: "wrap" }}>
			<div>
				<div style={{ fontSize: 13.5, fontWeight: 600, color: danger ? S.danger : S.text }}>{title}</div>
				{desc && <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{desc}</div>}
			</div>
			{children}
		</div>
	);
}

export default function AccountSettings() {
	const S = useTheme();
	const { user, entitlement, guest, signOut, openPortal, startSignIn } = useAuth();
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(null);
	const [busy, setBusy] = useState(false);

	const handleDelete = async () => {
		if (!confirm("Delete your account and ALL plan data? This cannot be undone. A backup is recommended first.")) return;
		await clearAllData();
		try { await signOut(); } catch { /* ignore */ }
		window.location.reload();
	};

	const sendLink = async () => {
		if (!/\S+@\S+\.\S+/.test(email) || busy) return;
		setBusy(true);
		try {
			const { devLink } = await startSignIn(email);
			setSent(devLink || "sent");
		} finally {
			setBusy(false);
		}
	};

	// Guest mode — invite the visitor to claim their data with a sign-in.
	if (guest || !user) {
		return (
			<Card>
				<CardHeader icon="👤" title="Account" subtitle="You're in guest mode. Sign in to save your plans and sync across devices." />
				<div style={{ padding: "12px 14px", background: S.accentSoft, border: `1px solid ${S.accent}33`, borderRadius: 12, marginBottom: 14 }}>
					<div style={{ fontSize: 13, color: S.text, fontWeight: 600 }}>Your work is saved on this device.</div>
					<div style={{ fontSize: 12, color: S.textMuted, marginTop: 3 }}>Sign in and we'll carry it over to your account automatically.</div>
				</div>
				<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@email.com"
						style={{ flex: 1, minWidth: 200, padding: "10px 13px", borderRadius: 10, border: `1px solid ${S.border}`, background: S.bg, color: S.text, fontSize: 13.5, outline: "none" }}
					/>
					<Button variant="primary" onClick={sendLink} disabled={busy}>{busy ? "Sending…" : "Send sign-in link"}</Button>
				</div>
				{sent && (
					<div style={{ marginTop: 12, fontSize: 12.5, color: S.textMuted }}>
						Check your email for the link.{" "}
						{sent !== "sent" && (
							<a href={sent} style={{ color: S.accent, fontWeight: 600 }}>Open magic link (demo)</a>
						)}
					</div>
				)}
			</Card>
		);
	}

	const tier = entitlement?.status === "active" ? entitlement.tier || "pro" : "free";
	const renews = entitlement?.renews ? new Date(entitlement.renews).toLocaleDateString() : null;

	return (
		<Card>
			<CardHeader icon="👤" title="Account" subtitle="Your identity, plan, and sessions." />

			<Row S={S} title="Email">{<span style={{ fontSize: 13, color: S.text, fontFamily: S.mono }}>{user.email}</span>}</Row>
			{user.name && <Row S={S} title="Name">{<span style={{ fontSize: 13, color: S.text }}>{user.name}</span>}</Row>}

			<Row S={S} title="Plan" desc={renews ? `Renews ${renews}` : "Free plan"}>
				<Badge color={tier === "free" ? S.textMuted : S.accent}>
					{tier === "free" ? "Free" : `✦ ${tier === "lifetime" ? "Lifetime" : "Pro"}`}
				</Badge>
			</Row>

			{tier !== "free" && (
				<Row S={S} title="Billing" desc="Update card, invoices, or cancel.">
					<Button onClick={openPortal}>Manage billing</Button>
				</Row>
			)}

			<Row S={S} title="Sign out" desc="End this session on this device.">
				<Button onClick={signOut}>Sign out</Button>
			</Row>

			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "13px 0", flexWrap: "wrap" }}>
				<div>
					<div style={{ fontSize: 13.5, fontWeight: 600, color: S.danger }}>Delete account & data</div>
					<div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>Permanently remove every plan. Export a backup first.</div>
				</div>
				<Button variant="danger" onClick={handleDelete}>Delete account</Button>
			</div>
		</Card>
	);
}
