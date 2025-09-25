import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { SubProduct } from "@/lib/models/sub-product"
import { Product } from "@/lib/models/product"
import { SubProductQuery } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const includeInactive = searchParams.get("includeInactive") === "true"

    const query: SubProductQuery = {}

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
        { barcode: { $regex: search, $options: "i" } },
      ]
    }

    const skip = (page - 1) * limit
    const subProducts = await SubProduct.find(query)
      .populate({
        path: "productId",
        select: "name categoryId",
        populate: {
          path: "categoryId",
          select: "name description"
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await SubProduct.countDocuments(query)

    // Filter out sub-products with invalid references and format the valid ones
    const formattedSubProducts = subProducts
      .filter(subProduct => {
        // Filter out sub-products where populate failed
        if (!subProduct.productId || subProduct.productId === null) {
          console.warn(`SubProduct ${subProduct._id} has invalid productId reference`)
          return false
        }
        
        // Check if product has valid category reference
        if (!subProduct.productId.categoryId || subProduct.productId.categoryId === null) {
          console.warn(`Product ${subProduct.productId._id} has invalid categoryId reference`)
          return false
        }
        
        return true
      })
      .map((subProduct) => ({
        id: subProduct._id.toString(),
        productId: subProduct.productId._id.toString(),
        parentProduct: {
          id: subProduct.productId._id.toString(),
          name: subProduct.productId.name,
          categoryId: subProduct.productId.categoryId._id.toString(),
          category: {
            id: subProduct.productId.categoryId._id.toString(),
            name: subProduct.productId.categoryId.name,
            description: subProduct.productId.categoryId.description
          }
        },
        name: subProduct.name,
        size: subProduct.size,
        weight: subProduct.weight,
        volume: subProduct.volume,
        barcode: subProduct.barcode,
        description: subProduct.description,
        price: subProduct.price,
        stock: subProduct.stock,
        lowStockThreshold: subProduct.lowStockThreshold,
        image: subProduct.image,
        isActive: subProduct.isActive,
        createdAt: subProduct.createdAt,
      }))

    return NextResponse.json({
      subProducts: formattedSubProducts,
      pagination: {
        page,
        limit,
        total: formattedSubProducts.length, // Use filtered count for accurate pagination
        totalInDatabase: total, // Include original count for debugging
        pages: Math.ceil(formattedSubProducts.length / limit),
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
    const { productId, name, size, weight, volume, barcode, description, price, stock, lowStockThreshold, image } =
      body

    console.log("body", body)
    console.log("productId", productId)

    // Verify parent product exists
    const parentProduct = await Product.findById(productId)
    console.log("parentProduct", parentProduct)

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
      barcode,
      description,
      price,
      stock: stock || 0,
      lowStockThreshold: lowStockThreshold || 10,
      image,
      isActive: true,
    })

    await subProduct.save()
    
    // Populate with error handling
    await subProduct.populate({
      path: "productId",
      select: "name categoryId",
      populate: {
        path: "categoryId",
        select: "name description"
      }
    })

    // Validate populated data before returning
    if (!subProduct.productId) {
      console.error("Failed to populate productId for new sub-product")
      return NextResponse.json({ message: "Failed to create sub-product: invalid product reference" }, { status: 500 })
    }

    if (!subProduct.productId.categoryId) {
      console.error("Product has invalid categoryId reference")
      return NextResponse.json({ message: "Failed to create sub-product: product has invalid category reference" }, { status: 500 })
    }

    return NextResponse.json({
      id: subProduct._id.toString(),
      productId: subProduct.productId._id.toString(),
      parentProduct: {
        id: subProduct.productId._id.toString(),
        name: subProduct.productId.name,
        categoryId: subProduct.productId.categoryId._id.toString(),
        category: {
          id: subProduct.productId.categoryId._id.toString(),
          name: subProduct.productId.categoryId.name,
          description: subProduct.productId.categoryId.description
        } 
      },
      name: subProduct.name,
      size: subProduct.size,
      weight: subProduct.weight,
      volume: subProduct.volume,
      barcode: subProduct.barcode,
      description: subProduct.description,
      price: subProduct.price,
      stock: subProduct.stock,
      lowStockThreshold: subProduct.lowStockThreshold,
      image: subProduct.image,
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
// import { SubProductQuery } from "@/lib/types"

// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect()

//     const { searchParams } = new URL(request.url)
//     const productId = searchParams.get("productId")
//     const page = Number.parseInt(searchParams.get("page") || "1")
//     const limit = Number.parseInt(searchParams.get("limit") || "10")
//     const search = searchParams.get("search") || ""
//     const includeInactive = searchParams.get("includeInactive") === "true"

//     const query: SubProductQuery = {}

//     if (!includeInactive) {
//       query.isActive = true
//     }

//     if (productId) {
//       query.productId = productId
//     }

//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { size: { $regex: search, $options: "i" } },
//         { barcode: { $regex: search, $options: "i" } },
//       ]
//     }

//     const skip = (page - 1) * limit
//     const subProducts = await SubProduct.find(query)
//       .populate({
//         path: "productId",
//         select: "name categoryId",
//         populate: {
//           path: "categoryId",
//           select: "name description"
//         }
//       })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)

//     const total = await SubProduct.countDocuments(query)

//     const formattedSubProducts = subProducts.map((subProduct) => ({
//       id: subProduct._id.toString(),
//       productId: subProduct.productId?.toString(),
//       parentProduct: {
//         id: subProduct.productId._id.toString(),
//         name: subProduct.productId.name,
//         categoryId: subProduct.productId.categoryId._id.toString(),
//         category: {
//           id: subProduct.productId.categoryId._id.toString(),
//           name: subProduct.productId.categoryId.name,
//           description: subProduct.productId.categoryId.description
//         }
//       },
//       name: subProduct.name,
//       size: subProduct.size,
//       weight: subProduct.weight,
//       volume: subProduct.volume,
//       barcode: subProduct.barcode,
//       description: subProduct.description,
//       price: subProduct.price,
//       stock: subProduct.stock,
//       lowStockThreshold: subProduct.lowStockThreshold,
//       image: subProduct.image,
//       isActive: subProduct.isActive,
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
//   } catch (error: unknown) {
//     console.error("Error fetching sub-products:", error)
//     return NextResponse.json({ message: "Failed to fetch sub-products" }, { status: 500 })
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     await dbConnect()

//     const body = await request.json()
//     const { productId, name, size, weight, volume, barcode, description, price, stock, lowStockThreshold, image } =
//       body

//     console.log("body", body)
//     console.log("productId", productId)

//     // Verify parent product exists
//     const parentProduct = await Product.findById(productId)
//     console.log("parentProduct", parentProduct)

//     if (!parentProduct) {
//       return NextResponse.json({ message: "Parent product not found" }, { status: 404 })
//     }

//     // Update parent product to have variants
//     if (!parentProduct.hasVariants) {
//       parentProduct.hasVariants = true
//       await parentProduct.save()
//     }

//     const subProduct = new SubProduct({
//       productId,
//       name,
//       size,
//       weight,
//       volume,
//       barcode,
//       description,
//       price,
//       stock: stock || 0,
//       lowStockThreshold: lowStockThreshold || 10,
//       image,
//       isActive: true,
//     })

//     await subProduct.save()
//     await subProduct.populate({
//       path: "productId",
//       select: "name categoryId",
//       populate: {
//         path: "categoryId",
//         select: "name description"
//       }
//     })

//     return NextResponse.json({
//       id: subProduct._id.toString(),
//       productId: subProduct.productId._id.toString(),
//       parentProduct: {
//         id: subProduct.productId._id.toString(),
//         name: subProduct.productId.name,
//         categoryId: subProduct.productId.categoryId._id.toString(),
//         category: {
//           id: subProduct.productId.categoryId._id.toString(),
//           name: subProduct.productId.categoryId.name,
//           description: subProduct.productId.categoryId.description
//         } 
//       },
//       name: subProduct.name,
//       size: subProduct.size,
//       weight: subProduct.weight,
//       volume: subProduct.volume,
//       barcode: subProduct.barcode,
//       description: subProduct.description,
//       price: subProduct.price,
//       stock: subProduct.stock,
//       lowStockThreshold: subProduct.lowStockThreshold,
//       image: subProduct.image,
//       isActive: subProduct.isActive,
//       createdAt: subProduct.createdAt,
//     })
//   } catch (error: unknown) {
//     console.error("Error creating sub-product:", error)
//     if (error && typeof error === "object" && "code" in error && error.code === 11000) {
//       return NextResponse.json({ message: "SKU already exists" }, { status: 400 })
//     }
//     return NextResponse.json({ message: "Failed to create sub-product" }, { status: 500 })
//   }
// }