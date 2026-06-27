// ─────────────────────────────────────────────────────────────────────────
//  FIRE milestones — pure, unit-tested.
//
//  Given the projection rows (from engine.project) and a few inputs, derive the
//  ages at which the plan crosses meaningful thresholds: net-worth marks, FI,
//  Coast-FIRE, and (worst case) depletion. Each milestone carries the age it is
//  reached (or null if never within the horizon).
// ─────────────────────────────────────────────────────────────────────────

const WORTH_MARKS = [
	{ key: "nw500k", label: "$500k net worth", value: 500_000 },
	{ key: "nw1m", label: "$1M net worth", value: 1_000_000 },
	{ key: "nw2m", label: "$2M net worth", value: 2_000_000 },
];

// First row whose net worth (falls back to balance) reaches `target`.
function ageAtWorth(rows, target) {
	const hit = rows.find((r) => (r.netWorth ?? r.balance ?? 0) >= target);
	return hit ? hit.age : null;
}

// First age where guaranteed income + a 4% safe withdrawal covers annual spend.
function ageAtFI(rows) {
	const hit = rows.find(
		(r) => (r.income || 0) + 0.04 * (r.balance || 0) >= (r.annualSpend || 0) && (r.annualSpend || 0) > 0,
	);
	return hit ? hit.age : null;
}

// Coast-FIRE: earliest age whose balance, compounded at `realRet` to retireAge
// with NO further contributions, would reach `fiNumber`.
function ageAtCoast(rows, { retireAge, fiNumber, realRet }) {
	if (!fiNumber || fiNumber <= 0) return null;
	const r = Math.max(0, realRet || 0);
	const hit = rows.find((row) => {
		if (row.age > retireAge) return false;
		const yearsToRetire = Math.max(0, retireAge - row.age);
		const grown = (row.balance || 0) * (1 + r) ** yearsToRetire;
		return grown >= fiNumber;
	});
	return hit ? hit.age : null;
}

// First retirement-era age where the balance is depleted (<= 0), else null.
function ageAtDepletion(rows, retireAge) {
	const hit = rows.find((r) => r.age >= retireAge && (r.balance || 0) <= 0);
	return hit ? hit.age : null;
}

export function computeMilestones(rows = [], opts = {}) {
	const { age = 0, retireAge = 65, fiNumber = 0, realRet = 0.03 } = opts;

	const out = [];

	const coastAge = ageAtCoast(rows, { retireAge, fiNumber, realRet });
	out.push({
		key: "coast",
		label: "Coast-FIRE",
		age: coastAge,
		value: fiNumber,
		reached: coastAge != null && coastAge <= age,
	});

	const fiAge = ageAtFI(rows);
	out.push({
		key: "fi",
		label: "Financial independence",
		age: fiAge,
		value: fiNumber,
		reached: fiAge != null && fiAge <= age,
	});

	for (const m of WORTH_MARKS) {
		const a = ageAtWorth(rows, m.value);
		out.push({ key: m.key, label: m.label, age: a, value: m.value, reached: a != null && a <= age });
	}

	const depAge = ageAtDepletion(rows, retireAge);
	out.push({
		key: "depletion",
		label: depAge == null ? "Never runs out" : "Portfolio depletes",
		age: depAge,
		value: 0,
		reached: depAge != null && depAge <= age,
	});

	// Order by age; nulls (unreached) sink to the end, depletion-never stays last.
	return out.sort((x, y) => {
		if (x.key === "depletion") return 1;
		if (y.key === "depletion") return -1;
		const ax = x.age == null ? Infinity : x.age;
		const ay = y.age == null ? Infinity : y.age;
		return ax - ay;
	});
}
