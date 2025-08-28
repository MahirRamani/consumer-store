import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { SubProduct } from "@/lib/models/sub-product"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const subProduct = await SubProduct.findById(params.id).populate("productId", "name categoryId")

    if (!subProduct) {
      return NextResponse.json({ message: "Sub-product not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: subProduct._id.toString(),
      productId: subProduct.productId._id.toString(),
      parentProduct: {
        id: subProduct.productId._id.toString(),
        name: subProduct.productId.name,
        categoryId: subProduct.productId.categoryId.toString(),
      },
      name: subProduct.name,
      size: subProduct.size,
      weight: subProduct.weight,
      volume: subProduct.volume,
      sku: subProduct.sku,
      barcode: subProduct.barcode,
      description: subProduct.description,
      price: subProduct.price,
      stock: subProduct.stock,
      lowStockThreshold: subProduct.lowStockThreshold,
      isActive: subProduct.isActive,
      createdAt: subProduct.createdAt,
    })
  } catch (error: unknown) {
    console.error("Error fetching sub-product:", error)
    return NextResponse.json({ message: "Failed to fetch sub-product" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const body = await request.json()
    const { name, size, weight, volume, sku, barcode, description, price, stock, lowStockThreshold, isActive } = body

    const subProduct = await SubProduct.findByIdAndUpdate(
      params.id,
      {
        name,
        size,
        weight,
        volume,
        sku,
        barcode,
        description,
        price,
        stock,
        lowStockThreshold,
        isActive,
      },
      { new: true },
    ).populate("productId", "name categoryId")

    if (!subProduct) {
      return NextResponse.json({ message: "Sub-product not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: subProduct._id.toString(),
      productId: subProduct.productId._id.toString(),
      parentProduct: {
        id: subProduct.productId._id.toString(),
        name: subProduct.productId.name,
        categoryId: subProduct.productId.categoryId.toString(),
      },
      name: subProduct.name,
      size: subProduct.size,
      weight: subProduct.weight,
      volume: subProduct.volume,
      sku: subProduct.sku,
      barcode: subProduct.barcode,
      description: subProduct.description,
      price: subProduct.price,
      stock: subProduct.stock,
      lowStockThreshold: subProduct.lowStockThreshold,
      isActive: subProduct.isActive,
      createdAt: subProduct.createdAt,
    })
  } catch (error: unknown) {
    console.error("Error updating sub-product:", error)
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "SKU already exists" }, { status: 400 })
    }
    return NextResponse.json({ message: "Failed to update sub-product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const subProduct = await SubProduct.findByIdAndDelete(params.id)

    if (!subProduct) {
      return NextResponse.json({ message: "Sub-product not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Sub-product deleted successfully" })
  } catch (error: unknown) {
    console.error("Error deleting sub-product:", error)
    return NextResponse.json({ message: "Failed to delete sub-product" }, { status: 500 })
  }
}
