declare const password: string;
declare const token: string;
declare const apiKey: string;
declare const refreshToken: string;
declare const clientSecret: string;
declare const err: Error;
declare const logger: { info: (...a: unknown[]) => void; error: (...a: unknown[]) => void; debug: (...a: unknown[]) => void };

export function logPassword() {
  // ruleid: auth.flow.secret-in-log
  console.log(password);
}

export function logTokenWithLabel() {
  // ruleid: auth.flow.secret-in-log
  logger.info('user logged in', token);
}

export function logErrorWithApiKey() {
  // ruleid: auth.flow.secret-in-log
  console.error(err, apiKey);
}

export function logRefreshToken() {
  // ruleid: auth.flow.secret-in-log
  console.debug(refreshToken);
}

export function logInterpolatedToken() {
  // ruleid: auth.flow.secret-in-log
  console.log(`token=${token}`);
}

export function logClientSecretViaLogger() {
  // ruleid: auth.flow.secret-in-log
  logger.error('oauth exchange failed', clientSecret, err);
}
