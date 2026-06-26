// ruleid: auth.oauth.access-token-in-url
export function buildUrl(base: string, t: string) {
  return `${base}?access_token=${t}`;
}

// ruleid: auth.oauth.access-token-in-url
export function callbackUrl(rt: string) {
  return '/cb?refresh_token=' + rt;
}

// ruleid: auth.oauth.access-token-in-url
export function fetchResource(t: string) {
  return fetch(`https://api.example.com/me?fields=name&access_token=${t}`);
}

// ruleid: auth.oauth.access-token-in-url
export const idTokenLink =
  'https://app.example.com/dashboard?next=/home&id_token=abc123';
