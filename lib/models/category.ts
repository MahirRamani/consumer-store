import mongoose, { Schema, type Document } from "mongoose"

export interface ICategory extends Document {
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    unique: true,
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

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema)
