// ok: auth.jwt.in-url
export const goodLink = 'https://app.example.com/dashboard';

// ok: auth.jwt.in-url -- token in Authorization header, not URL
export function fetchWithToken(token: string) {
  return fetch('https://api.example.com/files/123', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
