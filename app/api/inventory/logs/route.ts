import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { InventoryLog } from "@/lib/models/inventory-log"
import mongoose from "mongoose"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const action = searchParams.get("action") || "all"
    const dateRange = searchParams.get("dateRange") || "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    // Build query
    const query: any = {}

    // Action filter
    if (action !== "all") {
      query.action = action
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()
      let start = new Date()

      if (dateRange === "custom" && startDate && endDate) {
        start = new Date(startDate)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.createdAt = { $gte: start, $lte: end }
      } else {
        switch (dateRange) {
          case "today":
            start.setHours(0, 0, 0, 0)
            query.createdAt = { $gte: start, $lte: now }
            break
          case "week":
            start.setDate(now.getDate() - 7)
            query.createdAt = { $gte: start, $lte: now }
            break
          case "month":
            start.setMonth(now.getMonth() - 1)
            query.createdAt = { $gte: start, $lte: now }
            break
        }
      }
    }

    // Search filter - build MongoDB text search or regex
    if (search) {
      // First, get product IDs that match the search term
      const Product = require("@/lib/models/product")
      const matchingProducts = await Product.find({
        name: { $regex: search, $options: "i" }
      }).select("_id")
      
      if (matchingProducts.length > 0) {
        query.productId = { $in: matchingProducts.map((p: { _id: mongoose.Types.ObjectId }) => p._id) }
      } else {
        // If no products match, return empty results
        return NextResponse.json({
          data: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCount: 0,
            limit,
            hasNextPage: false,
            hasPreviousPage: false,
            startIndex: 0,
            endIndex: 0
          }
        })
      }
    }

    // Get total count for pagination
    const totalCount = await InventoryLog.countDocuments(query)
    const totalPages = Math.ceil(totalCount / limit)
    const skip = (page - 1) * limit

    // Get paginated results
    const inventoryLogs = await InventoryLog.find(query)
      .populate({
        path: "productId",
        select: "name categoryId",
        populate: {
          path: "categoryId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    console.log("Inventory logs:", inventoryLogs);
    
    
    const formattedLogs = inventoryLogs.map((log) => ({
      id: log._id.toString(),
      productId: log.productId._id.toString(),
      action: log.action,
      quantityChange: log.quantityChange,
      previousStock: log.previousStock,
      newStock: log.newStock,
      reason: log.reason,
      createdAt: log.createdAt,
      product: {
        name: log.productId.name,
        category: log.productId.categoryId?.name || "Unknown",
      },
    }))

    // Calculate pagination info
    const startIndex = totalCount === 0 ? 0 : skip + 1
    const endIndex = Math.min(skip + limit, totalCount)

    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      startIndex,
      endIndex
    }

    return NextResponse.json({
      data: formattedLogs,
      pagination
    })
  } catch (error) {
    console.error("Error fetching inventory logs:", error)
    return NextResponse.json({ message: "Failed to fetch inventory logs" }, { status: 500 })
  }
}

// import { type NextRequest, NextResponse } from "next/server"
// import dbConnect from "@/lib/mongodb"
// import { InventoryLog } from "@/lib/models/inventory-log"

// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect()

//     const { searchParams } = new URL(request.url)
//     const format = searchParams.get("format") || "csv"
//     const action = searchParams.get("action") || "all"
//     const dateRange = searchParams.get("dateRange") || "all"
//     const startDate = searchParams.get("startDate")
//     const endDate = searchParams.get("endDate")

//     // Build query for filtering
//     const query: any = {}

//     // Action filter
//     if (action !== "all") {
//       query.action = action
//     }

//     // Date range filter
//     if (dateRange !== "all") {
//       const now = new Date()
//       let start = new Date()

//       if (dateRange === "custom" && startDate && endDate) {
//         start = new Date(startDate)
//         const end = new Date(endDate)
//         end.setHours(23, 59, 59, 999)
//         query.createdAt = { $gte: start, $lte: end }
//       } else {
//         switch (dateRange) {
//           case "today":
//             start.setHours(0, 0, 0, 0)
//             query.createdAt = { $gte: start, $lte: now }
//             break
//           case "week":
//             start.setDate(now.getDate() - 7)
//             query.createdAt = { $gte: start, $lte: now }
//             break
//           case "month":
//             start.setMonth(now.getMonth() - 1)
//             query.createdAt = { $gte: start, $lte: now }
//             break
//         }
//       }
//     }

//     const inventoryLogs = await InventoryLog.find(query)
//       .populate({
//         path: "productId",
//         select: "name categoryId",
//         populate: {
//           path: "categoryId",
//           select: "name",
//         },
//       })
//       .sort({ createdAt: -1 })

//     if (format === "csv") {
//       const csvHeaders = [
//         "Log ID",
//         "Date",
//         "Time",
//         "Product Name",
//         "Category",
//         "Action",
//         "Quantity Change",
//         "Previous Stock",
//         "New Stock",
//         "Reason",
//       ]

//       const csvRows = inventoryLogs.map((log) => [
//         log._id.toString().slice(-6),
//         new Date(log.createdAt).toLocaleDateString(),
//         new Date(log.createdAt).toLocaleTimeString(),
//         log.productId?.name || "Unknown Product",
//         log.productId?.categoryId?.name || "Unknown Category",
//         log.action.charAt(0).toUpperCase() + log.action.slice(1),
//         log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange.toString(),
//         log.previousStock.toString(),
//         log.newStock.toString(),
//         log.reason || "No reason provided",
//       ])

//       const csvContent = [csvHeaders, ...csvRows]
//         .map((row) => row.map((field) => `"${field}"`).join(","))
//         .join("\n")

//       return new NextResponse(csvContent, {
//         headers: {
//           "Content-Type": "text/csv",
//           "Content-Disposition": `attachment; filename="inventory-logs-${new Date().toISOString().split("T")[0]}.csv"`,
//         },
//       })
//     }

//     return NextResponse.json({ message: "Unsupported format" }, { status: 400 })
//   } catch (error) {
//     console.error("Error exporting inventory logs:", error)
//     return NextResponse.json({ message: "Failed to export inventory logs" }, { status: 500 })
//   }
// }



// // // Aggredation Pipeline
// // import { type NextRequest, NextResponse } from "next/server"
// // import dbConnect from "@/lib/mongodb"
// // import { InventoryLog } from "@/lib/models/inventory-log"
// // import { PipelineCallback } from "stream"
// // import { PipelineStage } from "mongoose"
// // export async function GET(request: NextRequest) {
// //   try {
// //     await dbConnect()

// //     const { searchParams } = new URL(request.url)
// //     const search = searchParams.get("search")
// //     const action = searchParams.get("action")
// //     const dateRange = searchParams.get("dateRange")
// //     const startDate = searchParams.get("startDate")
// //     const endDate = searchParams.get("endDate")

// //     const pipeline: PipelineStage[] = []

// //     // Match stage for basic filters
// //     const matchStage: any = {}

// //     if (action && action !== "all") {
// //       matchStage.action = action
// //     }

// //     // Date range filter
// //     if (dateRange && dateRange !== "all") {
// //       const now = new Date()
// //       let startOfRange: Date

// //       switch (dateRange) {
// //         case "today":
// //           startOfRange = new Date(now.getFullYear(), now.getMonth(), now.getDate())
// //           matchStage.createdAt = { $gte: startOfRange }
// //           break
// //         case "week":
// //           startOfRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
// //           matchStage.createdAt = { $gte: startOfRange }
// //           break
// //         case "month":
// //           startOfRange = new Date(now.getFullYear(), now.getMonth(), 1)
// //           matchStage.createdAt = { $gte: startOfRange }
// //           break
// //         case "custom":
// //           if (startDate) {
// //             startOfRange = new Date(startDate)
// //             if (endDate) {
// //               const endOfRange = new Date(endDate)
// //               endOfRange.setHours(23, 59, 59, 999)
// //               matchStage.createdAt = {
// //                 $gte: startOfRange,
// //                 $lte: endOfRange,
// //               }
// //             } else {
// //               matchStage.createdAt = { $gte: startOfRange }
// //             }
// //           }
// //           break
// //       }
// //     }

// //     if (Object.keys(matchStage).length > 0) {
// //       pipeline.push({ $match: matchStage })
// //     }

// //     // Lookup product
// //     pipeline.push({
// //       $lookup: {
// //         from: "products",
// //         localField: "productId",
// //         foreignField: "_id",
// //         as: "product"
// //       }
// //     })

// //     // Unwind product
// //     pipeline.push({
// //       $unwind: {
// //         path: "$product",
// //         preserveNullAndEmptyArrays: true
// //       }
// //     })

// //     // Lookup category
// //     pipeline.push({
// //       $lookup: {
// //         from: "categories",
// //         localField: "product.categoryId",
// //         foreignField: "_id",
// //         as: "category"
// //       }
// //     })

// //     // Unwind category
// //     pipeline.push({
// //       $unwind: {
// //         path: "$category",
// //         preserveNullAndEmptyArrays: true
// //       }
// //     })

// //     // Search filter (after populating product)
// //     if (search) {
// //       pipeline.push({
// //         $match: {
// //           $or: [
// //             { "product.name": { $regex: search, $options: "i" } },
// //             { "category.name": { $regex: search, $options: "i" } }
// //           ]
// //         }
// //       })
// //     }

// //     // Sort and limit
// //     pipeline.push(
// //       { $sort: { createdAt: -1 } },
// //       { $limit: 100 }
// //     )

// //     const inventoryLogs = await InventoryLog.aggregate(pipeline)

// //     return NextResponse.json(
// //       inventoryLogs.map((log) => ({
// //         id: log._id.toString(),
// //         product: log.product
// //           ? {
// //               id: log.product._id.toString(),
// //               name: log.product.name,
// //               category: log.category ? {
// //                 id: log.category._id.toString(),
// //                 name: log.category.name
// //               } : null,
// //             }
// //           : null,
// //         action: log.action,
// //         quantityChange: log.quantityChange,
// //         previousStock: log.previousStock,
// //         newStock: log.newStock,
// //         reason: log.reason,
// //         createdAt: log.createdAt,
// //       })),
// //     )
// //   } catch (error) {
// //     console.error("Error fetching inventory logs:", error)
// //     return NextResponse.json({ message: "Failed to fetch inventory logs" }, { status: 500 })
// //   }
// // }


// // // // Nested Aggregation
// // // import { type NextRequest, NextResponse } from "next/server"
// // // import dbConnect from "@/lib/mongodb"
// // // import { InventoryLog } from "@/lib/models/inventory-log"

// // // export async function GET(request: NextRequest) {
// // //   try {
// // //     await dbConnect()

// // //     const { searchParams } = new URL(request.url)
// // //     const search = searchParams.get("search")
// // //     const action = searchParams.get("action")
// // //     const dateRange = searchParams.get("dateRange")
// // //     const startDate = searchParams.get("startDate")
// // //     const endDate = searchParams.get("endDate")

// // //     const query: any = {}

// // //     // Search filter
// // //     if (search) {
// // //       // We'll need to populate product to search by name
// // //       // For now, we'll implement basic search
// // //     }

// // //     // Action filter
// // //     if (action && action !== "all") {
// // //       query.action = action
// // //     }

// // //     // Date range filter
// // //     if (dateRange && dateRange !== "all") {
// // //       const now = new Date()
// // //       let startOfRange: Date

// // //       switch (dateRange) {
// // //         case "today":
// // //           startOfRange = new Date(now.getFullYear(), now.getMonth(), now.getDate())
// // //           break
// // //         case "week":
// // //           startOfRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
// // //           break
// // //         case "month":
// // //           startOfRange = new Date(now.getFullYear(), now.getMonth(), 1)
// // //           break
// // //         case "custom":
// // //           if (startDate) {
// // //             startOfRange = new Date(startDate)
// // //             if (endDate) {
// // //               const endOfRange = new Date(endDate)
// // //               endOfRange.setHours(23, 59, 59, 999)
// // //               query.createdAt = {
// // //                 $gte: startOfRange,
// // //                 $lte: endOfRange,
// // //               }
// // //             } else {
// // //               query.createdAt = { $gte: startOfRange }
// // //             }
// // //           }
// // //           break
// // //         default:
// // //           startOfRange = new Date(0) // Beginning of time
// // //       }

// // //       // if (dateRange !== "custom") {
// // //       //   query.createdAt = { $gte: startOfRange }
// // //       // }
// // //     }

// // //     const inventoryLogs = await InventoryLog.find(query)
// // //       .populate({
// // //         path: "productId",
// // //         populate: {
// // //           path: "categoryId",
// // //           model: "Category"
// // //         }
// // //       })
// // //       .sort({ createdAt: -1 })
// // //       .limit(100)

// // //     console.log("inventoryLogs", inventoryLogs);
    
    
// // //     return NextResponse.json(
// // //       inventoryLogs.map((log) => ({
// // //         id: log._id.toString(),
// // //         product: log.productId
// // //           ? {
// // //               id: log.productId._id.toString(),
// // //               name: log.productId.name,
// // //               category: log.productId.categoryId ? {
// // //                 id: log.productId.categoryId._id.toString(),
// // //                 name: log.productId.categoryId.name
// // //               } : null,
// // //             }
// // //           : null,
// // //         action: log.action,
// // //         quantityChange: log.quantityChange,
// // //         previousStock: log.previousStock,
// // //         newStock: log.newStock,
// // //         reason: log.reason,
// // //         createdAt: log.createdAt,
// // //       })),
// // //     )
// // //   } catch (error) {
// // //     console.error("Error fetching inventory logs:", error)
// // //     return NextResponse.json({ message: "Failed to fetch inventory logs" }, { status: 500 })
// // //   }
// // // }

// // // // import { type NextRequest, NextResponse } from "next/server"
// // // // import dbConnect from "@/lib/mongodb"
// // // // import { InventoryLog } from "@/lib/models/inventory-log"

// // // // export async function GET(request: NextRequest) {
// // // //   try {
// // // //     await dbConnect()

// // // //     const { searchParams } = new URL(request.url)
// // // //     const search = searchParams.get("search")
// // // //     const action = searchParams.get("action")
// // // //     const dateRange = searchParams.get("dateRange")

// // // //     let query: any = {}

// // // //     // Date range filter
// // // //     if (dateRange && dateRange !== "all") {
// // // //       const now = new Date()
// // // //       const startDate = new Date()

// // // //       switch (dateRange) {
// // // //         case "today":
// // // //           startDate.setHours(0, 0, 0, 0)
// // // //           break
// // // //         case "week":
// // // //           startDate.setDate(now.getDate() - 7)
// // // //           break
// // // //         case "month":
// // // //           startDate.setMonth(now.getMonth() - 1)
// // // //           break
// // // //       }

// // // //       query = { ...query, createdAt: { $gte: startDate } }
// // // //     }

// // // //     // Action filter
// // // //     if (action && action !== "all") {
// // // //       query = { ...query, action }
// // // //     }

// // // //     const logs = await InventoryLog.find(query)
// // // //       .populate("productId", "name category")
// // // //       .sort({ createdAt: -1 })
// // // //       .limit(100)

// // // //     return NextResponse.json(
// // // //       logs.map((log) => ({
// // // //         id: log._id.toString(),
// // // //         productId: log.productId._id.toString(),
// // // //         action: log.action,
// // // //         quantityChange: log.quantityChange,
// // // //         previousStock: log.previousStock,
// // // //         newStock: log.newStock,
// // // //         reason: log.reason,
// // // //         userId: log.userId.toString(),
// // // //         createdAt: log.createdAt,
// // // //         product: {
// // // //           name: log.productId.name,
// // // //           category: log.productId.category,
// // // //         },
// // // //       })),
// // // //     )
// // // //   } catch (error) {
// // // //     console.error("Error fetching inventory logs:", error)
// // // //     return NextResponse.json({ message: "Failed to fetch inventory logs" }, { status: 500 })
// // // //   }
// // // // }
