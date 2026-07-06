// ── Authentication (Better Auth) ────────────────────────────────────────
//
// Real auth backed by Neon Postgres:
//   • email + password (with email verification + password reset)
//   • Google OAuth   (when GOOGLE_CLIENT_ID / _SECRET are set)
//   • Facebook OAuth (when FACEBOOK_CLIENT_ID / _SECRET are set)
//
// Better Auth owns every route under /api/auth/*. Transactional email goes
// through Resend; with no RESEND_API_KEY the link is logged to the console so
// local dev stays self-service.
//
// Guest mode is local-storage only by design — the server never stores or
// even identifies anonymous visitors individually, so there is nothing here
// for one guest to leak to another. On first sign-in, the client uploads its
// local cache and we fold it into the new account (see the
// /api/account/claim-guest route in app.js).

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { fromNodeHeaders } from 'better-auth/node';
import { Resend } from 'resend';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { user, session, account, verification } from './db/schema.js';

const RESEND_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes between resend requests
const RESEND_MAX_ATTEMPTS = 3; // lifetime cap on explicit resend requests
// Where a verification link lands once confirmed — the planner (Better Auth
// signs the user in first, since autoSignInAfterVerification is on below),
// flagged so AppShell can show a one-time confirmation banner. Signup's own
// automatic send sets this same value client-side (see AuthProvider.jsx).
const VERIFY_CALLBACK_URL = '/app?verified=1';

// ── Email transport ──
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'PlanFIRE <onboarding@resend.dev>';

export function hasEmailTransport() {
  return !!resend;
}

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log(`✉️  [dev email] to=${to} | ${subject}\n${html}\n`);
    return;
  }
  try {
    await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
  } catch (err) {
    console.error('Resend send failed:', err?.message || err);
  }
}

function emailShell(title, intro, url, cta) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#111">${title}</h2>
      <p style="color:#444;line-height:1.5">${intro}</p>
      <p style="margin:24px 0">
        <a href="${url}" style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${cta}</a>
      </p>
      <p style="color:#888;font-size:12px">If the button doesn't work, paste this link:<br>${url}</p>
    </div>`;
}

// ── Better Auth instance ──
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || undefined,
  secret:
    process.env.BETTER_AUTH_SECRET ||
    (process.env.NODE_ENV === 'production' ? undefined : 'dev-insecure-secret'),
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : undefined,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Fires when someone signs up with an email that already has an account.
    // Better Auth always returns the same generic "created" response either
    // way (so this can't be used to probe which emails are registered) — this
    // hook is the one place we get the *real* existing user to act on behind
    // that response. If they never verified, this is indistinguishable from
    // them just wanting another link, so send one — through the same
    // throttle (10min cooldown / 3 lifetime attempts) as the login screen's
    // explicit resend button, since both draw from the same budget.
    onExistingUserSignUp: async ({ user: u }) => {
      await requestVerificationResend(u.email);
    },
    sendResetPassword: async ({ user: u, url }) => {
      await sendEmail({
        to: u.email,
        subject: 'Reset your PlanFIRE password',
        html: emailShell(
          'Reset your password',
          'We received a request to reset your PlanFIRE password.',
          url,
          'Reset password',
        ),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user: u, url }) => {
      await sendEmail({
        to: u.email,
        subject: 'Verify your email — PlanFIRE',
        html: emailShell(
          'Confirm your email',
          'Welcome to PlanFIRE. Confirm your email to finish setting up your account.',
          url,
          'Verify email',
        ),
      });
      // Shared by signup's automatic send and requestVerificationResend below
      // — stamping it here means the cooldown starts the moment ANY
      // verification email goes out, not just explicit resends.
      await db
        .update(user)
        .set({ verificationEmailSentAt: new Date() })
        .where(eq(user.id, u.id));
    },
  },

  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.FACEBOOK_CLIENT_ID
      ? {
          facebook: {
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          },
        }
      : {}),
  },

  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24, // refresh once a day
  },

  advanced: {
    // Behind Vercel's TLS proxy in production.
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});

// Which social providers are actually configured — surfaced to the client so
// it can hide buttons that won't work.
export function enabledProviders() {
  return {
    google: !!process.env.GOOGLE_CLIENT_ID,
    facebook: !!process.env.FACEBOOK_CLIENT_ID,
  };
}

// Rate-limited "resend verification email", for the login screen's
// EMAIL_NOT_VERIFIED case. Signing up never goes through this — that always
// gets its one automatic email via sendOnSignUp above — this only gates
// explicit resend requests: at most once every 10 minutes, 3 times ever.
// Always resolves { ok: true } for an unknown/already-verified email so the
// endpoint can't be used to probe which addresses have accounts.
export async function requestVerificationResend(email) {
  const normalized = email.trim().toLowerCase();
  const [row] = await db.select().from(user).where(eq(user.email, normalized));
  if (!row || row.emailVerified) return { ok: true };

  const lastSent = row.verificationEmailSentAt
    ? new Date(row.verificationEmailSentAt).getTime()
    : 0;
  const elapsed = Date.now() - lastSent;
  if (lastSent && elapsed < RESEND_COOLDOWN_MS) {
    return {
      ok: false,
      code: 'RATE_LIMITED',
      retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
    };
  }
  if (row.verificationResendCount >= RESEND_MAX_ATTEMPTS) {
    return { ok: false, code: 'MAX_ATTEMPTS' };
  }

  await auth.api.sendVerificationEmail({
    body: { email: normalized, callbackURL: VERIFY_CALLBACK_URL },
  });
  await db
    .update(user)
    .set({ verificationResendCount: row.verificationResendCount + 1 })
    .where(eq(user.id, row.id));
  return { ok: true };
}

// Resolve the acting identity for an API request: the Better Auth session
// when signed in, otherwise just "guest" — there is no server-side guest
// identity at all, since guest data lives only in the browser. Returns
// { uid, guest, user }; uid is null for guests (nothing server-side is keyed
// on it).
export async function resolveUser(req) {
  const result = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (result?.user) {
    return { uid: result.user.id, guest: false, user: result.user };
  }
  return { uid: null, guest: true, user: null };
}
