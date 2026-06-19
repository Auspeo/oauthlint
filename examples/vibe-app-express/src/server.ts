// DELIBERATELY VULNERABLE — see README.md
// Every block below intentionally hits one of the Wave-1 OAuthLint rules.

import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// ---------- auth.jwt.weak-secret + auth.jwt.no-expiration ----------
export function issueToken(uid: number) {
  return jwt.sign({ uid }, 'secret');
}

// ---------- auth.jwt.alg-none ----------
export function verifyToken(token: string) {
  return jwt.verify(token, 'secret', { algorithms: ['RS256', 'none'] });
}

// ---------- auth.oauth.hardcoded-secret ----------
export const oauthClient = {
  client_id: 'app-prod',
  client_secret: 'sk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ012345',
  redirect_uris: ['http://app.example.com/cb', 'https://app.example.com/*'],
};

// ---------- auth.oauth.no-state ----------
export function startLogin(_req: Request, res: Response) {
  const params = new URLSearchParams({
    client_id: 'app-prod',
    response_type: 'code',
    redirect_uri: 'https://app.example.com/cb',
    scope: 'openid email',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

// ---------- auth.cookie.no-secure ----------
export function login(res: Response, token: string) {
  res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
}

// ---------- auth.flow.password-plaintext ----------
declare const db: { users: { create: (data: unknown) => Promise<void> } };

interface SignupReq {
  body: { email: string; password: string };
}

export async function signup(req: SignupReq) {
  await db.users.create({
    email: req.body.email,
    password: req.body.password,
  });
}
