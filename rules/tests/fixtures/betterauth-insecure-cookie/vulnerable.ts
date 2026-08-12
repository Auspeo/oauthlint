import { betterAuth } from "better-auth";

// Forcing useSecureCookies off ships the session cookie without the Secure
// flag, so it travels over plain HTTP and can be sniffed.
export const auth = betterAuth({
  advanced: {
    // ruleid: auth.betterauth.insecure-cookie
    useSecureCookies: false,
  },
});

// Turning off secure/httpOnly via the cookie attribute defaults is the same
// class of bug.
export const auth2 = betterAuth({
  advanced: {
    defaultCookieAttributes: {
      // ruleid: auth.betterauth.insecure-cookie
      secure: false,
      // ruleid: auth.betterauth.insecure-cookie
      httpOnly: false,
    },
  },
});
