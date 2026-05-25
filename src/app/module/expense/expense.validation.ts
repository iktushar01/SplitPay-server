import { z } from "zod";

export const createExpenseZodSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.coerce.number().positive(),
  paidById: z.string().min(1, "Payer is required"),
  date: z.coerce.date().optional(),
  participantIds: z.array(z.string().min(1)).min(1).optional(),
});
