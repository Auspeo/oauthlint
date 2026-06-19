declare const localStorage: Storage;

// ok: auth.jwt.localstorage -- not auth-related
export function storeFontPref(font: string) {
  localStorage.setItem('font_preference', font);
}

// ok: auth.jwt.localstorage -- tokens stay in memory, not localStorage
let inMemoryToken: string | null = null;
export function setToken(t: string) {
  inMemoryToken = t;
}
export function getToken() {
  return inMemoryToken;
}
