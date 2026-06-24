import cors from 'cors';

declare const res: {
  setHeader: (k: string, v: string) => void;
  header: (k: string, v: string) => void;
  set: (k: string, v: string) => void;
};

// ruleid: auth.cors.null-origin -- ACAO set to the literal string "null"
export function manualNullOrigin() {
  res.setHeader('Access-Control-Allow-Origin', 'null');
}

// ruleid: auth.cors.null-origin -- cors() middleware allows the "null" origin
export const nullOriginCors = cors({
  origin: 'null',
  credentials: true,
});

// ruleid: auth.cors.null-origin -- allowlist literal contains "null"
export const allowlistWithNull = cors({
  origin: ['https://app.example.com', 'null'],
  credentials: true,
});

// ruleid: auth.cors.null-origin -- allowlist variable contains "null"
const allowed = ['https://app.example.com', 'null'];
export const indirectNullOrigin = cors({
  origin: allowed,
  credentials: true,
});
