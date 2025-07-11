import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Product } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()

    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    }).sort({ createdAt: -1 }).populate('categoryId', 'name')

    console.log("Low stock products:", products);
    
    
    return NextResponse.json(
      products.map((product) => ({
        id: product._id.toString(),
        name: product.name,
        category: product.categoryId?.name, // Get category name from populated data
        categoryId: product.categoryId?._id.toString(),
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
