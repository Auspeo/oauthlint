/**
 * Canonical external URLs for the CWE / OWASP identifiers carried by rules.
 *
 * Kept small and explicit so it stays correct and maintainable: the OWASP
 * mapping only covers the codes actually used in the pack today
 * (`API1/API2/API4/API8:2023` and `A01/A02/A05/A07:2021`). Unknown codes fall
 * back to the relevant edition's index page rather than guessing a deep link.
 */

/** `CWE-347` -> `https://cwe.mitre.org/data/definitions/347.html`. */
export function cweUrl(cwe: string): string | undefined {
  const num = /^CWE-(\d+)$/i.exec(cwe.trim())?.[1];
  if (!num) return undefined;
  return `https://cwe.mitre.org/data/definitions/${num}.html`;
}

// API Security Top 10 (2023) edition index + per-risk slugs.
const API_2023_INDEX = 'https://owasp.org/API-Security/editions/2023/en/';
const API_2023_SLUGS: Record<string, string> = {
  API1: '0xa1-broken-object-level-authorization',
  API2: '0xa2-broken-authentication',
  API4: '0xa4-unrestricted-resource-consumption',
  API8: '0xa8-security-misconfiguration',
};

// Web Application Top 10 (2021) index + per-risk slugs.
const TOP10_2021_INDEX = 'https://owasp.org/Top10/';
const TOP10_2021_SLUGS: Record<string, string> = {
  A01: 'A01_2021-Broken_Access_Control',
  A02: 'A02_2021-Cryptographic_Failures',
  A05: 'A05_2021-Security_Misconfiguration',
  A07: 'A07_2021-Identification_and_Authentication_Failures',
};

/**
 * Map an OWASP code to its canonical page.
 *  - `API<n>:2023` -> API Security Top 10 (2023) risk page.
 *  - `A<nn>:2021`  -> Web Application Top 10 (2021) risk page.
 * Falls back to the edition index for an unmapped code in a known edition,
 * and returns `undefined` for an unrecognised format.
 */
export function owaspUrl(owasp: string): string | undefined {
  const trimmed = owasp.trim();

  const api = /^(API\d+):2023$/i.exec(trimmed);
  if (api) {
    const slug = API_2023_SLUGS[api[1].toUpperCase()];
    return slug ? `${API_2023_INDEX}${slug}/` : API_2023_INDEX;
  }

  const web = /^(A\d{2}):2021$/i.exec(trimmed);
  if (web) {
    const slug = TOP10_2021_SLUGS[web[1].toUpperCase()];
    return slug ? `${TOP10_2021_INDEX}${slug}/` : TOP10_2021_INDEX;
  }

  return undefined;
}
