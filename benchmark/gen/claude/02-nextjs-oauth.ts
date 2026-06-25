// "Login with Google" (OAuth2) for Next.js App Router — hand-rolled, no next-auth.
//
// This single file contains two route handlers. In a real project, split them:
//   app/api/auth/google/route.ts          -> export { GET as startLogin } as GET
//   app/api/auth/google/callback/route.ts -> export { GET as callback } as GET
// They are kept together here for a self-contained drop-in reference.
//
// Required env vars (.env.local):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REDIRECT_URI   e.g. http://localhost:3000/api/auth/google/callback
//   SESSION_SECRET        any long random string (used to sign the session cookie)
//
// Google Cloud Console: create an OAuth 2.0 Client (type "Web application")
// and register GOOGLE_REDIRECT_URI as an Authorized redirect URI.

import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT =
  "https://openidconnect.googleapis.com/v1/userinfo";

const OAUTH_STATE_COOKIE = "g_oauth_state";
const SESSION_COOKIE = "session";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

// ---------------------------------------------------------------------------
// Tiny signed-cookie helpers (HMAC-SHA256). Good enough for a session cookie;
// swap for iron-session / a real JWT lib if you need rotation, encryption, etc.
// ---------------------------------------------------------------------------

function sign(value: string): string {
  const sig = createHmac("sha256", env("SESSION_SECRET"))
    .update(value)
    .digest("base64url");
  return `${value}.${sig}`;
}

function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac("sha256", env("SESSION_SECRET"))
    .update(value)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

// ---------------------------------------------------------------------------
// GET /api/auth/google  — build the authorization URL and redirect to Google.
// ---------------------------------------------------------------------------

export async function startLogin(req: NextRequest): Promise<NextResponse> {
  // CSRF protection: random state echoed back by Google on the callback.
  const state = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    redirect_uri: env("GOOGLE_REDIRECT_URI"),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline", // ask for a refresh token
    prompt: "consent",
    include_granted_scopes: "true",
  });

  const res = NextResponse.redirect(`${GOOGLE_AUTH_ENDPOINT}?${params}`);

  // Store the signed state in a short-lived, httpOnly cookie to verify later.
  res.cookies.set(OAUTH_STATE_COOKIE, sign(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return res;
}

// ---------------------------------------------------------------------------
// GET /api/auth/google/callback — exchange code for tokens, read the profile.
// ---------------------------------------------------------------------------

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUserInfo {
  sub: string; // stable Google user id
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function callback(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const origin = url.origin;

  // User denied consent or Google returned an error.
  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 }
    );
  }

  // Verify state against the signed cookie (CSRF defense).
  const expectedState = unsign(req.cookies.get(OAUTH_STATE_COOKIE)?.value);
  if (!expectedState || expectedState !== state) {
    return NextResponse.json(
      { error: "Invalid OAuth state" },
      { status: 400 }
    );
  }

  // 1. Exchange the authorization code for tokens.
  let tokens: GoogleTokenResponse;
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env("GOOGLE_CLIENT_ID"),
        client_secret: env("GOOGLE_CLIENT_SECRET"),
        redirect_uri: env("GOOGLE_REDIRECT_URI"),
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error("Google token exchange failed:", tokenRes.status, detail);
      return NextResponse.json(
        { error: "Token exchange failed" },
        { status: 502 }
      );
    }

    tokens = (await tokenRes.json()) as GoogleTokenResponse;
  } catch (err) {
    console.error("Google token exchange error:", err);
    return NextResponse.json({ error: "Token exchange error" }, { status: 502 });
  }

  // 2. Fetch the user profile with the access token.
  let profile: GoogleUserInfo;
  try {
    const userRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });

    if (!userRes.ok) {
      const detail = await userRes.text();
      console.error("Google userinfo failed:", userRes.status, detail);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 502 }
      );
    }

    profile = (await userRes.json()) as GoogleUserInfo;
  } catch (err) {
    console.error("Google userinfo error:", err);
    return NextResponse.json({ error: "Userinfo error" }, { status: 502 });
  }

  if (!profile.email_verified) {
    return NextResponse.redirect(`${origin}/login?error=email_unverified`);
  }

  // 3. This is where you'd upsert the user in your DB and create a session.
  //    Here we just stash a minimal signed session cookie.
  const sessionPayload = JSON.stringify({
    sub: profile.sub,
    email: profile.email,
    name: profile.name ?? null,
    picture: profile.picture ?? null,
  });

  const res = NextResponse.redirect(`${origin}/`);

  res.cookies.set(SESSION_COOKIE, sign(sessionPayload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  // Clean up the one-time state cookie.
  res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });

  return res;
}

// ---------------------------------------------------------------------------
// Optional helper: read the current user out of the session cookie in any
// server component / route handler / middleware.
// ---------------------------------------------------------------------------

export function getSessionUser(req: NextRequest): {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
} | null {
  const raw = unsign(req.cookies.get(SESSION_COOKIE)?.value);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// To wire into the App Router, re-export per file:
//   // app/api/auth/google/route.ts
//   export { startLogin as GET } from "...";
//
//   // app/api/auth/google/callback/route.ts
//   export { callback as GET } from "...";
