declare const localStorage: Storage;
declare const sessionStorage: Storage;

// ok: auth.oauth.token-in-localstorage -- non-token key, must not match
export function storeTheme() {
  localStorage.setItem('theme', 'dark');
}

// ok: auth.oauth.token-in-localstorage -- arbitrary UI prefs are not tokens
export function storeUiPrefs(name: string) {
  localStorage.setItem('username', name);
  localStorage.setItem('sidebar_collapsed', '1');
  sessionStorage.setItem('last_route', '/dashboard');
}

// ok: auth.oauth.token-in-localstorage -- token kept in memory, never persisted
let inMemoryAccessToken: string | null = null;
export function setAccessToken(t: string) {
  inMemoryAccessToken = t;
}
export function getAccessToken() {
  return inMemoryAccessToken;
}

// ok: auth.oauth.token-in-localstorage -- server sets a Secure HttpOnly cookie
export function buildAuthCookie(token: string): string {
  return `session=${token}; Secure; HttpOnly; SameSite=Strict`;
}
