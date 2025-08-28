import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

productSchema.index({ categoryId: 1 })
productSchema.index({ name: "text", description: "text" })
productSchema.index({ sku: 1 })
productSchema.index({ barcode: 1 })

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema)



// import mongoose, { Schema, type Document } from "mongoose"

  // export interface IProduct extends Document {
  //   name: string
  //   category: string
  //   categoryId: mongoose.Types.ObjectId
  //   price: number
  //   stock: number
  //   lowStockThreshold: number
  //   barcode?: string
  //   description?: string
  //   isActive: boolean
  //   createdAt: Date
  // }

  // const ProductSchema = new Schema<IProduct>({
  //   name: {
  //     type: String,
  //     required: true,
  //     trim: true,
  //   },
  //   categoryId: {
  //     type: Schema.Types.ObjectId,
  //     ref: "Category",
  //     required: true,
  //   },
  //   price: {
  //     type: Number,
  //     required: true,
  //     min: 0,
  //   },
  //   stock: {
  //     type: Number,
  //     required: true,
  //     min: 0,
  //     default: 0,
  //   },
  //   lowStockThreshold: {
  //     type: Number,
  //     required: true,
  //     min: 0,
  //     default: 10,
  //   },
  //   barcode: {
  //     type: String,
  //     trim: true,
  //   },
  //   description: {
  //     type: String,
  //     trim: true,
  //   },
  //   isActive: {
  //     type: Boolean,
  //     required: true,
  //     default: true,
  //   },
  //   createdAt: {
  //     type: Date,
  //     default: Date.now,
  //   },
  // })

  // export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)
