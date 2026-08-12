import { betterAuth } from "better-auth";

// Secure cookies forced on (or simply left at better-auth's secure defaults).
export const auth = betterAuth({
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    },
  },
});
