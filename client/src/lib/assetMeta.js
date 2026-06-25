// Asset presentation + classification helpers. Assets live in one shared
// pool (like expenses), each tagged with `.plans`. Liquid assets sum into a
// plan's starting investable portfolio; real estate is modeled per-plan with
// keep/sell/rent actions and its own sale/rental economics.

// The most common asset types for a retirement plan. `tone` is a palette key
// resolved against the active theme. `liquid: true` means the asset's value
// feeds the investable portfolio that grows at the market return.
export const ASSET_TYPES = [
	{
		id: "cash",
		label: "Cash & savings",
		short: "Cash",
		icon: "💵",
		tone: "blue",
		liquid: true,
		blurb: "Checking, savings, money-market, CDs, emergency fund.",
	},
	{
		id: "investment",
		label: "Brokerage / taxable",
		short: "Brokerage",
		icon: "📈",
		tone: "accent",
		liquid: true,
		blurb: "Taxable investment accounts — stocks, ETFs, bonds.",
	},
	{
		id: "retirement",
		label: "Retirement accounts",
		short: "Retirement",
		icon: "🏦",
		tone: "purple",
		liquid: true,
		blurb: "401(k), 403(b), Traditional / Roth IRA, HSA.",
	},
	{
		id: "property",
		label: "Real estate",
		short: "Real estate",
		icon: "🏠",
		tone: "warning",
		liquid: false,
		blurb: "Homes and rentals — kept, sold, or rented out per plan.",
	},
	{
		id: "other",
		label: "Other assets",
		short: "Other",
		icon: "💎",
		tone: "textMuted",
		liquid: true,
		blurb: "Crypto, business equity, private investments, collectibles.",
	},
];

const BY_ID = Object.fromEntries(ASSET_TYPES.map((t) => [t.id, t]));

export const assetType = (id) => BY_ID[id] || BY_ID.other;
export const isLiquid = (id) => assetType(id).liquid;
export const assetColor = (S, id) => S[assetType(id).tone] || S.text;

// Whether an asset participates in a given plan (mirrors expense tagging).
export const assetInPlan = (asset, planId) =>
	!asset.plans || asset.plans.includes("all") || asset.plans.includes(planId);
