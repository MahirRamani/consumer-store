import mongoose, { Schema, type Document } from "mongoose";

export interface IStudent extends Document {
  name: string;
  rollNumber: string;
  standard: string;
  year: number;
  balance: number;
  status: "active" | "inactive";
  createdAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  standard: {
    type: String,
    required: true,
    trim: true,
  },
  // year: {
  //   type: Number,
  //   required: true,
  // },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Student =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
