import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Product } from "@/lib/models/product"
import { InventoryLog } from "@/lib/models/inventory-log"
import { updateStockSchema } from "@/lib/validations/product"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const body = await request.json()
    const { quantity, reason } = updateStockSchema.parse(body)

    const product = await Product.findById(params.id)
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    const previousStock = product.stock
    const newStock = previousStock + quantity

    if (newStock < 0) {
      return NextResponse.json({ message: "Insufficient stock" }, { status: 400 })
    }

    product.stock = newStock
    await product.save()

    // Create inventory log
    const inventoryLog = new InventoryLog({
      productId: product._id,
      action: quantity > 0 ? "restock" : "adjustment",
      quantityChange: quantity,
      previousStock,
      newStock,
      reason: reason || (quantity > 0 ? "Restock" : "Adjustment"),
      userId: "000000000000000000000001", // Default user ID
    })
    await inventoryLog.save()

    return NextResponse.json({
      id: product._id.toString(),
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      barcode: product.barcode,
      description: product.description,
      isActive: product.isActive,
      createdAt: product.createdAt,
    })
  } catch (error) {
    console.error("Error updating stock:", error)
    return NextResponse.json({ message: "Failed to update stock" }, { status: 500 })
  }
}
