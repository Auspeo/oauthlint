// ruleid: auth.flow.insecure-random
const csrfToken = Math.random();

// ruleid: auth.flow.insecure-random
const sessionId = Math.random().toString(36);

// ruleid: auth.flow.insecure-random
const otpCode = Math.random();

// ruleid: auth.flow.insecure-random
const resetCode = Math.random().toString(36);

export { csrfToken, sessionId, otpCode, resetCode };
