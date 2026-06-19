// ok: auth.session.id-in-url -- regular query strings, no credentials
export const goodLink = '/api/profile?include=settings';

// ok: auth.session.id-in-url -- Authorization header is the right place
export function fetchWithAuth(url: string, token: string) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
