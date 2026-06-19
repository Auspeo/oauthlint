declare const hashedPassword: string;
declare const submittedToken: string;
declare const expectedHmac: string;
declare const apiKey: string;

export function loginBad(input: string) {
  // ruleid: auth.flow.timing-unsafe-compare
  return input === hashedPassword;
}

export function checkApiKey(provided: string) {
  // ruleid: auth.flow.timing-unsafe-compare
  return provided === apiKey;
}

export function verifyHmac(actualHmac: string) {
  // ruleid: auth.flow.timing-unsafe-compare
  return expectedHmac !== actualHmac;
}

export function loginLoose(input: string) {
  // ruleid: auth.flow.timing-unsafe-compare -- loose equality is just as unsafe
  return input == hashedPassword;
}
