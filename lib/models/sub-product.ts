import mongoose, { Schema, type Document } from "mongoose"

export interface ISubProduct extends Document {
  productId: mongoose.Types.ObjectId
  name: string
  description?: string
  size: string
  price: number
  stock: number
  lowStockThreshold: number
  weight?: string
  volume?: string
  barcode?: string
  image?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const SubProductSchema = new Schema<ISubProduct>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
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
    weight: {
      type: String,
      trim: true,
    },
    volume: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes for better query performance
SubProductSchema.index({ productId: 1 })
SubProductSchema.index({ name: 1 })
SubProductSchema.index({ barcode: 1 })
SubProductSchema.index({ isActive: 1 })
SubProductSchema.index({ stock: 1, lowStockThreshold: 1 })

export const SubProduct = mongoose.models.SubProduct || mongoose.model<ISubProduct>("SubProduct", SubProductSchema)






// import mongoose from "mongoose"

// const subProductSchema = new mongoose.Schema(
//   {
//     productId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     image: {
//       type: String,
//       default: "/placeholder.svg?height=200&width=200",
//     },
//     size: {
//       type: String,
//       required: true,
//     },
//     weight: {
//       type: String,
//     },
//     barcode: {
//       type: String,
//     },
//     description: {
//       type: String,
//     },
//     price: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     stock: {
//       type: Number,
//       required: true,
//       min: 0,
//       default: 0,
//     },
//     lowStockThreshold: {
//       type: Number,
//       default: 10,
//     },
//     isActive: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   },
// )

// subProductSchema.index({ productId: 1 })
// subProductSchema.index({ sku: 1 })
// subProductSchema.index({ barcode: 1 })

// export const SubProduct = mongoose.models.SubProduct || mongoose.model("SubProduct", subProductSchema)
