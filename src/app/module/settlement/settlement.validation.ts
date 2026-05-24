import { z } from "zod";

export const createSettlementZodSchema = z.object({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  date: z.coerce.date().optional(),
});

export const settlementIdParamsSchema = z.object({
  settlementId: z.string().uuid(),
});
