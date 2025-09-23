import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { InventoryLog } from "@/lib/models/inventory-log"
import mongoose from "mongoose"
import { Product, SubProduct } from "@/lib/models"
import { FormattedInventoryLog } from "@/lib/types"

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
    const query: Record<string, unknown> = {}

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
      const matchingSubProducts = await SubProduct.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { size: { $regex: search, $options: "i" } }
        ]
      }).select("_id")

      // Also search in parent products
      const matchingProducts = await Product.find({
        name: { $regex: search, $options: "i" }
      }).select("_id")
      
      if (matchingProducts.length > 0) {
        const subProductsFromParents = await SubProduct.find({
          productId: { $in: matchingProducts.map((p: { _id: mongoose.Types.ObjectId }) => p._id) }
        }).select("_id")
        
        matchingSubProducts.push(...subProductsFromParents)
      }
      
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
        path: "subProductId", // Updated field name
        select: "name size price stock productId",
        populate: {
          path: "productId",
          select: "name categoryId",
          populate: {
            path: "categoryId",
            select: "name",
          },
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    console.log("Inventory logs:", inventoryLogs);
    
    
    const formattedLogs : FormattedInventoryLog[] = inventoryLogs.map((log) => ({
      id: log._id.toString(),
      subProductId: log.subProductId._id.toString(),
      action: log.action,
      quantityChange: log.quantityChange,
      previousStock: log.previousStock,
      newStock: log.newStock,
      reason: log.reason,
      createdAt: log.createdAt,
      product: {
        name: `${log.subProductId.productId?.name} - ${log.subProductId.name}`, // Combined name
        size: log.subProductId.size,
        price: log.subProductId.price,
        category: log.subProductId.productId?.categoryId?.name || "🤔❓",
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