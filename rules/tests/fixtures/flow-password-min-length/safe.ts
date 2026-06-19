import { z } from 'zod';

// ok: auth.flow.password-min-length
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

// ok: auth.flow.password-min-length
export const tightSchema = z.object({
  password: z.string().min(8).max(128),
});
