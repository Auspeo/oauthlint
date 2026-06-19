import cors from 'cors';

// ok: auth.cors.wildcard-with-credentials -- wildcard, no credentials
export const publicApi = cors({
  origin: '*',
  credentials: false,
});

// ok: auth.cors.wildcard-with-credentials -- credentials with explicit allow-list
export const authedApi = cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
});

// ok: auth.cors.wildcard-with-credentials -- callback validates against an allow-list
const allow = new Set(['https://app.example.com']);
export const checkedApi = cors({
  origin: (origin: string, cb: (e: null, ok: boolean) => void) => cb(null, allow.has(origin)),
  credentials: true,
});

declare const res: { setHeader: (k: string, v: string) => void };
// ok: auth.cors.wildcard-with-credentials -- explicit origin, not wildcard
export function manualOk() {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
