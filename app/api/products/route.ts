import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Product } from "@/lib/models"
import { SubProduct } from "@/lib/models/sub-product"
import { EnhancedProduct, ProductQuery } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId")
    const includeInactive = searchParams.get("includeInactive") === "true"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const query: ProductQuery = {}

    if (!includeInactive) {
      query.isActive = true
    }

    if (categoryId && categoryId !== "all") {
      query.categoryId = categoryId
    }

    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    const skip = (page - 1) * limit
    const products = await Product.find(query)
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const enhancedProducts: EnhancedProduct[] = await Promise.all(
      products.map(async (product): Promise<EnhancedProduct> => {
        // Get all variants sorted by creation date
        const variants = await SubProduct.find({
          productId: product._id,
          isActive: true,
        }).sort({ createdAt: 1 })

        return {
          id: product._id.toString(),
          name: product.name,
          description: product.description,
          categoryId: product.categoryId._id.toString(),
          category: product.categoryId?.name,
          isActive: product.isActive,
          hasVariants: product.hasVariants || variants.length > 1,
          variantCount: variants.length,
          variants: variants.map(variant => ({
            id: variant._id.toString(),
            productId: variant.productId.toString(),
            name: variant.name,
            description: variant.description,
            size: variant.size,
            price: variant.price,
            stock: variant.stock,
            lowStockThreshold: variant.lowStockThreshold,
            weight: variant.weight,
            volume: variant.volume,
            barcode: variant.barcode,
            image: variant.image,
            isActive: variant.isActive,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
          })),
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        }
      })
    )

    return NextResponse.json(enhancedProducts)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ message: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { name, description, categoryId } = body

    console.log("body", body);
    
    const product = new Product({
      name,
      description,
      categoryId,
      isActive: true,
      hasVariants: false,
    })

    await product.save()
    await product.populate("categoryId", "name")

    const newProduct: EnhancedProduct = {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      categoryId: product.categoryId._id.toString(),
      category: product.categoryId?.name,
      isActive: product.isActive,
      hasVariants: product.hasVariants,
      variantCount: 0,
      variants: [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }

    return NextResponse.json(newProduct)
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ message: "Failed to create product" }, { status: 500 })
  }
}

// import { type NextRequest, NextResponse } from "next/server"
// import dbConnect from "@/lib/mongodb"
// import { Product } from "@/lib/models"
// import { SubProduct } from "@/lib/models/sub-product"
// import { EnhancedProduct, ProductQuery } from "@/lib/types"

// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect()

//     const { searchParams } = new URL(request.url)
//     const search = searchParams.get("search") || ""
//     const categoryId = searchParams.get("categoryId")
//     const includeInactive = searchParams.get("includeInactive") === "true"
//     const page = Number.parseInt(searchParams.get("page") || "1")
//     const limit = Number.parseInt(searchParams.get("limit") || "50")

//     const query: ProductQuery = {}

//     if (!includeInactive) {
//       query.isActive = true
//     }

//     if (categoryId && categoryId !== "all") {
//       query.categoryId = categoryId
//     }

//     if (search) {
//       query.name = { $regex: search, $options: "i" }
//     }

//     const skip = (page - 1) * limit
//     const products = await Product.find(query)
//       .populate("categoryId", "name")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)

//     const enhancedProducts: EnhancedProduct[] = await Promise.all(
//       products.map(async (product) => {
//         // Get variant count and default variant for each product
//         const variants = await SubProduct.find({
//           productId: product._id,
//           isActive: true,
//         }).sort({ createdAt: 1 })

//         const variantCount = variants.length
//         const defaultVariant = variants.length === 1 ? variants[0] : null

//         return {
//           id: product._id.toString(),
//           name: product.name,
//           description: product.description,
//           categoryId: product.categoryId._id.toString(),
//           category: product.categoryId?.name,
//           isActive: product.isActive,
//           hasVariants: product.hasVariants || variantCount > 1,
//           variantCount,
//           // Include default variant data for single-variant products
//           defaultVariant: defaultVariant
//             ? {
//                 id: defaultVariant._id.toString(),
//                 name: defaultVariant.name,
//                 price: defaultVariant.price,
//                 stock: defaultVariant.stock,
//                 lowStockThreshold: defaultVariant.lowStockThreshold,
//                 image: defaultVariant.image,
//                 size: defaultVariant.size,
//               }
//             : null,
//           // For backward compatibility, include price and stock from default variant
//           price: defaultVariant?.price || 0,
//           stock: defaultVariant?.stock || 0,
//           lowStockThreshold: defaultVariant?.lowStockThreshold || 0,
//           image: defaultVariant?.image,
//           createdAt: product.createdAt,
//         }
//       }),
//     )

//     return NextResponse.json(enhancedProducts)
//   } catch (error) {
//     console.error("Error fetching products:", error)
//     return NextResponse.json({ message: "Failed to fetch products" }, { status: 500 })
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     await dbConnect()

//     const body = await request.json()
//     const { name, description, categoryId } = body

//     console.log("body", body);
    
//     const product = new Product({
//       name,
//       description,
//       categoryId,
//       isActive: true,
//       hasVariants: false, // Will be updated when variants are added
//     })

//     await product.save()
//     await product.populate("categoryId", "name")

//     return NextResponse.json({
//       id: product._id.toString(),
//       name: product.name,
//       description: product.description,
//       categoryId: product.categoryId._id.toString(),
//       category: product.categoryId?.name,
//       isActive: product.isActive,
//       hasVariants: product.hasVariants,
//       variantCount: 0,
//       defaultVariant: null,
//       price: 0,
//       stock: 0,
//       lowStockThreshold: 0,
//       createdAt: product.createdAt,
//     })
//   } catch (error) {
//     console.error("Error creating product:", error)
//     return NextResponse.json({ message: "Failed to create product" }, { status: 500 })
//   }
// }