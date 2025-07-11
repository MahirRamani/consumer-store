import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "completed",
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$product.name" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      {
        $sort: { quantity: -1 },
      },
      {
        $limit: 10,
      },
    ]

    const results = await Transaction.aggregate(pipeline)

    const formattedResults = results.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      revenue: item.revenue,
    }))

    return NextResponse.json(formattedResults)
  } catch (error) {
    console.error("Error fetching product sales:", error)
    return NextResponse.json({ message: "Failed to fetch product sales" }, { status: 500 })
  }
}
