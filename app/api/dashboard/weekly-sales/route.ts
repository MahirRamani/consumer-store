// app/api/dashboard/weekly-sales/route.ts
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"
import { TransactionItem } from "@/lib/types"

interface DailySales {
  [key: string]: number
}

interface SalesData {
  date: string
  items: number
  day: string
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

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
      
      if (dailySales[dateKey] !== undefined) {
        if (itemId && itemId !== 'all') {
          // Filter by specific item using productId (not id)
          const filteredItems = transaction.items.filter((item: TransactionItem) => 
            item.productId?.toString() === itemId
          )
          const totalItems = filteredItems.reduce((sum: number, item: TransactionItem) => sum + item.quantity, 0)
          dailySales[dateKey] += totalItems
        } else {
          // All items
          const totalItems = transaction.items.reduce((sum: number, item: TransactionItem) => sum + item.quantity, 0)
          dailySales[dateKey] += totalItems
        }
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