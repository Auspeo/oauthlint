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
