declare const localStorage: Storage;

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
