import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { useMarketHistory } from "../../lib/marketHistory.js";

// The "Active: …" label on the projection card, made interactive: a quick
// dropdown to switch market regime, or replay a real era (Time Machine).
export default function RegimeSelector() {
	const S = useTheme();
	const { marketMode, setMarketMode, backtestStart, backtestEnd, setHistoricalEra, projections } = usePlanner();
	const { data: hist } = useMarketHistory();
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		if (!open) return;
		const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
		const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
		document.addEventListener("mousedown", onDoc);
		document.addEventListener("keydown", onKey);
		return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
	}, [open]);

	const eras = hist?.eras || [];
	const isPeriod = marketMode === "historical_period";
	const labelColor = marketMode === "lost_decade" ? S.danger : isPeriod ? S.blue : S.accent;
	const activeEraId = isPeriod ? eras.find((e) => e.years[0] === backtestStart && e.years[1] === backtestEnd)?.id : null;

	const pickRegime = (mode) => { setMarketMode(mode); setOpen(false); };
	const pickEra = (e) => {
		setHistoricalEra(e.years[0], e.years[1]);
		setOpen(false);
	};

	const Row = ({ on, color, onClick, children }) => (
		<button
			onClick={onClick}
			style={{
				display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
				padding: "8px 10px", borderRadius: 8, cursor: "pointer",
				border: `1px solid ${on ? (color || S.accent) : "transparent"}`,
				background: on ? (color || S.accent) + "14" : "transparent",
				color: S.text, fontSize: 12.5, fontWeight: on ? 650 : 500,
			}}
			onMouseEnter={(ev) => { if (!on) ev.currentTarget.style.background = S.cardHover; }}
			onMouseLeave={(ev) => { if (!on) ev.currentTarget.style.background = "transparent"; }}
		>
			{children}
		</button>
	);

	const sectionLabel = (txt, right) => (
		<div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px 5px", fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>
			{txt}<span style={{ flex: 1 }} />{right}
		</div>
	);

	return (
		<div ref={ref} style={{ position: "relative" }}>
			<button
				onClick={() => setOpen((o) => !o)}
				title="Change market regime or replay an era"
				style={{
					display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
					padding: "4px 9px", borderRadius: 8, fontSize: 12,
					background: open ? S.cardHover : "transparent",
					border: `1px solid ${open ? S.border : "transparent"}`,
					color: S.textMuted,
				}}
				onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = S.cardHover; }}
				onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
			>
				Active:{" "}
				<span style={{ color: labelColor, fontWeight: 650 }}>{projections.primaryLabel}</span>
				<span style={{ fontSize: 9, color: S.textDim, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}>▾</span>
			</button>

			{open && (
				<div
					style={{
						position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 60,
						width: 264, maxHeight: 360, overflowY: "auto",
						background: S.surface, border: `1px solid ${S.borderStrong}`, borderRadius: 12,
						boxShadow: S.shadowLg, padding: 6,
					}}
				>
					{sectionLabel("Market regime")}
					<Row on={marketMode === "historical"} color={S.accent} onClick={() => pickRegime("historical")}>
						<span>📈</span> Historical average
					</Row>

					<div style={{ height: 1, background: S.border, margin: "6px 4px" }} />

					{sectionLabel("⏳ Replay an era")}

					{eras.length === 0 && (
						<div style={{ padding: "6px 10px", fontSize: 11.5, color: S.textDim }}>Loading eras…</div>
					)}

					{eras.map((e) => (
						<Row key={e.id} on={e.id === activeEraId} color={S.blue} onClick={() => pickEra(e)}>
							<span>{e.icon}</span>
							<span style={{ flex: 1 }}>{e.label}</span>
							<span style={{ fontFamily: S.mono, fontSize: 10.5, color: S.textDim }}>
								'{String(e.years[0]).slice(2)}–'{String(e.years[1]).slice(2)}
							</span>
						</Row>
					))}
				</div>
			)}
		</div>
	);
}
