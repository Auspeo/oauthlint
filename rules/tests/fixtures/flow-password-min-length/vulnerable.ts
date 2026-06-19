import { z } from 'zod';

// ruleid: auth.flow.password-min-length
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ruleid: auth.flow.password-min-length
export const resetSchema = z.object({
  password: z.string().min(4),
  confirm: z.string(),
});

// ruleid: auth.flow.password-min-length -- custom-message form
export const customMsgSchema = z.object({
  password: z.string().min(6, 'Password too short'),
});
