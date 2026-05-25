import { z } from "zod";

export const createGroupZodSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
});

export const addGroupMemberZodSchema = z.object({
  userId: z.string().min(1, "User id is required"),
});

export const inviteByEmailZodSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const groupIdParamsSchema = z.object({
  groupId: z.string().uuid(),
});

export const inviteIdParamsSchema = z.object({
  inviteId: z.string().uuid(),
});
