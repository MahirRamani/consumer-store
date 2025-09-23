// app/api/dashboard/items/route.ts
import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"
import { PopulatedProduct, TransactionItem } from "@/lib/types"

export async function GET() {
  try {
    await dbConnect()

    // Get all unique items from transactions with populated product data
    const transactions = await Transaction.find({
      status: "completed",
    })
      .populate({
        path: "items.productId",
        select: "name title", // Adjust these fields based on your Product model
      })
      .select("items")

    // Extract unique items with product information
    const itemsMap = new Map()

    transactions.forEach((transaction) => {
      transaction.items.forEach((item: TransactionItem) => {

        if (item.productId && typeof item.productId === 'object' && '_id' in item.productId) {
          const product = item.productId as PopulatedProduct
          const productId = product._id.toString()
          const productName = product.name || product.title || `Product ${productId.substring(0, 8)}...`

          if (!itemsMap.has(productId)) {
            itemsMap.set(productId, {
              id: productId,
              name: productName,
            })
          }
        }
      })
    })

    const items = Array.from(itemsMap.values())

    // Sort items alphabetically by name for better UX
    items.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ message: "Failed to fetch items" }, { status: 500 })
  }
}