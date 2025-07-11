import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { InventoryLog } from "@/lib/models/inventory-log"
import mongoose from "mongoose"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const search = searchParams.get("search") || ""
    const action = searchParams.get("action") || "all"
    const dateRange = searchParams.get("dateRange") || "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build query for filtering
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

    // Search filter
    if (search) {
      const Product = require("@/lib/models/product")
      const matchingProducts = await Product.find({
        name: { $regex: search, $options: "i" }
      }).select("_id")
      
      if (matchingProducts.length > 0) {
        query.productId = { $in: matchingProducts.map((p: { _id:  mongoose.Types.ObjectId}) => p._id) }
      } else {
        // If no products match, return empty CSV
        if (format === "csv") {
          const csvHeaders = [
            "Date",
            "Product Name",
            "Category",
            "Action",
            "Quantity Change",
            "Previous Stock",
            "New Stock",
            "Reason",
          ]
          const csvContent = csvHeaders.join(",")
          
          return new NextResponse(csvContent, {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="inventory-logs-${new Date().toISOString().split("T")[0]}.csv"`,
            },
          })
        }
      }
    }

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

    if (format === "csv") {
      const csvHeaders = [
        "Date",
        "Time",
        "Product Name",
        "Category",
        "Action",
        "Quantity Change",
        "Previous Stock",
        "New Stock",
        "Reason",
      ]

      const csvRows = inventoryLogs.map((log) => [
        new Date(log.createdAt).toLocaleDateString(),
        new Date(log.createdAt).toLocaleTimeString(),
        log.productId?.name || "Unknown Product",
        log.productId?.categoryId?.name || "Unknown Category",
        log.action,
        log.quantityChange,
        log.previousStock,
        log.newStock,
        log.reason || "No reason provided",
      ])

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="inventory-logs-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ message: "Unsupported format" }, { status: 400 })
  } catch (error) {
    console.error("Error exporting inventory logs:", error)
    return NextResponse.json({ message: "Failed to export inventory logs" }, { status: 500 })
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



// // import { type NextRequest, NextResponse } from "next/server"
// // import dbConnect from "@/lib/mongodb"
// // import { InventoryLog } from "@/lib/models/inventory-log"

// // export async function GET(request: NextRequest) {
// //   try {
// //     await dbConnect()

// //     const { searchParams } = new URL(request.url)
// //     const search = searchParams.get("search") || ""
// //     const action = searchParams.get("action") || "all"
// //     const dateRange = searchParams.get("dateRange") || "all"
// //     const startDate = searchParams.get("startDate")
// //     const endDate = searchParams.get("endDate")

// //     // Build query
// //     const query: any = {}

// //     // Action filter
// //     if (action !== "all") {
// //       query.action = action
// //     }

// //     // Date range filter
// //     if (dateRange !== "all") {
// //       const now = new Date()
// //       let start = new Date()

// //       if (dateRange === "custom" && startDate && endDate) {
// //         start = new Date(startDate)
// //         const end = new Date(endDate)
// //         end.setHours(23, 59, 59, 999)
// //         query.createdAt = { $gte: start, $lte: end }
// //       } else {
// //         switch (dateRange) {
// //           case "today":
// //             start.setHours(0, 0, 0, 0)
// //             query.createdAt = { $gte: start, $lte: now }
// //             break
// //           case "week":
// //             start.setDate(now.getDate() - 7)
// //             query.createdAt = { $gte: start, $lte: now }
// //             break
// //           case "month":
// //             start.setMonth(now.getMonth() - 1)
// //             query.createdAt = { $gte: start, $lte: now }
// //             break
// //         }
// //       }
// //     }

// //     let inventoryLogs = await InventoryLog.find(query)
// //       .populate({
// //         path: "productId",
// //         select: "name categoryId",
// //         populate: {
// //           path: "categoryId",
// //           select: "name",
// //         },
// //       })
// //       .sort({ createdAt: -1 })
// //       .limit(100)

// //     // Search filter (applied after population)
// //     if (search) {
// //       inventoryLogs = inventoryLogs.filter((log) => {
// //         const productName = log.productId?.name?.toLowerCase() || ""
// //         const searchLower = search.toLowerCase()
// //         return productName.includes(searchLower)
// //       })
// //     }

// //     const formattedLogs = inventoryLogs.map((log) => ({
// //       id: log._id.toString(),
// //       productId: log.productId._id.toString(),
// //       action: log.action,
// //       quantityChange: log.quantityChange,
// //       previousStock: log.previousStock,
// //       newStock: log.newStock,
// //       reason: log.reason,
// //       createdAt: log.createdAt,
// //       product: {
// //         name: log.productId.name,
// //         category: log.productId.categoryId?.name || "Unknown",
// //       },
// //     }))

// //     return NextResponse.json(formattedLogs)
// //   } catch (error) {
// //     console.error("Error fetching inventory logs:", error)
// //     return NextResponse.json({ message: "Failed to fetch inventory logs" }, { status: 500 })
// //   }
// // }
