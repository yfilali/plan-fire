// ── AI co-pilot ─────────────────────────────────────────────────────────
//
// chat({messages, snapshot}) grounds a FIRE-planning assistant in the user's
// live plan numbers (the snapshot) and may propose Actions the client can apply.
// When ANTHROPIC_API_KEY is set it calls Claude (claude-opus-4-8) over raw HTTP;
// otherwise it synthesises a deterministic offline reply from the snapshot. It
// never throws to the caller — upstream failures degrade to a graceful reply.

const MODEL = 'claude-opus-4-8';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Supported Action types the client knows how to apply (client/src/lib/aiActions.js).
const SETTABLE_FIELDS = [
  'retireAge', 'ssAge', 'ssAnnual', 'inflation', 'nomReturn',
  'discretionaryCut', 'luxuryCut',
];

function fmtMoney(v) {
  if (v == null || isNaN(v)) return '$0';
  const n = Math.round(v);
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

// Compact, human-readable digest of the snapshot for grounding the model.
function describeSnapshot(s = {}) {
  const lines = [];
  if (s.age != null) lines.push(`Current age: ${s.age}`);
  if (s.retireAge != null) lines.push(`Retirement age: ${s.retireAge}`);
  if (s.portfolio != null) lines.push(`Investable portfolio: ${fmtMoney(s.portfolio)}`);
  if (s.spendNow != null) lines.push(`Spending now: ${fmtMoney(s.spendNow)}/yr`);
  if (s.effWR != null) lines.push(`Withdrawal rate: ${Number(s.effWR).toFixed(1)}%`);
  if (s.nomReturn != null) lines.push(`Assumed nominal return: ${(s.nomReturn * 100).toFixed(1)}%`);
  if (s.inflation != null) lines.push(`Assumed inflation: ${(s.inflation * 100).toFixed(1)}%`);
  if (s.ssAge != null) lines.push(`Social Security starts: age ${s.ssAge} (${fmtMoney(s.ssAnnual)}/yr)`);
  if (s.runsOut) lines.push(`Portfolio depletes at age ${s.runsOut.age || s.runsOut}`);
  else lines.push('Portfolio never runs out under the active plan');
  if (s.activePlanLabel) lines.push(`Active plan: ${s.activePlanLabel}`);
  return lines.join('\n');
}

function systemPrompt(snapshot) {
  return [
    'You are PlanFire Co-pilot, a grounded FIRE (financial-independence / early-retirement) planning assistant embedded in a retirement-planner app.',
    'Answer ONLY using the user\'s real plan numbers in the snapshot below — cite the actual figures, never invent data.',
    'Be concise, warm, and concrete. Prefer specific dollar amounts and ages from the snapshot.',
    '',
    'You may PROPOSE up to two actions the user can apply with one tap. When you do, append a single fenced code block at the very end of your reply, tagged `firly-actions`, containing a JSON array of actions. Use ONLY these shapes:',
    `  { "type": "set_field", "field": <one of ${SETTABLE_FIELDS.join('|')}>, "value": <number>, "label": "<short human label>" }`,
    '  { "type": "create_plan", "name": "<plan name>", "basePlanId": "<optional id>", "patch": { <optional field overrides> }, "label": "<short human label>" }',
    'For decimals: nomReturn and inflation are fractions (e.g. 0.05), discretionaryCut/luxuryCut are fractions 0..1, ages and ssAnnual are plain numbers.',
    'Only include the code block when an action genuinely helps. Never mention the JSON block in your prose.',
    '',
    'PLAN SNAPSHOT:',
    describeSnapshot(snapshot),
  ].join('\n');
}

// Extract a trailing ```firly-actions``` JSON block, returning { text, actions }.
function extractActions(reply) {
  const fence = /```firly-actions\s*([\s\S]*?)```/i;
  const m = reply.match(fence);
  if (!m) return { text: reply.trim(), actions: [] };
  let actions = [];
  try {
    const parsed = JSON.parse(m[1].trim());
    if (Array.isArray(parsed)) actions = parsed.filter(validAction);
  } catch {
    // Malformed block — drop it silently.
  }
  const text = reply.replace(fence, '').trim();
  return { text, actions };
}

function validAction(a) {
  if (!a || typeof a !== 'object') return false;
  if (a.type === 'set_field') {
    return SETTABLE_FIELDS.includes(a.field) && typeof a.value === 'number';
  }
  if (a.type === 'create_plan') {
    return typeof a.name === 'string';
  }
  return false;
}

// Deterministic offline reply derived from the snapshot.
function offlineReply(messages, snapshot = {}) {
  const wr = snapshot.effWR != null ? Number(snapshot.effWR) : null;
  const parts = ['(offline demo) '];
  const actions = [];

  if (snapshot.runsOut) {
    const depAge = snapshot.runsOut.age || snapshot.runsOut;
    parts.push(`Heads up — under the active plan your portfolio depletes around age ${depAge}. `);
    if (snapshot.retireAge != null) {
      parts.push(`Delaying retirement a couple of years (to ${snapshot.retireAge + 2}) is one of the most effective fixes. `);
      actions.push({
        type: 'set_field',
        field: 'retireAge',
        value: snapshot.retireAge + 2,
        label: `Retire at ${snapshot.retireAge + 2}`,
      });
    }
  } else if (wr != null) {
    if (wr <= 4) {
      parts.push(`Your withdrawal rate is ${wr.toFixed(1)}%, comfortably within the 4% rule — your money is projected to last. `);
    } else {
      parts.push(`Your withdrawal rate is ${wr.toFixed(1)}%, above the 4% rule of thumb. Trimming discretionary spending in down years helps. `);
      const cur = snapshot.discretionaryCut != null ? snapshot.discretionaryCut : 0.3;
      actions.push({
        type: 'set_field',
        field: 'discretionaryCut',
        value: Math.min(0.6, cur + 0.1),
        label: 'Trim discretionary spend in downturns',
      });
    }
  } else {
    parts.push('Ask me about your withdrawal rate, when your money runs out, or how changing your retirement age affects the plan. ');
  }

  parts.push('Connect an Anthropic API key on the server for full, live answers.');
  return { reply: parts.join(''), actions: actions.slice(0, 1) };
}

export async function chat({ messages = [], snapshot = {} } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Sanitise the conversation to the {role, content} pairs Claude expects.
  const convo = (messages || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content }));

  if (!apiKey) {
    return offlineReply(convo, snapshot);
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt(snapshot),
        messages: convo.length ? convo : [{ role: 'user', content: 'Give me a quick read on my retirement plan.' }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('AI upstream error:', res.status, detail.slice(0, 300));
      return {
        reply: '(offline) I could not reach the AI service just now. Based on your plan, you can still review your withdrawal rate and run-out age on the dashboard.',
        actions: [],
      };
    }

    const data = await res.json();
    const raw = Array.isArray(data.content)
      ? data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
      : '';
    const { text, actions } = extractActions(raw || 'I had trouble forming a response — try rephrasing.');
    return { reply: text, actions };
  } catch (err) {
    console.error('AI chat failed:', err.message);
    return {
      reply: '(offline) The AI service is unavailable right now, but your plan numbers are all live on the dashboard.',
      actions: [],
    };
  }
}
