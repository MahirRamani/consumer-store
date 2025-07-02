import mongoose, { Schema, type Document } from "mongoose"

export interface IUser extends Document {
  username: string
  password: string
  role: "admin" | "accountant"
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "accountant"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
