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
