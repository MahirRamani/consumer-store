import mongoose, { Schema, type Document } from "mongoose"

export interface ITransaction extends Document {
  studentId: mongoose.Types.ObjectId
  sellerId: mongoose.Types.ObjectId
  items: Array<{
    productId: mongoose.Types.ObjectId
    quantity: number
    price: number
  }>
  totalAmount: number
  status: "completed" | "failed" | "refunded"
  createdAt: Date
}

const TransactionSchema = new Schema<ITransaction>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ["completed", "failed", "refunded"],
    default: "completed",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema)
