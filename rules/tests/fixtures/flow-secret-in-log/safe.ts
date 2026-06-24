declare const token: string;
declare const user: { id: string };
declare const userId: string;
declare const logger: { info: (...a: unknown[]) => void };

export function statusMessages() {
  // ok: auth.flow.secret-in-log -- literal status text, no secret value
  console.log('password updated');
  // ok: auth.flow.secret-in-log
  console.log('reset token sent');
  // ok: auth.flow.secret-in-log
  console.log('login ok');
}

export function nonSecretIdentifiers() {
  // ok: auth.flow.secret-in-log -- member access, not a secret-named identifier
  console.log(user.id);
  // ok: auth.flow.secret-in-log
  logger.info({ userId });
}

export function redactedToken() {
  // ok: auth.flow.secret-in-log -- redacted, the argument is an expression not a bare secret identifier
  console.log('token prefix', token.slice(0, 4));
}
