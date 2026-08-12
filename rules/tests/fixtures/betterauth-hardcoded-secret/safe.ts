import { betterAuth } from "better-auth";

// Secret read from the environment (better-auth's documented fallback chain:
// options.secret > BETTER_AUTH_SECRET > AUTH_SECRET).
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET as string,
  emailAndPassword: {
    enabled: true,
  },
});

// Placeholder secrets in scaffolding must not fire.
export const scaffold = betterAuth({
  secret: "your-better-auth-secret-here",
});
