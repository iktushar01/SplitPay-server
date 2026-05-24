import { z } from "zod";

export const createGroupZodSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
});

export const addGroupMemberZodSchema = z.object({
  userId: z.string().uuid(),
});

export const groupIdParamsSchema = z.object({
  groupId: z.string().uuid(),
});
