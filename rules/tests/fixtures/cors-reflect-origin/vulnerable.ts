import cors from 'cors';

declare const res: {
  setHeader: (k: string, v: string) => void;
  header: (k: string, v: string) => void;
  set: (k: string, v: string) => void;
};
declare const req: { headers: Record<string, string>; header: (k: string) => string; get: (k: string) => string };

// ruleid: auth.cors.reflect-origin -- echoes req origin into ACAO
export function manualReflect() {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// ruleid: auth.cors.reflect-origin -- res.header() reflecting origin
export function reflectViaHeader() {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
}

// ruleid: auth.cors.reflect-origin -- origin: true echoes the request origin
export const reflectiveCors = cors({
  origin: true,
  credentials: true,
});

// ruleid: auth.cors.reflect-origin -- callback unconditionally accepts everything
export const allowAllCors = cors({
  origin: (_origin: string, cb: (e: null, ok: boolean) => void) => cb(null, true),
  credentials: true,
});
