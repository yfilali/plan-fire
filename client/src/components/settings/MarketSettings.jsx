import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { fmt, LOST_DECADE } from "../../engine.js";
import { Card, CardHeader, Segmented } from "../ui.jsx";
import SliderRow from "../SliderRow.jsx";

export default function MarketSettings() {
	const S = useTheme();
	const {
		marketMode, setMarketMode,
		nomReturn, setNomReturn,
		inflation, setInflation,
		realRet,
		projections,
	} = usePlanner();

	const lostYears = [...LOST_DECADE.map((r) => ({ r })), { r: nomReturn, tail: true }];

	return (
		<Card>
			<CardHeader
				icon="📈"
				title="Market assumptions"
				subtitle="Choose a return regime, then set the long-run average and inflation."
				right={
					<Segmented
						value={marketMode}
						onChange={setMarketMode}
						options={[
							{ value: "historical", label: "Historical", color: S.accent },
							{ value: "lost_decade", label: "Lost Decade", color: S.danger },
						]}
					/>
				}
			/>

			{/* Returns timeline preview */}
			<div style={{ marginBottom: 16, padding: 12, background: S.bg, borderRadius: 12, border: `1px solid ${S.border}` }}>
				<div style={{ fontSize: 10.5, color: S.textDim, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>
					{marketMode === "lost_decade" ? "Lost-decade return sequence" : "Steady return sequence"}
				</div>
				<div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
					{(marketMode === "lost_decade" ? lostYears : Array(11).fill({ r: nomReturn })).map((y, i) => {
						const r = y.r;
						const h = Math.max(4, Math.min(52, Math.abs(r) * 220));
						return (
							<div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
								<div style={{ width: "100%", height: h, borderRadius: 3, background: r < 0 ? S.danger : S.accent, opacity: y.tail ? 0.5 : 1 }} />
								<span style={{ fontSize: 8.5, color: r < 0 ? S.danger : S.textMuted, marginTop: 3, fontFamily: S.mono }}>
									{(r * 100).toFixed(0)}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			<div className="col-2">
				<SliderRow label="Nominal return" value={nomReturn} onChange={setNomReturn} min={0} max={0.15} step={0.0025} editScale={100} editMax={0.5} format={(v) => `${(v * 100).toFixed(2)}%`} />
				<SliderRow label="Inflation" value={inflation} onChange={setInflation} min={0} max={0.1} step={0.0025} editScale={100} editMax={0.3} format={(v) => `${(v * 100).toFixed(2)}%`} />
			</div>

			<div style={{ display: "flex", gap: 24, padding: "12px 14px", background: S.bg, borderRadius: 12, marginTop: 6, flexWrap: "wrap" }}>
				<div>
					<div style={{ fontSize: 11, color: S.textMuted }}>Real return</div>
					<div style={{ fontSize: 16, fontWeight: 750, color: S.accent, fontFamily: S.mono }}>{(realRet * 100).toFixed(1)}%</div>
				</div>
				<div>
					<div style={{ fontSize: 11, color: S.textMuted }}>Real growth on {fmt(projections.startPort)}</div>
					<div style={{ fontSize: 16, fontWeight: 750, color: S.blue, fontFamily: S.mono }}>
						{fmt(Math.round(projections.startPort * realRet))}/yr
					</div>
				</div>
			</div>
		</Card>
	);
}
