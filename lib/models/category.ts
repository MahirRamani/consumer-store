import mongoose, { Schema, type Document } from "mongoose"

export interface ICategory extends Document {
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
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
CategorySchema.index({ name: 1 })
CategorySchema.index({ isActive: 1 })

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema)



// import mongoose, { Schema, type Document } from "mongoose"

// export interface ICategory extends Document {
//   name: string
//   description?: string
//   isActive: boolean
//   createdAt: Date
// }

// const CategorySchema = new Schema<ICategory>({
//   name: {
//     type: String,
//     required: true,
//     unique: true,
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

// export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema)
