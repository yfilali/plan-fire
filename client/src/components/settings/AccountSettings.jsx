import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { clearAllData } from "../../usePersistedState.jsx";
import { Card, CardHeader, Button } from "../ui.jsx";

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
	const { user, guest, signOut } = useAuth();

	const handleDelete = async () => {
		if (!confirm("Delete your account and ALL plan data? This cannot be undone. A backup is recommended first.")) return;
		try {
			await fetch("/api/account/delete", { method: "POST", credentials: "include" });
		} catch { /* ignore — clearAllData below still wipes what it can reach */ }
		await clearAllData();
		try { await signOut(); } catch { /* ignore */ }
		window.location.reload();
	};

	// Bring up the full login screen (email/password + Google/Facebook) by
	// clearing the "continue as guest" flag and reloading. Guest work is folded
	// into the account automatically on first sign-in.
	const goToSignIn = () => {
		try { localStorage.removeItem("firly_guest_continue"); } catch { /* ignore */ }
		window.location.reload();
	};

	// Guest mode — invite the visitor to claim their data with a sign-in.
	if (guest || !user) {
		return (
			<Card>
				<CardHeader icon="👤" title="Account" subtitle="You're in guest mode. Sign in to save your plans and sync across devices." />
				<div style={{ padding: "12px 14px", background: S.accentSoft, border: `1px solid ${S.accent}33`, borderRadius: 12, marginBottom: 14 }}>
					<div style={{ fontSize: 13, color: S.text, fontWeight: 600 }}>Your work is saved on this device.</div>
					<div style={{ fontSize: 12, color: S.textMuted, marginTop: 3 }}>Sign in or create an account and we'll carry it over automatically.</div>
				</div>
				<Button variant="primary" onClick={goToSignIn}>Sign in or create account</Button>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader icon="👤" title="Account" subtitle="Your identity and sessions." />

			<Row S={S} title="Email">{<span style={{ fontSize: 13, color: S.text, fontFamily: S.mono }}>{user.email}</span>}</Row>
			{user.name && <Row S={S} title="Name">{<span style={{ fontSize: 13, color: S.text }}>{user.name}</span>}</Row>}

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
