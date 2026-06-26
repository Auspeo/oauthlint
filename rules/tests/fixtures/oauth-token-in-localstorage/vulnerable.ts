declare const localStorage: Storage;
declare const sessionStorage: Storage;

export function storeAccess(token: string) {
  // ruleid: auth.oauth.token-in-localstorage
  localStorage.setItem('access_token', token);
}

export function storeRefresh(rt: string) {
  // ruleid: auth.oauth.token-in-localstorage -- sessionStorage is no safer against XSS
  sessionStorage.setItem('refresh_token', rt);
}

export function storeId(idToken: string) {
  // ruleid: auth.oauth.token-in-localstorage
  localStorage.setItem('id_token', idToken);
}

export function storeAccessCamel(token: string) {
  // ruleid: auth.oauth.token-in-localstorage -- camelCase accessToken key
  localStorage.setItem('accessToken', token);
}

export function storeRefreshCamel(rt: string) {
  // ruleid: auth.oauth.token-in-localstorage
  sessionStorage.setItem('refreshToken', rt);
}

export function storeIdProp(t: string) {
  // ruleid: auth.oauth.token-in-localstorage -- property-form write
  localStorage.idToken = t;
}

export function storeAccessBracket(t: string) {
  // ruleid: auth.oauth.token-in-localstorage -- bracket-form write
  localStorage['access_token'] = t;
}

export function storeViaWindow(token: string) {
  // ruleid: auth.oauth.token-in-localstorage
  window.localStorage.setItem('id_token', token);
}
