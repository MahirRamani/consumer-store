  import mongoose from "mongoose"

  const transactionItemSchema = new mongoose.Schema({
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    subProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubProduct",
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    size: {
      type: String,
    },
  })

  const transactionSchema = new mongoose.Schema(
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      items: [transactionItemSchema],
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      status: {
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "pending",
      },
      transactionType: {
        type: String,
        enum: ["purchase", "topup", "deduction"],
        default: "purchase",
      },
      performedBy: {
        type: String,
        enum: ["seller", "accountant", "admin"],
        default: "seller",
      },
      reason: {
        type: String,
      },
    },
    {
      timestamps: true,
    },
  )

  transactionSchema.index({ studentId: 1, createdAt: -1 })
  transactionSchema.index({ sellerId: 1 })
  transactionSchema.index({ status: 1 })
  transactionSchema.index({ transactionType: 1 })
  transactionSchema.index({ createdAt: -1 })

  export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema)

// import mongoose, { Schema, type Document } from "mongoose"

// export interface ITransaction extends Document {
//   studentId: mongoose.Types.ObjectId
//   sellerId: mongoose.Types.ObjectId
//   items: Array<{
//     productId: mongoose.Types.ObjectId
//     quantity: number
//     price: number
//   }>
//   totalAmount: number
//   status: "completed" | "failed" | "refunded"
//   createdAt: Date
// }

// const TransactionSchema = new Schema<ITransaction>({
//   studentId: {
//     type: Schema.Types.ObjectId,
//     ref: "Student",
//     required: true,
//   },
//   sellerId: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   items: [
//     {
//       productId: {
//         type: Schema.Types.ObjectId,
//         ref: "Product",
//         required: true,
//       },
//       quantity: {
//         type: Number,
//         required: true,
//         min: 1,
//       },
//       price: {
//         type: Number,
//         required: true,
//         min: 0,
//       },
//     },
//   ],
//   totalAmount: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
//   status: {
//     type: String,
//     required: true,
//     enum: ["completed", "failed", "refunded"],
//     default: "completed",
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// })

// export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema)
