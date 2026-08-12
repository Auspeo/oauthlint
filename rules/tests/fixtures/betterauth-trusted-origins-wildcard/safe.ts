import { betterAuth } from "better-auth";

// Explicit origins, and a scoped subdomain wildcard, are legitimate and
// documented better-auth usage — they must NOT fire.
export const auth = betterAuth({
  trustedOrigins: [
    "https://app.example.com",
    "https://admin.example.com",
    "https://*.example.com",
  ],
});
