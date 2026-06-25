import cors from 'cors';

declare const res: { setHeader: (k: string, v: string) => void };

// ok: auth.cors.reflect-origin -- single explicit origin
export const singleOrigin = cors({
  origin: 'https://app.example.com',
  credentials: true,
});

// ok: auth.cors.reflect-origin -- explicit allowlist array
export const allowlistOrigin = cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
});

// ok: auth.cors.reflect-origin -- regex allowlist, not dynamic reflection
export const regexOrigin = cors({
  origin: /\.example\.com$/,
  credentials: true,
});

// ok: auth.cors.reflect-origin -- callback validates against an allowlist
const allow = new Set(['https://app.example.com']);
export const checkedOrigin = cors({
  origin: (origin: string, cb: (e: null, ok: boolean) => void) => cb(null, allow.has(origin)),
  credentials: true,
});

// ok: auth.cors.reflect-origin -- block callback gates cb(null, true) behind an allowlist
export const checkedOriginBlock = cors({
  origin: (origin: string, cb: (e: Error | null, ok?: boolean) => void) => {
    if (!origin) return cb(null, true);
    if (allow.has(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed`));
  },
  credentials: true,
});

// ok: auth.cors.reflect-origin -- function-form callback gated by an allowlist check
export const checkedOriginFn = cors({
  origin: function (origin: string, cb: (e: Error | null, ok?: boolean) => void) {
    if (allow.has(origin)) {
      return cb(null, true);
    }
    return cb(new Error('not allowed'));
  },
  credentials: true,
});

// ok: auth.cors.reflect-origin -- static, explicit header value
export function manualStatic() {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com');
}
