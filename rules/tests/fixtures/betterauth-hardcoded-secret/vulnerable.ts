import { betterAuth } from "better-auth";

// A hard-coded better-auth secret: signs/encrypts every session cookie and
// token. Committed to git it lets an attacker forge sessions for any user.
// ruleid: auth.betterauth.hardcoded-secret
export const auth = betterAuth({
  secret: "sup3r-s3cret-signing-value-committed",
  emailAndPassword: {
    enabled: true,
  },
});
