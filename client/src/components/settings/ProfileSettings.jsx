import { usePlanner } from "../../state/PlannerProvider.jsx";
import { fmt } from "../../engine.js";
import { Card, CardHeader } from "../ui.jsx";
import SliderRow from "../SliderRow.jsx";

export default function ProfileSettings() {
	const {
		age, setAge,
		retireAge, setRetireAge,
		portfolio, setPortfolio,
		ssAge, setSsAge,
		ssAnnual, setSsAnnual,
	} = usePlanner();

	return (
		<Card>
			<CardHeader icon="👤" title="Profile" subtitle="Your age, retirement timing, investable portfolio, and Social Security." />
			<div className="col-2">
				<div>
					<SliderRow label="Current age" value={age} onChange={setAge} min={40} max={65} step={1} format={(v) => `${v}`} />
					<SliderRow label="Retirement age" value={retireAge} onChange={setRetireAge} min={age} max={70} step={1} format={(v) => (v === age ? `${v} (now)` : `${v}`)} />
					<SliderRow label="Portfolio" value={portfolio} onChange={setPortfolio} min={1e6} max={1e7} step={100000} format={fmt} />
				</div>
				<div>
					<SliderRow label="Social Security start age" value={ssAge} onChange={setSsAge} min={62} max={70} step={1} format={(v) => `${v}`} />
					<SliderRow label="Social Security annual" value={ssAnnual} onChange={setSsAnnual} min={0} max={60000} step={2000} format={fmt} />
				</div>
			</div>
		</Card>
	);
}
