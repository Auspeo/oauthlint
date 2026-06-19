import cors from 'cors';

// ruleid: auth.cors.wildcard-with-credentials
export const badCors = cors({
  origin: '*',
  credentials: true,
});

// ruleid: auth.cors.wildcard-with-credentials
export const badCorsReflective = cors({
  origin: true,
  credentials: true,
});

// ruleid: auth.cors.wildcard-with-credentials
export const badCorsReversed = cors({
  credentials: true,
  origin: '*',
});

// ruleid: auth.cors.wildcard-with-credentials -- echoes the request origin back
export const badCorsEcho = cors({
  origin: (_origin: string, cb: (e: null, ok: boolean) => void) => cb(null, true),
  credentials: true,
});

declare const res: { setHeader: (k: string, v: string) => void };
// ruleid: auth.cors.wildcard-with-credentials -- manual headers
export function manualCors() {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
