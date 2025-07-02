import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { InventoryLog } from "@/lib/models/inventory-log"

export async function GET() {
  try {
    await dbConnect()

    // const threeDaysAgo = new Date()
    // threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // // Find inventory logs where stock was added (quantityChange > 0) in last 3 days
    // const stockUpdates = await InventoryLog.find({
    //   createdAt: { $gte: threeDaysAgo },
    //   quantityChange: { $gt: 0 }, // Only stock additions
    //   action: "stock_update",
    // })
    //   .populate("productId", "name category price stock")
    //   .populate("userId", "username")
    //   .sort({ createdAt: -1 })
    //   .limit(20)

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const now = new Date(); // Current date and time

    const stockUpdates = await InventoryLog.find({
      createdAt: {
        $gte: threeDaysAgo,  // From 3 days ago
        $lte: now            // Till current time
      },
      quantityChange: { $gt: 0 }, // Only stock additions
      action: "restock",
    })
      .populate("productId", "name category price stock")
      // .populate("userId", "username")
      .sort({ createdAt: -1 })
      .limit(20);

    console.log("stockUpdates", stockUpdates);

    const formattedUpdates = stockUpdates.map((log) => ({
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
      updatedBy: log.userId?.username || "System",
      createdAt: log.createdAt,
      reason: log.reason || "Stock replenishment",
    }))


    console.log("formattedUpdates", formattedUpdates);


    return NextResponse.json(formattedUpdates)
  } catch (error) {
    console.error("Error fetching recent stock updates:", error)
    return NextResponse.json({ message: "Failed to fetch recent stock updates" }, { status: 500 })
  }
}
