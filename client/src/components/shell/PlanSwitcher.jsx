import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { btnBase } from "../../lib/styles.js";
import { Button, Modal, TextInput, Field } from "../ui.jsx";

const Chevron = (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M6 9l6 6 6-6" />
	</svg>
);

export default function PlanSwitcher() {
	const S = useTheme();
	const {
		plans,
		activePlanId,
		activePlan,
		setActivePlanId,
		addPlan,
		updatePlan,
		removePlan,
	} = usePlanner();

	const [open, setOpen] = useState(false);
	const [dialog, setDialog] = useState(null); // {mode:'new'|'rename'|'duplicate', name}
	const ref = useRef(null);

	useEffect(() => {
		if (!open) return;
		const onDoc = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open]);

	const submitDialog = () => {
		const name = dialog.name.trim();
		if (!name) return;
		if (dialog.mode === "new") addPlan(name);
		else if (dialog.mode === "duplicate")
			addPlan(name, { duplicateFrom: activePlanId });
		else updatePlan(activePlanId, { name });
		setDialog(null);
		setOpen(false);
	};

	return (
		<div style={{ position: "relative" }} ref={ref}>
			<button
				onClick={() => setOpen((o) => !o)}
				style={{
					...btnBase,
					display: "inline-flex",
					alignItems: "center",
					gap: 8,
					padding: "7px 12px",
					borderRadius: 10,
					background: S.card,
					border: `1px solid ${S.border}`,
					color: S.text,
					fontSize: 13,
					fontWeight: 600,
					maxWidth: 220,
				}}
			>
				<span
					style={{
						width: 7,
						height: 7,
						borderRadius: 4,
						background: S.accent,
						flexShrink: 0,
					}}
				/>
				<span
					style={{
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{activePlan?.name || "Plan"}
				</span>
				<span style={{ color: S.textMuted, display: "inline-flex" }}>
					{Chevron}
				</span>
			</button>

			{open && (
				<div
					className="fade-in"
					style={{
						position: "absolute",
						top: "calc(100% + 6px)",
						left: 0,
						width: 270,
						background: S.surface,
						border: `1px solid ${S.border}`,
						borderRadius: 12,
						boxShadow: S.shadow,
						padding: 6,
						zIndex: 60,
					}}
				>
					<div
						style={{
							fontSize: 10.5,
							textTransform: "uppercase",
							letterSpacing: 0.6,
							color: S.textDim,
							fontWeight: 600,
							padding: "6px 10px 4px",
						}}
					>
						Your plans
					</div>
					<div style={{ maxHeight: 240, overflowY: "auto" }}>
						{plans.map((p) => {
							const on = p.id === activePlanId;
							return (
								<button
									key={p.id}
									onClick={() => {
										setActivePlanId(p.id);
										setOpen(false);
									}}
									style={{
										...btnBase,
										display: "flex",
										alignItems: "center",
										gap: 9,
										width: "100%",
										padding: "8px 10px",
										borderRadius: 8,
										background: on ? S.cardHover : "transparent",
										color: S.text,
										fontSize: 13,
										fontWeight: on ? 650 : 500,
										textAlign: "left",
									}}
								>
									<span style={{ fontSize: 15, flexShrink: 0 }}>{p.icon}</span>
									<span
										style={{
											flex: 1,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{p.name}
									</span>
									{on && (
										<span style={{ color: S.accent, fontSize: 13 }}>✓</span>
									)}
								</button>
							);
						})}
					</div>
					<div
						style={{
							height: 1,
							background: S.border,
							margin: "6px 4px",
						}}
					/>
					{[
						{ label: "＋  New plan", fn: () => setDialog({ mode: "new", name: "" }) },
						{
							label: "⧉  Duplicate current",
							fn: () =>
								setDialog({
									mode: "duplicate",
									name: `${activePlan?.name} copy`,
								}),
						},
						{
							label: "✎  Rename current",
							fn: () =>
								setDialog({ mode: "rename", name: activePlan?.name || "" }),
						},
					].map((a) => (
						<button
							key={a.label}
							onClick={a.fn}
							style={{
								...btnBase,
								display: "block",
								width: "100%",
								padding: "8px 10px",
								borderRadius: 8,
								background: "transparent",
								color: S.textMuted,
								fontSize: 12.5,
								fontWeight: 550,
								textAlign: "left",
							}}
						>
							{a.label}
						</button>
					))}
					{plans.length > 1 && (
						<button
							onClick={() => {
								if (confirm(`Delete plan "${activePlan?.name}"?`))
									removePlan(activePlanId);
								setOpen(false);
							}}
							style={{
								...btnBase,
								display: "block",
								width: "100%",
								padding: "8px 10px",
								borderRadius: 8,
								background: "transparent",
								color: S.danger,
								fontSize: 12.5,
								fontWeight: 550,
								textAlign: "left",
							}}
						>
							🗑  Delete current
						</button>
					)}
				</div>
			)}

			{dialog && (
				<Modal
					title={
						dialog.mode === "new"
							? "New plan"
							: dialog.mode === "duplicate"
								? "Duplicate plan"
								: "Rename plan"
					}
					width={420}
					onClose={() => setDialog(null)}
					footer={
						<>
							<Button variant="ghost" onClick={() => setDialog(null)}>
								Cancel
							</Button>
							<Button variant="primary" onClick={submitDialog}>
								{dialog.mode === "rename" ? "Save" : "Create"}
							</Button>
						</>
					}
				>
					<Field label="Plan name">
						<TextInput
							autoFocus
							value={dialog.name}
							placeholder="e.g. Retire at 55, Lean budget…"
							onChange={(e) =>
								setDialog((d) => ({ ...d, name: e.target.value }))
							}
							onKeyDown={(e) => e.key === "Enter" && submitDialog()}
						/>
					</Field>
				</Modal>
			)}
		</div>
	);
}
