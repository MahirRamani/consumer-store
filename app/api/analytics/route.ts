import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"

export async function GET() {
  try {
    await dbConnect()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [allTransactions, todayTransactions] = await Promise.all([
      Transaction.find({ status: "completed" }),
      Transaction.find({
        status: "completed",
        createdAt: { $gte: today, $lt: tomorrow },
      }),
    ])

    const totalRevenue = allTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0)

    const todaySales = todayTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0)

    const avgTransaction = allTransactions.length > 0 ? totalRevenue / allTransactions.length : 0

    return NextResponse.json({
      totalRevenue,
      todaySales,
      totalTransactions: allTransactions.length,
      avgTransaction,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ message: "Failed to fetch analytics" }, { status: 500 })
  }
}
