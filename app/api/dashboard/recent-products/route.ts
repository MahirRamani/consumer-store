import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { InventoryLog } from "@/lib/models/inventory-log"

export async function GET() {
  try {
    await dbConnect()

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // Get recent stock additions (positive quantity changes)
    const recentStockUpdates = await InventoryLog.find({
      createdAt: { $gte: threeDaysAgo },
      quantityChange: { $gt: 0 }, // Only stock additions
      type: "stock_update",
    })
      .populate("productId", "name category price stock")
      .sort({ createdAt: -1 })
      .limit(10)

    const formattedUpdates = recentStockUpdates.map((log) => ({
      id: log._id.toString(),
      product: {
        id: log.productId._id.toString(),
        name: log.productId.name,
        category: log.productId.category,
        price: log.productId.price,
        currentStock: log.productId.stock,
      },
      quantityAdded: log.quantityChange,
      previousStock: log.previousStock,
      newStock: log.newStock,
      updatedBy: log.updatedBy,
      createdAt: log.createdAt,
    }))

    return NextResponse.json(formattedUpdates)
  } catch (error) {
    console.error("Error fetching recent stock updates:", error)
    return NextResponse.json({ message: "Failed to fetch recent stock updates" }, { status: 500 })
  }
}
