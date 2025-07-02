import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"

interface DailySales {
  [key: string]: number
}

interface SalesData {
  date: string
  items: number
  day: string
}

export async function GET() {
  try {
    await dbConnect()

    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(today.getDate() - 7)

    const transactions = await Transaction.find({
      createdAt: { $gte: weekAgo, $lte: today },
      status: "completed",
    })

    // Group by day and calculate total items sold
    const dailySales: DailySales = {}

    // Initialize all days in the week with 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      const dateKey = date.toISOString().split("T")[0]
      dailySales[dateKey] = 0
    }

    // Calculate sales for each day
    transactions.forEach((transaction) => {
      const dateKey = transaction.createdAt.toISOString().split("T")[0]
      const totalItems = transaction.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      if (dailySales[dateKey] !== undefined) {
        dailySales[dateKey] += totalItems
      }
    })

    const salesData: SalesData[] = Object.entries(dailySales).map(([date, items]) => ({
      date,
      items,
      day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
    }))

    return NextResponse.json(salesData)
  } catch (error) {
    console.error("Error fetching weekly sales:", error)
    return NextResponse.json({ message: "Failed to fetch weekly sales" }, { status: 500 })
  }
}
