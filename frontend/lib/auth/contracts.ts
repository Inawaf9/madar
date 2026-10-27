import { z } from "zod";
export const roleSchema = z.enum(["USER", "ADMIN"]);
export const safeSessionSchema = z.object({
  userId: z.number().int().positive().max(2147483647),
  email: z.email(),
  role: roleSchema,
});
export type SafeSession = z.infer<typeof safeSessionSchema>;
export const authResponseSchema = safeSessionSchema.extend({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  refreshToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
export const passwordSchema = z
  .string()
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])\S{8,64}$/);
const email = z.string().trim().toLowerCase().pipe(z.email());
const notBlank = z.string().refine((value) => value.trim().length > 0);
export const loginSchema = z.object({ email, password: notBlank }).strict();
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3).max(100),
    email,
    password: passwordSchema,
  })
  .strict();
export const forgotSchema = z.object({ email }).strict();
export const verifySchema = z
  .object({ email, code: z.string().regex(/^[0-9]{6}$/) })
  .strict();
export const resetSchema = z
  .object({ resetToken: notBlank, newPassword: passwordSchema })
  .strict();
export const changeSchema = z
  .object({ currentPassword: notBlank, newPassword: passwordSchema })
  .strict();
export const messageSchema = z.object({ message: z.string() });

export const refreshRequestSchema = z
  .object({
    refreshToken: z
      .string()
      .max(512)
      .refine((value) => value.trim().length > 0),
  })
  .strict();
