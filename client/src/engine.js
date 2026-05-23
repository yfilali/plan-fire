// ── Projection Engine v2: Phase-Aware ────────────────────────────────

export const LOST_DECADE = [-0.15, -0.10, 0.05, -0.05, 0.02, 0.03, 0.04, 0.06, 0.08, 0.09];

/**
 * Calculate active monthly expenses for a given age + housing scenario.
 * Each expense can specify which scenarios it applies to and an age range.
 */
export function monthlySpendAtAge(expenses, age, scenario) {
  return expenses
    .filter(e => {
      const scenarioMatch = !e.scenarios || e.scenarios.includes('all') || e.scenarios.includes(scenario);
      const ageMatch = (e.ageMin == null || age >= e.ageMin) && (e.ageMax == null || age <= e.ageMax);
      return scenarioMatch && ageMatch;
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Full projection with dynamic year-by-year spending.
 */
export function project({
  startAge, endAge, retireAge, portfolio, expenses, scenario,
  nomReturn, inflation, ssAge, ssAnnual, rentalNet = 0,
  transition = null, workIncome = 0,
}) {
  const data = [];
  let b = portfolio;

  for (let a = startAge; a <= endAge; a++) {
    const yi = a - startAge;
    const thisNom = Array.isArray(nomReturn)
      ? (yi < nomReturn.length ? nomReturn[yi] : nomReturn[nomReturn.length - 1])
      : nomReturn;
    const rr = (1 + thisNom) / (1 + inflation) - 1;

    b *= (1 + rr);

    // Real estate transition event
    if (transition && a === transition.moveAge) {
      b += transition.netProceeds - transition.newHomeCost;
    }

    // Determine active scenario for this year (pre-move = stay, post-move = target)
    const activeScenario = (transition && a < transition.moveAge) ? 'stay' : scenario;

    // Dynamic spending based on age + active scenario
    const monthlySpend = monthlySpendAtAge(expenses, a, activeScenario);
    const annualSpend = monthlySpend * 12;

    // Income sources
    const isRetired = a >= retireAge;
    const ssIncome = a >= ssAge ? ssAnnual : 0;
    const rental = (activeScenario !== 'stay') ? Math.max(0, rentalNet) : 0;
    const income = (isRetired ? 0 : workIncome) + ssIncome + rental;

    // Net withdrawal (only if retired)
    if (isRetired) {
      b -= Math.max(0, annualSpend - income);
    } else {
      // Working: income covers spending, surplus goes to portfolio
      const surplus = workIncome - annualSpend;
      if (surplus > 0) b += surplus;
    }

    if (b < 0) b = 0;

    data.push({
      age: a, balance: Math.round(b),
      annualSpend: Math.round(annualSpend),
      income: Math.round(income),
      netWithdrawal: Math.round(isRetired ? Math.max(0, annualSpend - income) : 0),
      activeScenario,
    });
  }
  return data;
}

export function buildReturns(mode, nomAvg) {
  if (mode === 'lost_decade') return [...LOST_DECADE, nomAvg];
  return nomAvg;
}

// ── Helpers ──────────────────────────────────────────────────────────

export const fmt = v => {
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${Math.round(v / 1e3)}K`;
  if (v < 0) return `-${fmt(Math.abs(v))}`;
  return `$${Math.round(v)}`;
};

export const fmtFull = v => `$${Math.round(v).toLocaleString()}`;
export const uid = () => Math.random().toString(36).slice(2, 8);

export const COLOR_OPTIONS = [
  '#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6',
  '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#6b7280',
  '#a855f7', '#84cc16', '#06b6d4', '#e11d48', '#d946ef',
];

export const DEFAULT_CATEGORIES = [
  { id: 'housing_ba', label: 'Bay Area Housing', icon: '🏙️', color: '#6366f1' },
  { id: 'housing_cc', label: 'CC Housing', icon: '🌲', color: '#22c55e' },
  { id: 'transport', label: 'Transport', icon: '🚗', color: '#f59e0b' },
  { id: 'food', label: 'Food & Dining', icon: '🍽️', color: '#84cc16' },
  { id: 'health', label: 'Healthcare', icon: '🏥', color: '#ef4444' },
  { id: 'plane', label: 'Aviation', icon: '✈️', color: '#3b82f6' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️', color: '#8b5cf6' },
  { id: 'utils', label: 'Utilities', icon: '⚡', color: '#f97316' },
  { id: 'personal', label: 'Personal', icon: '👤', color: '#ec4899' },
  { id: 'travel', label: 'Travel', icon: '🌎', color: '#14b8a6' },
  { id: 'other', label: 'Other', icon: '📦', color: '#6b7280' },
];

export const SCENARIO_LABELS = {
  all: 'All Plans',
  stay: 'Stay BA Only',
  sell_move: 'Sell+CC Only',
  rent_out: 'Rent+CC Only',
};

export const DEFAULT_EXPENSES = [
  // Bay Area housing — only when staying
  { id: uid(), cat: 'housing_ba', name: 'Mortgage', amount: 2400, scenarios: ['stay'] },
  { id: uid(), cat: 'housing_ba', name: 'Property Tax', amount: 1200, scenarios: ['stay'] },
  { id: uid(), cat: 'housing_ba', name: 'Home Insurance', amount: 250, scenarios: ['stay'] },
  { id: uid(), cat: 'housing_ba', name: 'Maintenance', amount: 400, scenarios: ['stay'] },

  // Crescent City housing — when moving (sell or rent out SJ)
  { id: uid(), cat: 'housing_cc', name: 'CC Property Tax', amount: 850, scenarios: ['sell_move', 'rent_out'] },
  { id: uid(), cat: 'housing_cc', name: 'CC Home Insurance', amount: 200, scenarios: ['sell_move', 'rent_out'] },
  { id: uid(), cat: 'housing_cc', name: 'CC Maintenance', amount: 300, scenarios: ['sell_move', 'rent_out'] },

  // Healthcare — AGE-PHASED
  { id: uid(), cat: 'health', name: 'ACA Health Insurance (pre-Medicare)', amount: 1500, scenarios: ['all'], ageMax: 64 },
  { id: uid(), cat: 'health', name: 'Medicare + Medigap', amount: 400, scenarios: ['all'], ageMin: 65 },
  { id: uid(), cat: 'health', name: 'Medical/Dental OOP', amount: 200, scenarios: ['all'] },

  // Core living — all scenarios, all ages
  { id: uid(), cat: 'transport', name: 'Car Insurance & Gas', amount: 400, scenarios: ['all'] },
  { id: uid(), cat: 'food', name: 'Groceries', amount: 800, scenarios: ['all'] },
  { id: uid(), cat: 'food', name: 'Dining Out', amount: 600, scenarios: ['all'] },
  { id: uid(), cat: 'plane', name: 'Hangar', amount: 800, scenarios: ['all'] },
  { id: uid(), cat: 'plane', name: 'Fuel & Maintenance', amount: 1000, scenarios: ['all'] },
  { id: uid(), cat: 'plane', name: 'Plane Insurance', amount: 400, scenarios: ['all'] },
  { id: uid(), cat: 'insurance', name: 'Umbrella / Life', amount: 200, scenarios: ['all'] },
  { id: uid(), cat: 'utils', name: 'Electric, Water, Internet', amount: 350, scenarios: ['all'] },
  { id: uid(), cat: 'personal', name: 'Subscriptions & Shopping', amount: 500, scenarios: ['all'] },
  { id: uid(), cat: 'travel', name: 'Vacations / Trips', amount: 1000, scenarios: ['all'] },
  { id: uid(), cat: 'other', name: 'Misc / Buffer', amount: 500, scenarios: ['all'] },
];
