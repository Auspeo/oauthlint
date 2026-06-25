declare const localStorage: Storage;
declare const sessionStorage: Storage;

export function storeBad(token: string) {
  // ruleid: auth.jwt.localstorage
  localStorage.setItem('access_token', token);
}

export function storeBad2(refresh: string) {
  // ruleid: auth.jwt.localstorage
  localStorage.setItem('refresh_token', refresh);
}

export function storeBad3(jwtVal: string) {
  // ruleid: auth.jwt.localstorage
  localStorage['authToken'] = jwtVal;
}

export function storeBad4(token: string) {
  // ruleid: auth.jwt.localstorage
  window.localStorage.setItem('jwt', token);
}

export function storeBad5(token: string) {
  // ruleid: auth.jwt.localstorage -- sessionStorage is no safer against XSS
  sessionStorage.setItem('access_token', token);
}

const TOKEN_STORAGE_KEY = 'app.session';
export function storeBad6(token: string) {
  // ruleid: auth.jwt.localstorage -- key is a variable, but the value is the token
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}
