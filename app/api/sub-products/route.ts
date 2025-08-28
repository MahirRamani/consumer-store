import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { SubProduct } from "@/lib/models/sub-product"
import { Product } from "@/lib/models/product"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const includeInactive = searchParams.get("includeInactive") === "true"

    const query: any = {}

    if (!includeInactive) {
      query.isActive = true
    }

    if (productId) {
      query.productId = productId
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { size: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ]
    }

    const skip = (page - 1) * limit
    const subProducts = await SubProduct.find(query)
      .populate("productId", "name categoryId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await SubProduct.countDocuments(query)

    const formattedSubProducts = subProducts.map((subProduct) => ({
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
    }))

    return NextResponse.json({
      subProducts: formattedSubProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    console.error("Error fetching sub-products:", error)
    return NextResponse.json({ message: "Failed to fetch sub-products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { productId, name, size, weight, volume, sku, barcode, description, price, stock, lowStockThreshold } =
      body

    console.log("body", body)
    console.log("productId", productId);
    
    // Verify parent product exists
    const parentProduct = await Product.findById(productId)
    console.log("parentProduct", parentProduct);
    
    if (!parentProduct) {
      return NextResponse.json({ message: "Parent product not found" }, { status: 404 })
    }

    // Update parent product to have variants
    if (!parentProduct.hasVariants) {
      parentProduct.hasVariants = true
      await parentProduct.save()
    }

    const subProduct = new SubProduct({
      productId,
      name,
      size,
      weight,
      volume,
      sku,
      barcode,
      description,
      price,
      stock: stock || 0,
      lowStockThreshold: lowStockThreshold || 10,
      isActive: true,
    })

    await subProduct.save()
    await subProduct.populate("productId", "name categoryId")

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
    console.error("Error creating sub-product:", error)
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "SKU already exists" }, { status: 400 })
    }
    return NextResponse.json({ message: "Failed to create sub-product" }, { status: 500 })
  }
}


// import { type NextRequest, NextResponse } from "next/server"
// import dbConnect from "@/lib/mongodb"
// import { SubProduct } from "@/lib/models/sub-product"
// import { Product } from "@/lib/models/product"

// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect()

//     const { searchParams } = new URL(request.url)
//     const parentProductId = searchParams.get("parentProductId")
//     const page = Number.parseInt(searchParams.get("page") || "1")
//     const limit = Number.parseInt(searchParams.get("limit") || "10")
//     const search = searchParams.get("search") || ""

//     const query: any = {}
//     if (parentProductId) {
//       query.parentProductId = parentProductId
//     }
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { size: { $regex: search, $options: "i" } },
//         { sku: { $regex: search, $options: "i" } },
//         { barcode: { $regex: search, $options: "i" } },
//       ]
//     }

//     const skip = (page - 1) * limit
//     const subProducts = await SubProduct.find(query)
//       .populate("parentProductId", "name categoryId")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)

//     const total = await SubProduct.countDocuments(query)

//     const formattedSubProducts = subProducts.map((subProduct) => ({
//       id: subProduct._id.toString(),
//       parentProductId: subProduct.parentProductId._id.toString(),
//       parentProduct: {
//         id: subProduct.parentProductId._id.toString(),
//         name: subProduct.parentProductId.name,
//         categoryId: subProduct.parentProductId.categoryId.toString(),
//       },
//       name: subProduct.name,
//       size: subProduct.size,
//       weight: subProduct.weight,
//       volume: subProduct.volume,
//       sku: subProduct.sku,
//       barcode: subProduct.barcode,
//       description: subProduct.description,
//       price: subProduct.price,
//       stock: subProduct.stock,
//       lowStockThreshold: subProduct.lowStockThreshold,
//       status: subProduct.status,
//       createdAt: subProduct.createdAt,
//     }))

//     return NextResponse.json({
//       subProducts: formattedSubProducts,
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     })
//   } catch (error) {
//     console.error("Error fetching sub-products:", error)
//     return NextResponse.json({ message: "Failed to fetch sub-products" }, { status: 500 })
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     await dbConnect()

//     const body = await request.json()
//     const { parentProductId, name, size, weight, volume, sku, barcode, description, price, stock, lowStockThreshold } =
//       body

//     // Verify parent product exists
//     const parentProduct = await Product.findById(parentProductId)
//     if (!parentProduct) {
//       return NextResponse.json({ message: "Parent product not found" }, { status: 404 })
//     }

//     // Update parent product to have variants
//     if (!parentProduct.hasVariants) {
//       parentProduct.hasVariants = true
//       await parentProduct.save()
//     }

//     const subProduct = new SubProduct({
//       parentProductId,
//       name,
//       size,
//       weight,
//       volume,
//       sku,
//       barcode,
//       description,
//       price,
//       stock: stock || 0,
//       lowStockThreshold: lowStockThreshold || 10,
//     })

//     await subProduct.save()
//     await subProduct.populate("parentProductId", "name categoryId")

//     return NextResponse.json({
//       id: subProduct._id.toString(),
//       parentProductId: subProduct.parentProductId._id.toString(),
//       parentProduct: {
//         id: subProduct.parentProductId._id.toString(),
//         name: subProduct.parentProductId.name,
//         categoryId: subProduct.parentProductId.categoryId.toString(),
//       },
//       name: subProduct.name,
//       size: subProduct.size,
//       weight: subProduct.weight,
//       volume: subProduct.volume,
//       sku: subProduct.sku,
//       barcode: subProduct.barcode,
//       description: subProduct.description,
//       price: subProduct.price,
//       stock: subProduct.stock,
//       lowStockThreshold: subProduct.lowStockThreshold,
//       status: subProduct.status,
//       createdAt: subProduct.createdAt,
//     })
//   } catch (error) {
//     console.error("Error creating sub-product:", error)
//     if (error.code === 11000) {
//       return NextResponse.json({ message: "SKU already exists" }, { status: 400 })
//     }
//     return NextResponse.json({ message: "Failed to create sub-product" }, { status: 500 })
//   }
// }
