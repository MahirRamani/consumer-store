import mongoose, { Schema, type Document } from "mongoose"

export interface ITransactionItem {
  productId?: mongoose.Types.ObjectId
  subProductId?: mongoose.Types.ObjectId
  quantity: number
  price: number
  totalPrice: number
}

export interface ITransaction extends Document {
  studentId: mongoose.Types.ObjectId
  sellerId: mongoose.Types.ObjectId
  items: ITransactionItem[]
  totalAmount: number
  status: "pending" | "completed" | "cancelled"
  transactionType: "purchase" | "topup" | "deduction"
  reason?: string
  performedBy: "seller" | "accountant" | "admin"
  createdAt: Date
  updatedAt: Date
}

const TransactionItemSchema = new Schema<ITransactionItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  subProductId: {
    type: Schema.Types.ObjectId,
    ref: "SubProduct",
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
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
})

const TransactionSchema = new Schema<ITransaction>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    items: [TransactionItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
    },
    transactionType: {
      type: String,
      enum: ["purchase", "topup", "deduction"],
      default: "purchase",
    },
    reason: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: String,
      enum: ["seller", "accountant", "admin"],
      default: "seller",
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes
TransactionSchema.index({ studentId: 1 })
TransactionSchema.index({ sellerId: 1 })
TransactionSchema.index({ status: 1 })
TransactionSchema.index({ transactionType: 1 })
TransactionSchema.index({ createdAt: -1 })

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema)





//   import mongoose from "mongoose"

//   const transactionItemSchema = new mongoose.Schema({
//     productId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//     },
//     subProductId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SubProduct",
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     price: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     quantity: {
//       type: Number,
//       required: true,
//       min: 1,
//     },
//     size: {
//       type: String,
//     },
//   })

//   const transactionSchema = new mongoose.Schema(
//     {
//       studentId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Student",
//         required: true,
//       },
//       sellerId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//       },
//       items: [transactionItemSchema],
//       totalAmount: {
//         type: Number,
//         required: true,
//         min: 0,
//       },
//       status: {
//         type: String,
//         enum: ["pending", "completed", "cancelled"],
//         default: "pending",
//       },
//       transactionType: {
//         type: String,
//         enum: ["purchase", "topup", "deduction"],
//         default: "purchase",
//       },
//       performedBy: {
//         type: String,
//         enum: ["seller", "accountant", "admin"],
//         default: "seller",
//       },
//       reason: {
//         type: String,
//       },
//     },
//     {
//       timestamps: true,
//     },
//   )

//   transactionSchema.index({ studentId: 1, createdAt: -1 })
//   transactionSchema.index({ sellerId: 1 })
//   transactionSchema.index({ status: 1 })
//   transactionSchema.index({ transactionType: 1 })
//   transactionSchema.index({ createdAt: -1 })

//   export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema)

// // import mongoose, { Schema, type Document } from "mongoose"

// // export interface ITransaction extends Document {
// //   studentId: mongoose.Types.ObjectId
// //   sellerId: mongoose.Types.ObjectId
// //   items: Array<{
// //     productId: mongoose.Types.ObjectId
// //     quantity: number
// //     price: number
// //   }>
// //   totalAmount: number
// //   status: "completed" | "failed" | "refunded"
// //   createdAt: Date
// // }

// // const TransactionSchema = new Schema<ITransaction>({
// //   studentId: {
// //     type: Schema.Types.ObjectId,
// //     ref: "Student",
// //     required: true,
// //   },
// //   sellerId: {
// //     type: Schema.Types.ObjectId,
// //     ref: "User",
// //     required: true,
// //   },
// //   items: [
// //     {
// //       productId: {
// //         type: Schema.Types.ObjectId,
// //         ref: "Product",
// //         required: true,
// //       },
// //       quantity: {
// //         type: Number,
// //         required: true,
// //         min: 1,
// //       },
// //       price: {
// //         type: Number,
// //         required: true,
// //         min: 0,
// //       },
// //     },
// //   ],
// //   totalAmount: {
// //     type: Number,
// //     required: true,
// //     min: 0,
// //   },
// //   status: {
// //     type: String,
// //     required: true,
// //     enum: ["completed", "failed", "refunded"],
// //     default: "completed",
// //   },
// //   createdAt: {
// //     type: Date,
// //     default: Date.now,
// //   },
// // })

// // export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema)
