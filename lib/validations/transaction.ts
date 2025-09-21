import { z } from "zod";

export const createTransactionSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  // Optional sellerId if your code sets from auth/session; keep as in your file if already present
  // sellerId: z.string().optional(),
  items: z
    .array(
      z
        .object({
          productId: z.string().min(1).optional(),
          subProductId: z.string().min(1).optional(),
          quantity: z.number().int().min(1, "quantity must be at least 1"),
          // price can be provided by client or derived server-side; keep optional here
          price: z.number().nonnegative().optional(),
        })
        .refine((i) => Boolean(i.productId) || Boolean(i.subProductId), {
          message: "Either productId or subProductId is required",
          path: ["subProductId"],
        }),
    )
    .min(1, "At least one item is required"),
  // optional fields
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
  transactionType: z.enum(["purchase", "topup", "deduction"]).optional(),
  performedBy: z.enum(["seller", "accountant", "admin"]).optional(),
  reason: z.string().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>





// import { z } from "zod"

// export const createTransactionSchema = z.object({
//   studentId: z.string(),
//   items: z.array(
//     z.object({
//       productId: z.string(),
//       quantity: z.number().min(1),
//       price: z.number().min(0),
//     }),
//   ),
// })

// export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
