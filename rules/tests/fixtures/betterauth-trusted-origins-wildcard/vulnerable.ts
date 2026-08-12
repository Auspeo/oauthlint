import { betterAuth } from "better-auth";

// A fully-permissive wildcard in trustedOrigins disables better-auth's origin
// allow-list: any site can drive authenticated cross-origin requests (CSRF).
// ruleid: auth.betterauth.trusted-origins-wildcard
export const auth = betterAuth({
  trustedOrigins: ["*"],
});

// Protocol-only wildcards are just as permissive (match every host).
// ruleid: auth.betterauth.trusted-origins-wildcard
export const authHttps = betterAuth({
  trustedOrigins: ["https://app.example.com", "https://*"],
});
