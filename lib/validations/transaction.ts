import { z } from "zod"

export const createTransactionSchema = z.object({
  studentId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      price: z.number().min(0),
    }),
  ),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
