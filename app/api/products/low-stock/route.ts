import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Product, SubProduct } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()

    const subProducts = await SubProduct.find({
      isActive: true,
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    }).sort({ createdAt: -1 }).populate({
      path: "productId",
      select: "name categoryId",
      populate: {
        path: "categoryId",
        select: "name"
      }
    })

    console.log("Low stock subProducts:", subProducts);
    
    return NextResponse.json(
      subProducts.map((subProduct) => ({
        id: subProduct._id.toString(),
        name: `${subProduct.productId?.name} - ${subProduct.name}`, // Combine parent and variant names
        size: subProduct.size,
        categoryId: subProduct.parentProduct?.categoryId?._id?.toString(),
        category: subProduct.parentProduct?.categoryId?.name || "🤔❓",
        price: subProduct.price,
        stock: subProduct.stock,
        lowStockThreshold: subProduct.lowStockThreshold,
        barcode: subProduct.barcode,
        description: subProduct.description,
        isActive: subProduct.isActive,
        createdAt: subProduct.createdAt,
      })),
    )
  } catch (error) {
    console.error("Error fetching low stock products:", error)
    return NextResponse.json({ message: "Failed to fetch low stock products" }, { status: 500 })
  }
}
