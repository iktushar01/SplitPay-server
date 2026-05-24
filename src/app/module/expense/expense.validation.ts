import { z } from "zod";

export const createExpenseZodSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.coerce.number().positive(),
  paidById: z.string().uuid(),
  date: z.coerce.date().optional(),
  participantIds: z.array(z.string().uuid()).min(1).optional(),
});
