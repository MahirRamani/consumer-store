import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { SubProduct } from "@/lib/models/sub-product"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()

    const variants = await SubProduct.find({
      productId: (await params).id,
      isActive: true,
    })
      .populate("productId", "name")
      .sort({ createdAt: 1 })

    const formattedVariants = variants.map((variant) => ({
      id: variant._id.toString(),
      productId: variant.productId._id.toString(),
      name: variant.name,
      description: variant.description,
      size: variant.size,
      price: variant.price,
      stock: variant.stock,
      lowStockThreshold: variant.lowStockThreshold,
      weight: variant.weight,
      volume: variant.volume,
      // sku: variant.sku,
      barcode: variant.barcode,
      image: variant.image,
      isActive: variant.isActive,
      createdAt: variant.createdAt,
    }))

    return NextResponse.json({ variants: formattedVariants })
  } catch (error) {
    console.error("Error fetching product variants:", error)
    return NextResponse.json({ message: "Failed to fetch variants" }, { status: 500 })
  }
}






// import { type NextRequest, NextResponse } from "next/server"
// import dbConnect from "@/lib/mongodb"
// import { SubProduct } from "@/lib/models/sub-product"
// import { Product } from "@/lib/models/product"

// export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   try {
//     await dbConnect()

//     const { id } = await params

//     // Verify product exists
//     const product = await Product.findById(id)
//     if (!product) {
//       return NextResponse.json({ message: "Product not found" }, { status: 404 })
//     }

//     const variants = await SubProduct.find({ productId: id, status: "active" })
//       .populate("productId", "name categoryId")
//       .sort({ createdAt: -1 })

//     const formattedVariants = variants.map((variant) => ({
//       id: variant._id.toString(),
//       productId: variant.productId._id.toString(),
//       name: variant.name,
//       size: variant.size,
//       weight: variant.weight,
//       volume: variant.volume,
//       sku: variant.sku,
//       barcode: variant.barcode,
//       description: variant.description,
//       price: variant.price,
//       stock: variant.stock,
//       lowStockThreshold: variant.lowStockThreshold,
//       status: variant.status,
//       createdAt: variant.createdAt,
//     }))

//     return NextResponse.json({
//       product: {
//         id: product._id.toString(),
//         name: product.name,
//         description: product.description,
//         image: product.image,
//         hasVariants: product.hasVariants,
//       },
//       variants: formattedVariants,
//     })
//   } catch (error) {
//     console.error("Error fetching product variants:", error)
//     return NextResponse.json({ message: "Failed to fetch product variants" }, { status: 500 })
//   }
// }
