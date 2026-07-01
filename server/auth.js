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
// Anonymous visitors still get a stable guest id (the `firly_guest` cookie) so
// their work persists before they sign up; on first sign-in we fold that guest
// state into the account (see migrateGuestState / the /api/account/claim-guest
// route in app.js).

import { randomBytes } from 'crypto';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { fromNodeHeaders } from 'better-auth/node';
import { Resend } from 'resend';
import { db } from './db/index.js';
import { user, session, account, verification } from './db/schema.js';

export const GUEST_COOKIE = 'firly_guest';
const GUEST_TTL = 60 * 24 * 60 * 60 * 1000; // 60 days

// ── Email transport ──
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Firely <onboarding@resend.dev>';

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
    sendResetPassword: async ({ user: u, url }) => {
      await sendEmail({
        to: u.email,
        subject: 'Reset your Firely password',
        html: emailShell(
          'Reset your password',
          'We received a request to reset your Firely password.',
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
        subject: 'Verify your email — Firely',
        html: emailShell(
          'Confirm your email',
          'Welcome to Firely. Confirm your email to finish setting up your account.',
          url,
          'Verify email',
        ),
      });
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

// Resolve the acting identity for an API request: the Better Auth session when
// signed in, otherwise a guest id from (or freshly minted into) the guest
// cookie. Returns { uid, guest, user, setCookie? }.
export async function resolveUser(req) {
  const result = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (result?.user) {
    return { uid: result.user.id, guest: false, user: result.user };
  }

  const cookies = req.cookies || {};
  const existing = cookies[GUEST_COOKIE];
  if (existing) return { uid: existing, guest: true, user: null };

  const fresh = 'guest_' + randomBytes(12).toString('hex');
  return {
    uid: fresh,
    guest: true,
    user: null,
    setCookie: { name: GUEST_COOKIE, value: fresh, maxAge: GUEST_TTL },
  };
}
