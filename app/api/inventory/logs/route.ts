import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { InventoryLog } from "@/lib/models/inventory-log"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const action = searchParams.get("action")
    const dateRange = searchParams.get("dateRange")

    let query: any = {}

    // Date range filter
    if (dateRange && dateRange !== "all") {
      const now = new Date()
      const startDate = new Date()

      switch (dateRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0)
          break
        case "week":
          startDate.setDate(now.getDate() - 7)
          break
        case "month":
          startDate.setMonth(now.getMonth() - 1)
          break
      }

      query = { ...query, createdAt: { $gte: startDate } }
    }

    // Action filter
    if (action && action !== "all") {
      query = { ...query, action }
    }

    const logs = await InventoryLog.find(query)
      .populate("productId", "name category")
      .sort({ createdAt: -1 })
      .limit(100)

    return NextResponse.json(
      logs.map((log) => ({
        id: log._id.toString(),
        productId: log.productId._id.toString(),
        action: log.action,
        quantityChange: log.quantityChange,
        previousStock: log.previousStock,
        newStock: log.newStock,
        reason: log.reason,
        userId: log.userId.toString(),
        createdAt: log.createdAt,
        product: {
          name: log.productId.name,
          category: log.productId.category,
        },
      })),
    )
  } catch (error) {
    console.error("Error fetching inventory logs:", error)
    return NextResponse.json({ message: "Failed to fetch inventory logs" }, { status: 500 })
  }
}
