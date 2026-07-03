import { useMemo, useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { useMarketHistory, allocFromAssets, DEFAULT_ALLOC } from "../../lib/marketHistory.js";
import { sliceSeries, classStats, blendedStats, normalizeAlloc } from "../../lib/backtest.js";
import { usePro } from "../../lib/pro.js";
import { Badge, Button } from "../ui.jsx";
import UpgradeModal from "./UpgradeModal.jsx";

const pct = (v, dp = 1) => `${v >= 0 ? "" : "−"}${Math.abs(v * 100).toFixed(dp)}%`;
const mult = (v) => `${v.toFixed(v >= 10 ? 0 : 1)}×`;

// Class id → display color. Theme palette keys, except gold gets a metallic
// constant since the theme has no gold token.
function classColor(S, id) {
	const map = {
		stocks: S.accent,
		tbonds: S.blue,
		corp: S.purple,
		realEstate: S.warning,
		gold: "#d4af37",
		tbills: S.textMuted,
	};
	return map[id] || S.text;
}

// Allocation presets the user can apply in one tap.
const ALLOC_PRESETS = {
	Balanced: DEFAULT_ALLOC,
	"60/40": { stocks: 0.6, tbonds: 0.4 },
	Aggressive: { stocks: 0.85, realEstate: 0.1, gold: 0.05 },
	Conservative: { stocks: 0.3, tbonds: 0.4, corp: 0.15, tbills: 0.15 },
	"All stocks": { stocks: 1 },
};

/* ── Sparkline ─────────────────────────────────────────────────────────── */
function Sparkline({ points, color, width = 96, height = 30 }) {
	if (!points || points.length < 2) return null;
	const min = Math.min(...points);
	const max = Math.max(...points);
	const span = max - min || 1;
	const dx = width / (points.length - 1);
	const d = points
		.map((p, i) => `${i === 0 ? "M" : "L"}${(i * dx).toFixed(1)} ${(height - ((p - min) / span) * height).toFixed(1)}`)
		.join(" ");
	const last = points[points.length - 1];
	const up = last >= 1;
	return (
		<svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
			<path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" opacity={up ? 1 : 0.85} />
		</svg>
	);
}

/* ── Per-asset-class performance card ──────────────────────────────────── */
function AssetClassCard({ cls, stats, active, weight }) {
	const S = useTheme();
	const c = classColor(S, cls.id);
	const cagrColor = stats.cagr >= 0 ? S.accent : S.danger;
	return (
		<div
			style={{
				padding: "12px 13px",
				borderRadius: 12,
				background: S.card,
				border: `1px solid ${active ? c + "88" : S.border}`,
				boxShadow: active ? `0 0 0 1px ${c}33` : "none",
				display: "flex",
				flexDirection: "column",
				gap: 8,
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 7 }}>
				<span style={{ fontSize: 15 }}>{cls.icon}</span>
				<span style={{ fontSize: 12, fontWeight: 650, color: S.text }}>{cls.short}</span>
				<span style={{ flex: 1 }} />
				{active && weight > 0 && (
					<Badge color={c}>{Math.round(weight * 100)}%</Badge>
				)}
			</div>

			<div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
				<div>
					<div style={{ fontSize: 21, fontWeight: 780, color: cagrColor, fontFamily: S.mono, lineHeight: 1 }}>
						{pct(stats.cagr)}
					</div>
					<div style={{ fontSize: 9.5, color: S.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
						per year
					</div>
				</div>
				<Sparkline points={stats.growth} color={c} />
			</div>

			<div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: S.textMuted }}>
				<span title="Total growth over the window">{mult(stats.growth[stats.growth.length - 1])} total</span>
				<span title="Deepest peak-to-trough fall" style={{ color: stats.maxDrawdown < -0.001 ? S.danger : S.textMuted }}>
					{stats.maxDrawdown < -0.001 ? `${pct(stats.maxDrawdown, 0)} max drop` : "no drop"}
				</span>
			</div>
			{stats.best && stats.worst && (
				<div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: S.textDim, fontFamily: S.mono }}>
					<span style={{ color: S.accent }}>▲ {stats.best.year} {pct(stats.best.ret, 0)}</span>
					<span style={{ color: S.danger }}>▼ {stats.worst.year} {pct(stats.worst.ret, 0)}</span>
				</div>
			)}
		</div>
	);
}

/* ── Allocation slider row ─────────────────────────────────────────────── */
function AllocRow({ cls, weight, normPct, onChange }) {
	const S = useTheme();
	const c = classColor(S, cls.id);
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
			<span style={{ width: 96, fontSize: 12, color: S.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
				<span style={{ width: 7, height: 7, borderRadius: 4, background: c, flexShrink: 0 }} />
				{cls.short}
			</span>
			<input
				type="range"
				min={0}
				max={100}
				step={5}
				value={Math.round(weight * 100)}
				onChange={(e) => onChange(Number(e.target.value) / 100)}
				style={{ flex: 1, accentColor: c }}
			/>
			<span style={{ width: 42, textAlign: "right", fontSize: 12.5, fontWeight: 650, fontFamily: S.mono, color: normPct > 0 ? S.text : S.textDim }}>
				{Math.round(normPct * 100)}%
			</span>
		</div>
	);
}

/* ── Summary stat ──────────────────────────────────────────────────────── */
function Stat({ label, value, color, S }) {
	return (
		<div>
			<div style={{ fontSize: 10, color: S.textMuted, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
			<div style={{ fontSize: 17, fontWeight: 750, color: color || S.text, fontFamily: S.mono, marginTop: 2 }}>{value}</div>
		</div>
	);
}

/* ── Main panel ────────────────────────────────────────────────────────── */
export default function TimeMachine() {
	const S = useTheme();
	const [pro, setPro] = usePro();
	const [showUpgrade, setShowUpgrade] = useState(false);
	const { data: hist, loaded, error } = useMarketHistory();
	const {
		backtestStart, setBacktestStart,
		backtestEnd, setBacktestEnd,
		setBacktestWindow,
		backtestAlloc, setBacktestAlloc,
		backtestRepeat, setBacktestRepeat,
		assets, activePlanId,
	} = usePlanner();

	const alloc = backtestAlloc || DEFAULT_ALLOC;
	const norm = useMemo(() => normalizeAlloc(alloc), [alloc]);

	const { records, classStatsList, blended } = useMemo(() => {
		if (!hist) return { records: [], classStatsList: [], blended: null };
		const recs = sliceSeries(hist.series, backtestStart, backtestEnd);
		return {
			records: recs,
			classStatsList: hist.classes.map((cls) => ({ cls, stats: classStats(recs, cls.id) })),
			blended: recs.length ? blendedStats(recs, alloc) : null,
		};
	}, [hist, backtestStart, backtestEnd, alloc]);

	if (error) {
		return (
			<div style={{ padding: 16, fontSize: 13, color: S.textMuted, textAlign: "center" }}>
				Couldn't load the historical dataset. Check your connection and reload.
			</div>
		);
	}
	if (!loaded || !hist) {
		return (
			<div style={{ padding: 28, textAlign: "center", color: S.textMuted, fontSize: 13 }}>
				Loading a century of market history…
			</div>
		);
	}

	const { meta, eras } = hist;
	const span = Math.abs(backtestEnd - backtestStart) + 1;
	// One atomic write — two separate setters would clobber each other.
	const setYears = ([a, b]) => setBacktestWindow(a, b);
	const clampStart = (y) => setBacktestStart(Math.min(Math.max(meta.minYear, y), backtestEnd));
	const clampEnd = (y) => setBacktestEnd(Math.max(Math.min(meta.maxYear, y), backtestStart));
	const matchAssets = () => {
		const a = allocFromAssets(assets, activePlanId);
		if (a) setBacktestAlloc(a);
	};
	const activeEra = eras.find((e) => e.years[0] === backtestStart && e.years[1] === backtestEnd);

	const panel = (
		<div style={{ display: "grid", gap: 16 }}>
			{/* Era presets */}
			<div>
				<div style={{ fontSize: 10.5, color: S.textMuted, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>
					Jump to an era
				</div>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
					{eras.map((e) => {
						const on = e.id === activeEra?.id;
						return (
							<button
								key={e.id}
								onClick={() => setYears(e.years)}
								title={e.blurb}
								style={{
									cursor: "pointer",
									padding: "6px 12px",
									borderRadius: 9,
									border: `1.5px solid ${on ? S.accent : S.border}`,
									background: on ? S.accent + "14" : S.card,
									color: on ? S.accent : S.textMuted,
									fontSize: 12,
									fontWeight: on ? 650 : 550,
									display: "flex",
									alignItems: "center",
									gap: 6,
								}}
							>
								<span>{e.icon}</span>
								{e.label}
								<span style={{ fontFamily: S.mono, opacity: 0.7, fontSize: 11 }}>
									'{String(e.years[0]).slice(2)}–'{String(e.years[1]).slice(2)}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Window sliders */}
			<div style={{ background: S.bg, borderRadius: 12, border: `1px solid ${S.border}`, padding: 14 }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
					<span style={{ fontSize: 13, fontWeight: 650, color: S.text }}>
						{activeEra ? activeEra.label : "Custom window"}
					</span>
					<span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono }}>
						{backtestStart}–{backtestEnd} · {span} yr{span !== 1 ? "s" : ""}
					</span>
				</div>
				<div className="col-2" style={{ display: "grid", gap: 12 }}>
					<label style={{ display: "block" }}>
						<div style={{ fontSize: 11, color: S.textMuted, marginBottom: 4 }}>Start year</div>
						<input type="range" min={meta.minYear} max={meta.maxYear} step={1} value={backtestStart}
							onChange={(e) => clampStart(Number(e.target.value))} style={{ width: "100%", accentColor: S.accent }} />
					</label>
					<label style={{ display: "block" }}>
						<div style={{ fontSize: 11, color: S.textMuted, marginBottom: 4 }}>End year</div>
						<input type="range" min={meta.minYear} max={meta.maxYear} step={1} value={backtestEnd}
							onChange={(e) => clampEnd(Number(e.target.value))} style={{ width: "100%", accentColor: S.accent }} />
					</label>
				</div>
			</div>

			{/* Per-asset-class performance */}
			<div>
				<div style={{ fontSize: 10.5, color: S.textMuted, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>
					What each asset class did, {backtestStart}–{backtestEnd}
				</div>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
					{classStatsList.map(({ cls, stats }) => (
						<AssetClassCard key={cls.id} cls={cls} stats={stats} active={(norm[cls.id] || 0) > 0} weight={norm[cls.id] || 0} />
					))}
				</div>
			</div>

			{/* Allocation editor */}
			<div style={{ background: S.bg, borderRadius: 12, border: `1px solid ${S.border}`, padding: 14 }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
					<span style={{ fontSize: 13, fontWeight: 650, color: S.text }}>Your allocation</span>
					<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
						<Button size="sm" variant="secondary" onClick={matchAssets}>⌖ Match my assets</Button>
						{Object.keys(ALLOC_PRESETS).map((name) => (
							<Button key={name} size="sm" variant="ghost" onClick={() => setBacktestAlloc(ALLOC_PRESETS[name])}>{name}</Button>
						))}
					</div>
				</div>
				<div style={{ display: "grid", gap: 9 }}>
					{hist.classes.map((cls) => (
						<AllocRow
							key={cls.id}
							cls={cls}
							weight={alloc[cls.id] || 0}
							normPct={norm[cls.id] || 0}
							onChange={(w) => setBacktestAlloc({ ...alloc, [cls.id]: w })}
						/>
					))}
				</div>
			</div>

			{/* Blended outcome */}
			{blended && (
				<div style={{
					display: "flex", flexWrap: "wrap", gap: 24, padding: "14px 16px", borderRadius: 12,
					background: `linear-gradient(135deg, ${S.accent}10, ${S.blue}0c)`, border: `1px solid ${S.accent}33`,
				}}>
					<Stat S={S} label="Your mix · CAGR" value={pct(blended.cagr)} color={blended.cagr >= 0 ? S.accent : S.danger} />
					<Stat S={S} label="After inflation" value={pct(blended.realCagr)} color={blended.realCagr >= 0 ? S.text : S.danger} />
					<Stat S={S} label="Total growth" value={mult(blended.growth[blended.growth.length - 1])} />
					<Stat S={S} label="Worst drawdown" value={blended.maxDrawdown < -0.001 ? pct(blended.maxDrawdown, 0) : "—"} color={blended.maxDrawdown < -0.05 ? S.danger : S.text} />
				</div>
			)}

			{/* Repeat toggle + projection note */}
			<div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: S.textMuted, flexWrap: "wrap" }}>
				<label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
					<input type="checkbox" checked={!!backtestRepeat} onChange={(e) => setBacktestRepeat(e.target.checked)} style={{ accentColor: S.accent }} />
					Loop this era for the whole retirement
				</label>
				<span style={{ flex: 1 }} />
				<span style={{ fontSize: 11, color: S.textDim, maxWidth: 280, textAlign: "right", lineHeight: 1.5 }}>
					{backtestRepeat
						? "The era's returns repeat year after year through your projection."
						: "After the window, your portfolio continues at the steady return set below."}
				</span>
			</div>
		</div>
	);

	if (!pro) {
		return (
			<>
				<div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
					<div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.6, maxHeight: 360, overflow: "hidden" }}>
						{panel}
					</div>
					<div style={{
						position: "absolute", inset: 0, display: "flex", flexDirection: "column",
						alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center",
						padding: 24, background: `${S.surface}cc`, backdropFilter: "blur(1px)",
					}}>
						<div style={{ fontSize: 30 }}>⏳</div>
						<div style={{ fontSize: 17, fontWeight: 750, color: S.text }}>Unlock the Time Machine</div>
						<div style={{ fontSize: 13, color: S.textMuted, maxWidth: 360, lineHeight: 1.5 }}>
							Replay any real market era — {meta.minYear}–{meta.maxYear} — across stocks, bonds, gold, real estate and cash, on your actual portfolio.
						</div>
						<Button variant="primary" size="lg" onClick={() => setShowUpgrade(true)}>Upgrade to PlanFIRE Pro</Button>
					</div>
				</div>
				{showUpgrade && (
					<UpgradeModal
						onClose={() => setShowUpgrade(false)}
						onUnlock={() => { setPro(true); setShowUpgrade(false); }}
					/>
				)}
			</>
		);
	}

	return panel;
}
