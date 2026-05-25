import { z } from "zod";

export const createSettlementZodSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.coerce.date().optional(),
});

export const settlementIdParamsSchema = z.object({
  settlementId: z.string().uuid(),
});
