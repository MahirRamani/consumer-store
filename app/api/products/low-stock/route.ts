import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Product } from "@/lib/models/product"

export async function GET() {
  try {
    await dbConnect()

    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    }).sort({ createdAt: -1 })

    return NextResponse.json(
      products.map((product) => ({
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
      })),
    )
  } catch (error) {
    console.error("Error fetching low stock products:", error)
    return NextResponse.json({ message: "Failed to fetch low stock products" }, { status: 500 })
  }
}
