import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hostel-store"

console.log(`MONGODB_URI: ${MONGODB_URI}`)

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env")
}

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) return

  try {
    await mongoose.connect(MONGODB_URI)
    console.log("MongoDB connected successfully")
  } catch (error: any) {
    console.error("MongoDB connection error:", error.message)
    throw error
  }
}

console.log("dbConnect ran successfully")

dbConnect()
export default dbConnect
