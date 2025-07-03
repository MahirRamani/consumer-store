import mongoose, { Schema, type Document } from "mongoose"

export interface IProduct extends Document {
  name: string
  category: string
  price: number
  stock: number
  lowStockThreshold: number
  barcode?: string
  description?: string
  isActive: boolean
  createdAt: Date
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    // enum: ["food", "stationery", "daily-use", "pooja"],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    min: 0,
    default: 10,
  },
  barcode: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)
