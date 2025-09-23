
// API Route with Pagination (route.ts)
import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"
import { Student } from "@/lib/models/student"
import { Product } from "@/lib/models/product"
import { InventoryLog } from "@/lib/models/inventory-log"
import { CreateTransactionInput, createTransactionSchema } from "@/lib/validations/transaction"
import mongoose from "mongoose"
import { SubProduct } from "@/lib/models/sub-product"
import { TransactionQuery } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const dateRange = searchParams.get("dateRange") || "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Build query
    const query: TransactionQuery = {}

    // Status filter
    if (status !== "all") {
      query.status = status
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()

      switch (dateRange) {
        case "today":
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const endOfToday = new Date(startOfToday)
          endOfToday.setHours(23, 59, 59, 999)
          query.createdAt = { $gte: startOfToday, $lte: endOfToday }
          break
        case "week":
          const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          query.createdAt = { $gte: startOfWeek, $lte: now }
          break
        case "month":
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          query.createdAt = { $gte: startOfMonth, $lte: now }
          break
        case "custom":
          if (startDate) {
            const customStart = new Date(startDate)
            if (endDate) {
              const customEnd = new Date(endDate)
              customEnd.setHours(23, 59, 59, 999)
              query.createdAt = {
                $gte: customStart,
                $lte: customEnd,
              }
            } else {
              query.createdAt = { $gte: customStart }
            }
          }
          break
      }
    }

    // Get total count for pagination info
    let totalCount = await Transaction.countDocuments(query)

    // Get paginated results
    let transactions = await Transaction.find(query)
      .populate("studentId", "name rollNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Search filter (applied after population)
    if (search) {
      // For search, we need to handle pagination differently
      // because filtering happens after population
      const allTransactions = await Transaction.find(query)
        .populate("studentId", "name rollNumber")
        .sort({ createdAt: -1 })

      const filteredTransactions = allTransactions.filter((transaction) => {
        const studentName = transaction.studentId?.name?.toLowerCase() || ""
        const rollNumber = transaction.studentId?.rollNumber?.toLowerCase() || ""
        const transactionId = transaction._id.toString().toLowerCase()
        const searchLower = search.toLowerCase()

        return (
          studentName.includes(searchLower) || 
          rollNumber.includes(searchLower) || 
          transactionId.includes(searchLower)
        )
      })

      // Apply pagination to filtered results
      transactions = filteredTransactions.slice(skip, skip + limit)
      totalCount = filteredTransactions.length
    }

    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction._id.toString(),
      studentId: transaction.studentId._id.toString(),
      sellerId: transaction.sellerId?.toString(),
      items: JSON.stringify(transaction.items),
      totalAmount: transaction.totalAmount,
      status: transaction.status,
      createdAt: transaction.createdAt,
      student: {
        name: transaction.studentId.name,
        rollNumber: transaction.studentId.rollNumber,
      },
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      data: formattedTransactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage,
        startIndex: skip + 1,
        endIndex: Math.min(skip + limit, totalCount)
      }
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ message: "Failed to fetch transactions" }, { status: 500 })
  }
}

function asObjectId(id: string, field: string) {
  if (!mongoose.isValidObjectId(id)) throw new Error(`${field} is not a valid ObjectId`)
  return new mongoose.Types.ObjectId(id)
}


export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    const parsed = createTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ message: "Invalid transaction payload", issues: parsed.error.issues }), {
        status: 400,
      })
    }

    const {
      studentId,
      // sellerId,
      items,
      status = "completed",
      transactionType = "purchase",
      performedBy = "seller",
      reason,
    } = parsed.data as CreateTransactionInput

    try {
      const studentObjectId = asObjectId(studentId, "studentId")
      const student = await Student.findById(studentObjectId)
      if (!student) throw new Error("Student not found")

      // Build normalized items without collapsing by name or product.
      // Each subProductId line stays separate (e.g., ₹5 and ₹10 variants).
      const normalizedItems: Array<{
        productId?: mongoose.Types.ObjectId
        subProductId?: mongoose.Types.ObjectId
        quantity: number
        price: number
        totalPrice: number
      }> = []

      for (const it of items) {
        if (transactionType === "purchase") {
          if (!it.subProductId) throw new Error("For purchase transactions, subProductId is required")
          const subId = asObjectId(it.subProductId, "subProductId")
          const sub = await SubProduct.findById(subId)
          if (!sub) throw new Error("SubProduct not found")

          // Optional stock enforcement (if your SubProduct has stock)
          if (typeof (sub).stock === "number" && (sub).stock < it.quantity) {
            throw new Error("Insufficient stock for one or more items")
          }

          const unitPrice = Number((sub).price) || 0 // server-authoritative
          const totalPrice = unitPrice * it.quantity

          // Decrement stock (if present)
          if (typeof (sub).stock === "number") {
            await SubProduct.updateOne({ _id: subId }, { $inc: { stock: -it.quantity } })
          }

          normalizedItems.push({
            subProductId: subId,
            quantity: it.quantity,
            price: unitPrice,
            totalPrice,
          })
        } else {
          // topup/deduction: price must be provided by client and no stock changes
          if (typeof it.price !== "number")
            throw new Error("For non-purchase transactions, each item must include a price amount")

          const productId =
            it.productId && mongoose.isValidObjectId(it.productId)
              ? new mongoose.Types.ObjectId(it.productId)
              : undefined
          const subProductId =
            it.subProductId && mongoose.isValidObjectId(it.subProductId)
              ? new mongoose.Types.ObjectId(it.subProductId)
              : undefined

          const unitPrice = it.price
          const totalPrice = unitPrice * it.quantity

          normalizedItems.push({
            productId,
            subProductId,
            quantity: it.quantity,
            price: unitPrice,
            totalPrice,
          })
        }
      }

      const totalAmount = normalizedItems.reduce((sum, i) => sum + i.totalPrice, 0)

      // Balance updates
      if (transactionType === "purchase" || transactionType === "deduction") {
        const newBalance = Number(student.balance || 0) - totalAmount;
        // Uncomment to enforce no negative balances:
        // if (newBalance < 0) throw new Error("Insufficient balance")
        (student).balance = newBalance;
        await student.save()
      } else if (transactionType === "topup") {
        (student).balance = Number(student.balance || 0) + totalAmount;
        await student.save()
      }

      
      // Persist the transaction
      const txn = await Transaction.create({
        studentId: studentObjectId,
        // sellerId: "seller",
        items: normalizedItems,
        totalAmount,
        status,
        transactionType,
        performedBy,
        reason,
      })
      
      // // Create inventory log
      // const inventoryLog = new InventoryLog({
      //   productId: subProduct._id,
      //   action: "sale",
      //   quantityChange: - item.quantity,
      //   previousStock,
      //   newStock,
      //   reason: `Sale - Transaction #${transaction._id}`,
      //   userId: "000000000000000000000001",
      // })
      // await inventoryLog.save()

      for (const normalizedItem of normalizedItems) {
        // Get the subProduct to access stock information
        const subProduct = await SubProduct.findById(normalizedItem.subProductId)
        if (subProduct) {
          const previousStock = Number((subProduct).stock || 0) + normalizedItem.quantity // Add back the quantity we just subtracted
          const newStock = Number((subProduct).stock || 0)
          
          const inventoryLog = new InventoryLog({
            subProductId: normalizedItem.subProductId,
            action: "Sale", // Using "Sale" as it's in your enum
            quantityChange: -normalizedItem.quantity, // Negative for sale/outgoing
            previousStock,
            newStock,
            reason: `Sale - Transaction #${txn._id}`,
            userId: new mongoose.Types.ObjectId("000000000000000000000001"),
          })
          await inventoryLog.save()
        }
      }
      
      return new Response(JSON.stringify({ success: true, transaction: txn }), { status: 201 })
    } catch (err) {
      return new Response(
        JSON.stringify({ message: "Failed to create transaction", error: err?.message || "Unknown error" }),
        { status: 400 },
      )
    }
  } catch (error) {
    return new Response(JSON.stringify({ message: "Unexpected error", error: error?.message || "Unknown error" }), {
      status: 500,
    })
  }
}