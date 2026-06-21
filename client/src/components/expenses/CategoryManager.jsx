import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { uid, COLOR_OPTIONS } from "../../engine.js";
import { btnBase } from "../../lib/styles.js";
import { Modal, Button, TextInput } from "../ui.jsx";

const EMOJIS = ["📂","🏠","🚗","🍽️","🏥","✈️","🛡️","⚡","👤","🌎","📦","🎓","👶","🐕","🏋️","🎮","🎵","📱","💊","🧹","🎁","💈","🏖️","📚","🛒","💻","🍺","☕","⛽","🔧","🎭","🏕️","🎣","🛥️","📡","🌿","🏗️"];

export default function CategoryManager({ onClose }) {
	const S = useTheme();
	const { categories, expenses, addCategory, removeCategory } = usePlanner();
	const [draft, setDraft] = useState({ label: "", icon: "📂", color: COLOR_OPTIONS[0] });

	const addCat = () => {
		if (!draft.label.trim()) return;
		addCategory({ id: uid(), label: draft.label.trim(), icon: draft.icon, color: draft.color });
		setDraft({ label: "", icon: "📂", color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)] });
	};
	const removeCat = (catId) => {
		const n = expenses.filter((e) => e.cat === catId).length;
		if (n > 0 && !confirm(`Delete ${n} expense${n > 1 ? "s" : ""} in this category?`)) return;
		removeCategory(catId);
	};

	return (
		<Modal title="Manage categories" width={540} onClose={onClose}>
			<div style={{ padding: 14, background: S.bg, borderRadius: 12, marginBottom: 18, border: `1px solid ${S.border}` }}>
				<div style={{ fontSize: 11.5, color: S.textMuted, marginBottom: 7, fontWeight: 550 }}>Icon</div>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
					{EMOJIS.map((em) => (
						<button
							key={em}
							onClick={() => setDraft((p) => ({ ...p, icon: em }))}
							style={{ ...btnBase, width: 30, height: 30, borderRadius: 8, fontSize: 15, border: draft.icon === em ? `2px solid ${S.accent}` : `1px solid ${S.border}`, background: draft.icon === em ? S.accent + "22" : "transparent" }}
						>
							{em}
						</button>
					))}
				</div>
				<div style={{ fontSize: 11.5, color: S.textMuted, marginBottom: 7, fontWeight: 550 }}>Color</div>
				<div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
					{COLOR_OPTIONS.map((c) => (
						<button key={c} onClick={() => setDraft((p) => ({ ...p, color: c }))} style={{ ...btnBase, width: 24, height: 24, borderRadius: 12, background: c, border: draft.color === c ? `2px solid ${S.text}` : "2px solid transparent" }} />
					))}
				</div>
				<div style={{ display: "flex", gap: 8 }}>
					<div style={{ width: 38, height: 38, borderRadius: 9, background: draft.color + "22", border: `1px solid ${draft.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
						{draft.icon}
					</div>
					<TextInput placeholder="Category name" value={draft.label} onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addCat()} style={{ flex: 1 }} />
					<Button variant="primary" onClick={addCat}>＋ Add</Button>
				</div>
			</div>

			<div style={{ display: "grid", gap: 4 }}>
				{categories.map((cat) => (
					<div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, border: `1px solid ${S.border}` }}>
						<span style={{ fontSize: 16 }}>{cat.icon}</span>
						<span style={{ flex: 1, fontSize: 13, color: S.text }}>{cat.label}</span>
						<div style={{ width: 11, height: 11, borderRadius: 6, background: cat.color }} />
						<button onClick={() => removeCat(cat.id)} style={{ ...btnBase, padding: "3px 9px", borderRadius: 6, background: "transparent", color: S.danger, fontSize: 11, border: `1px solid ${S.border}` }}>✕</button>
					</div>
				))}
			</div>
		</Modal>
	);
}
