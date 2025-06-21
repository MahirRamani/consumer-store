import { z } from "zod"

export const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  standard: z.string().min(1, "Standard is required"),
  // year: z.number().min(2019).max(2030),
  balance: z.number().min(0).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
})

export const updateBalanceSchema = z.object({
  amount: z.number(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateBalanceInput = z.infer<typeof updateBalanceSchema>
