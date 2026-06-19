declare const localStorage: Storage;

// ok: auth.jwt.localstorage -- not auth-related
export function storeFontPref(font: string) {
  localStorage.setItem('font_preference', font);
}

// These keys contain auth-word substrings but are NOT token storage —
// they must not be flagged (regression guards for the substring FP).
export function storeUiPrefs(name: string, n: number) {
  // ok: auth.jwt.localstorage -- "author" contains "auth"
  localStorage.setItem('author_filter', name);
  // ok: auth.jwt.localstorage -- "auto_refresh" contains "refresh"
  localStorage.setItem('auto_refresh', 'true');
  // ok: auth.jwt.localstorage -- "access_count" contains "access"
  localStorage.setItem('access_count', String(n));
  // ok: auth.jwt.localstorage -- "session" UI flag, not a token
  localStorage.setItem('sidebar_session_collapsed', '1');
}

// ok: auth.jwt.localstorage -- tokens stay in memory, not localStorage
let inMemoryToken: string | null = null;
export function setToken(t: string) {
  inMemoryToken = t;
}
export function getToken() {
  return inMemoryToken;
}
