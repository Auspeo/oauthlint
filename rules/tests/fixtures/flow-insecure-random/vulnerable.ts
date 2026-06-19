// ruleid: auth.flow.insecure-random
const csrfToken = Math.random();

// ruleid: auth.flow.insecure-random
const sessionId = Math.random().toString(36);

// ruleid: auth.flow.insecure-random
const otpCode = Math.random();

// ruleid: auth.flow.insecure-random
const resetCode = Math.random().toString(36);

// ruleid: auth.flow.insecure-random -- the most common insecure-token idiom
const apiToken = Math.random().toString(36).slice(2);

// ruleid: auth.flow.insecure-random
const verifyToken = Math.random().toString(36).substring(2);

// ruleid: auth.flow.insecure-random -- Math.floor wrapper
const sessionIdNum = Math.floor(Math.random() * 1e9);

// ruleid: auth.flow.insecure-random -- var, not const/let
var legacyToken = Math.random().toString(36);

class Session {
  resetToken = '';
  rotate() {
    // ruleid: auth.flow.insecure-random -- member assignment
    this.resetToken = Math.random().toString(36).slice(2);
  }
}

export { csrfToken, sessionId, otpCode, resetCode, apiToken, verifyToken, sessionIdNum, legacyToken, Session };
