// ok: auth.oauth.access-token-in-url -- token sent in the Authorization header, not the URL
export function callApi(accessToken: string) {
  return fetch('https://api.example.com/data', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ok: auth.oauth.access-token-in-url -- token in a POST body object property, not a URL query param
export function exchange(accessToken: string) {
  return fetch('https://api.example.com/token', {
    method: 'POST',
    body: JSON.stringify({ access_token: accessToken }),
  });
}

// ok: auth.oauth.access-token-in-url -- a non-token query parameter
export const pagedUrl = 'https://api.example.com/items?page=2';

// ok: auth.oauth.access-token-in-url -- the bare word access_token in a comment is not a URL param
export const note = 'remember to refresh the access_token before it expires';
