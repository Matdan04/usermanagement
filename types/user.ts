import { z } from "zod";

export const userSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().optional().or(z.literal("")),
  role: z.string().min(1, "Role is required"),
  active: z.boolean().default(true),
  avatar: z.string().url().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  createdAt: z.string().datetime().optional(),
});

export type User = z.infer<typeof userSchema>;

// For creating new users (id and createdAt are generated server-side)
export const createUserSchema = userSchema
  .omit({ id: true, createdAt: true })
  .extend({ active: z.boolean() });

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = userSchema.partial().extend({ id: z.string().cuid() });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

