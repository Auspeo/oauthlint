import cors from 'cors';

declare const res: { setHeader: (k: string, v: string) => void };

// ok: auth.cors.null-origin -- single explicit real origin
export const singleOrigin = cors({
  origin: 'https://app.example.com',
  credentials: true,
});

// ok: auth.cors.null-origin -- allowlist array with only real origins
export const allowlistOrigin = cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
});

// ok: auth.cors.null-origin -- `null` keyword (not the string), out of scope
export const keywordNullOrigin = cors({
  origin: null,
  credentials: true,
});

// ok: auth.cors.null-origin -- static real origin in a manual header write
export function manualRealOrigin() {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.example.com');
}
