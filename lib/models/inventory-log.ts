import mongoose, { Schema, type Document } from "mongoose"

export interface IInventoryLog extends Document {
  productId: mongoose.Types.ObjectId
  action: "restock" | "sale" | "adjustment"
  quantityChange: number
  previousStock: number
  newStock: number
  reason?: string
  userId: mongoose.Types.ObjectId
  createdAt: Date
}

const InventoryLogSchema = new Schema<IInventoryLog>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ["restock", "sale", "adjustment"],
  },
  quantityChange: {
    type: Number,
    required: true,
  },
  previousStock: {
    type: Number,
    required: true,
    min: 0,
  },
  newStock: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String,
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const InventoryLog =
  mongoose.models.InventoryLog || mongoose.model<IInventoryLog>("InventoryLog", InventoryLogSchema)
