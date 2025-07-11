import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  categoryId: z.string(),
  price: z.number().min(0, "Price must be positive"),
  stock: z.number().min(0, "Stock must be non-negative").default(0),
  lowStockThreshold: z.number().min(0, "Threshold must be non-negative").default(10),
  barcode: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const updateStockSchema = z.object({
  quantity: z.number(),
  reason: z.string().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateStockInput = z.infer<typeof updateStockSchema>
