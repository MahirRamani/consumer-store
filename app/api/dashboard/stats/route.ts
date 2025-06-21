import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Student } from "@/lib/models/student"
import { Product } from "@/lib/models/product"
import { Transaction } from "@/lib/models/transaction"

export async function GET() {
  try {
    await dbConnect()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalStudents, totalProducts, todayTransactions, lowStockProducts] = await Promise.all([
      Student.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Transaction.find({ createdAt: { $gte: today, $lt: tomorrow } }),
      Product.find({
        isActive: true,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      }),
    ])

    const todaySales = todayTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0)

    return NextResponse.json({
      totalStudents,
      totalProducts,
      todaySales,
      todayTransactions: todayTransactions.length,
      lowStockCount: lowStockProducts.length,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ message: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
