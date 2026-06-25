import { usePlanner } from "../../state/PlannerProvider.jsx";
import { fmt } from "../../engine.js";
import { Card, CardHeader } from "../ui.jsx";
import SliderRow from "../SliderRow.jsx";

export default function ProfileSettings() {
	const {
		age, setAge,
		retireAge, setRetireAge,
		portfolio,
		ssAge, setSsAge,
		ssAnnual, setSsAnnual,
	} = usePlanner();

	return (
		<Card>
			<CardHeader icon="👤" title="Profile" subtitle="Your age, retirement timing, and Social Security. Investable portfolio is the sum of your liquid assets — manage it on the Assets tab." />
			<div className="col-2">
				<div>
					<SliderRow label="Current age" value={age} onChange={setAge} min={18} max={90} step={1} editMax={110} format={(v) => `${v}`} />
					<SliderRow
						label="Retirement age"
						value={retireAge}
						onChange={setRetireAge}
						min={30}
						max={95}
						step={1}
						editMax={110}
						format={(v) => (v === age ? `${v} (now)` : v < age ? `${v} (retired)` : `${v}`)}
					/>
				</div>
				<div>
					<SliderRow label="Social Security start age" value={ssAge} onChange={setSsAge} min={62} max={70} step={1} format={(v) => `${v}`} />
					<SliderRow label="Social Security annual" value={ssAnnual} onChange={setSsAnnual} min={0} max={100000} step={1000} format={fmt} />
				</div>
			</div>
			<div
				style={{
					marginTop: 4,
					padding: "10px 13px",
					background: "var(--bg)",
					border: "1px solid var(--border)",
					borderRadius: 10,
					display: "flex",
					alignItems: "baseline",
					justifyContent: "space-between",
					gap: 12,
					flexWrap: "wrap",
				}}
			>
				<span style={{ fontSize: 12, color: "var(--text-muted)" }}>
					Investable portfolio (from liquid assets in this plan)
				</span>
				<span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--accent)" }}>
					{fmt(portfolio)}
				</span>
			</div>
		</Card>
	);
}
