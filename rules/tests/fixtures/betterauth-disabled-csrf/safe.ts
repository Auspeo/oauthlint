import { betterAuth } from "better-auth";

// ok: CSRF / origin protection left at its secure default (enabled). The app
// simply lists the origins it trusts instead of disabling the check.
export const auth = betterAuth({
  trustedOrigins: ["https://app.example.com"],
  advanced: {
    useSecureCookies: true,
  },
});

export const auth2 = betterAuth({
  advanced: {
    // ok: explicitly keeping the checks on
    disableCSRFCheck: false,
    disableOriginCheck: false,
  },
});
