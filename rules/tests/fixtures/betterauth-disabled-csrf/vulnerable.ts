import { betterAuth } from "better-auth";

// Disabling better-auth's CSRF / origin checks removes the origin-header and
// Fetch-Metadata validation that protects state-changing auth requests.
export const auth = betterAuth({
  advanced: {
    // ruleid: auth.betterauth.disabled-csrf
    disableCSRFCheck: true,
  },
});

export const auth2 = betterAuth({
  advanced: {
    // ruleid: auth.betterauth.disabled-csrf
    disableOriginCheck: true,
  },
});
