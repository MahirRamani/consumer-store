import mongoose from "mongoose"

const subProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "/placeholder.svg?height=200&width=200",
    },
    size: {
      type: String,
      required: true,
    },
    weight: {
      type: String,
    },
    barcode: {
      type: String,
    },
    description: {
      type: String,
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
      default: 10,
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

subProductSchema.index({ productId: 1 })
subProductSchema.index({ sku: 1 })
subProductSchema.index({ barcode: 1 })

export const SubProduct = mongoose.models.SubProduct || mongoose.model("SubProduct", subProductSchema)
