import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { useAuth } from "../../state/AuthProvider.jsx";
import { useAiActions } from "../../lib/aiActions.js";
import { Card, CardHeader, Button, Badge } from "../ui.jsx";
import Icon from "../Icon.jsx";
import { FS, RAD, FW } from "../../lib/styles.js";
import UpgradeModal from "../settings/UpgradeModal.jsx";

const SUGGESTIONS = [
	"Can I retire 3 years earlier?",
	"What if inflation runs hotter?",
	"How do I cut my run-out risk?",
];

export default function Copilot() {
	const S = useTheme();
	const { isPro } = useAuth();
	const { apply } = useAiActions();
	const p = usePlanner();
	const [showUpgrade, setShowUpgrade] = useState(false);
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [busy, setBusy] = useState(false);
	const scrollRef = useRef(null);

	// Compact, numbers-only snapshot — what the model is grounded on.
	const snapshot = useMemo(
		() => ({
			age: p.age,
			retireAge: p.retireAge,
			ssAge: p.ssAge,
			ssAnnual: p.ssAnnual,
			inflation: p.inflation,
			nomReturn: p.nomReturn,
			portfolio: Math.round(p.portfolio || 0),
			effWR: p.effWR,
			runsOut: p.runsOut ? { age: p.runsOut.age } : null,
			planLabel: p.projections?.primaryLabel,
			activePlan: p.activePlan?.name,
			annualSpendNow: Math.round(p.spendNow || 0),
			balances: {
				65: Math.round(p.getD?.(65)?.balance || 0),
				80: Math.round(p.getD?.(80)?.balance || 0),
				95: Math.round(p.getD?.(95)?.balance || 0),
			},
		}),
		[p],
	);

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
	}, [messages, busy]);

	async function send(text) {
		const content = (text ?? input).trim();
		if (!content || busy) return;
		setInput("");
		const history = [...messages, { role: "user", content }];
		setMessages(history);
		setBusy(true);
		try {
			const res = await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: history.map((m) => ({ role: m.role, content: m.content })),
					snapshot,
				}),
			});
			const data = await res.json();
			setMessages((m) => [...m, { role: "assistant", content: data.reply || "…", actions: data.actions || [] }]);
		} catch {
			setMessages((m) => [...m, { role: "assistant", content: "I couldn't reach the planning service. Your numbers are still live on the dashboard.", actions: [] }]);
		} finally {
			setBusy(false);
		}
	}

	function onApply(action, idx, msgIdx) {
		const label = apply(action);
		setMessages((m) => {
			const next = [...m];
			// Mark the action applied so the button can't be re-clicked.
			const msg = { ...next[msgIdx] };
			msg.actions = msg.actions.map((a, i) => (i === idx ? { ...a, applied: true } : a));
			next[msgIdx] = msg;
			return [...next, { role: "system", content: label || action.label || "Applied" }];
		});
	}

	if (!isPro) {
		return (
			<>
				<Card>
					<CardHeader icon={<Icon name="sparkle" size={16} color={S.accent} />} title="Firly Co-pilot" subtitle="An AI planner that reads your real numbers and can edit your plan for you." />
					<div style={{ textAlign: "center", padding: "24px 8px" }}>
						<div style={{ display: "inline-flex", marginBottom: 10 }}><Icon name="sparkle" size={40} color={S.accent} /></div>
						<div style={{ fontSize: FS.md, fontWeight: FW.bold, color: S.text }}>Ask anything about your plan</div>
						<div style={{ fontSize: FS.base, color: S.textMuted, marginTop: 6, maxWidth: 420, marginInline: "auto", lineHeight: 1.5 }}>
							"Can I retire at 52?" — the co-pilot answers with <em>your</em> figures and proposes one-tap changes you can apply. Available on Firly Pro.
						</div>
						<div style={{ marginTop: 18 }}>
							<Button variant="primary" size="lg" onClick={() => setShowUpgrade(true)}>Unlock the Co-pilot</Button>
						</div>
					</div>
				</Card>
				{showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
			</>
		);
	}

	return (
		<Card pad={0} style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", minHeight: 460 }}>
			<div style={{ padding: "16px 18px", borderBottom: `1px solid ${S.border}` }}>
				<CardHeader icon={<Icon name="sparkle" size={16} color={S.accent} />} title="Firly Co-pilot" subtitle="Grounded in your live plan — it can propose changes you apply with one tap." />
			</div>

			<div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
				{messages.length === 0 && (
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						{/* Compact intro — what the co-pilot is for, not a centered void. */}
						<div style={{ display: "flex", gap: 12, padding: 14, borderRadius: RAD.md, border: `1px solid ${S.border}`, background: S.bg }}>
							<div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: RAD.sm, background: S.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
								<Icon name="sparkle" size={20} color={S.accent} />
							</div>
							<div>
								<div style={{ fontSize: FS.md, fontWeight: FW.semibold, color: S.text }}>Ask anything about your plan</div>
								<div style={{ fontSize: FS.base, color: S.textMuted, marginTop: 4, lineHeight: 1.5 }}>
									I read your live numbers and answer with <em>your</em> figures. When a change is worth making, I propose it as a one-tap edit you apply right here.
								</div>
							</div>
						</div>

						{/* A small set of starter prompts. */}
						<div>
							<div style={{ fontSize: FS.xs, fontWeight: FW.semibold, color: S.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Try asking</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
								{SUGGESTIONS.map((s) => (
									<button
										key={s}
										onClick={() => send(s)}
										style={{ cursor: "pointer", textAlign: "left", padding: "10px 13px", borderRadius: RAD.sm, border: `1px solid ${S.border}`, background: S.bg, color: S.text, fontSize: FS.base }}
									>
										{s}
									</button>
								))}
							</div>
						</div>
					</div>
				)}

				{messages.map((m, i) => {
					if (m.role === "system") {
						return (
							<div key={i} style={{ alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 5, fontSize: FS.sm, color: S.accent, fontWeight: FW.semibold, background: S.accentSoft, padding: "5px 12px", borderRadius: RAD.pill }}>
								<Icon name="check" size={13} color={S.accent} />
								{m.content}
							</div>
						);
					}
					const mine = m.role === "user";
					return (
						<div key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%" }}>
							<div
								style={{
									padding: "10px 14px",
									borderRadius: RAD.md,
									fontSize: FS.base,
									lineHeight: 1.55,
									whiteSpace: "pre-wrap",
									background: mine ? S.accent : S.bg,
									color: mine ? "#fff" : S.text,
									border: mine ? "none" : `1px solid ${S.border}`,
								}}
							>
								{m.content}
							</div>
							{!mine && m.actions?.length > 0 && (
								<div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
									{m.actions.map((a, idx) => (
										<Button
											key={idx}
											variant={a.applied ? "secondary" : "primary"}
											size="sm"
											disabled={a.applied}
											onClick={() => onApply(a, idx, i)}
											style={{ alignSelf: "flex-start", opacity: a.applied ? 0.6 : 1 }}
										>
											{a.applied && <Icon name="check" size={14} />}
											{a.label || `${a.field || a.type}`}
										</Button>
									))}
								</div>
							)}
						</div>
					);
				})}

				{busy && (
					<div style={{ alignSelf: "flex-start", color: S.textMuted, fontSize: 13, padding: "8px 4px" }}>
						<Badge color={S.accent}>thinking…</Badge>
					</div>
				)}
			</div>

			<div style={{ borderTop: `1px solid ${S.border}`, padding: 12, display: "flex", gap: 8 }}>
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
					placeholder="Ask about your plan…"
					style={{
						flex: 1,
						padding: "10px 14px",
						borderRadius: RAD.sm,
						border: `1px solid ${S.border}`,
						background: S.bg,
						color: S.text,
						fontSize: FS.base,
						outline: "none",
					}}
				/>
				<Button variant="primary" onClick={() => send()} disabled={busy || !input.trim()}>➤</Button>
			</div>
		</Card>
	);
}
