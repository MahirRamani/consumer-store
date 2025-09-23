import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Student } from "@/lib/models/student"
import { Transaction } from "@/lib/models/transaction"
import { StudentQuery } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: Promise<{ query: string }> }) {
  try {
    await dbConnect()

    const { query } = await params
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get("dateRange") || "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Find student by roll number or name
    const student = await Student.findOne({
      $or: [{ rollNumber: { $regex: query, $options: "i" } }, { name: { $regex: query, $options: "i" } }],
    })

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 })
    }

    // Build date query
    const transactionQuery: StudentQuery = { studentId: student._id }

    if (dateRange !== "all") {
      const now = new Date()
      let start = new Date()

      if (dateRange === "custom" && startDate && endDate) {
        start = new Date(startDate)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        transactionQuery.createdAt = { $gte: start, $lte: end }
      } else {
        switch (dateRange) {
          case "today":
            start.setHours(0, 0, 0, 0)
            transactionQuery.createdAt = { $gte: start, $lte: now }
            break
          case "lastMonth":
            start.setMonth(now.getMonth() - 1)
            transactionQuery.createdAt = { $gte: start, $lte: now }
            break
        }
      }
    }

    const transactions = await Transaction.find(transactionQuery)
      .populate("studentId", "name rollNumber")
      .sort({ createdAt: -1 })

    const totalSpent = transactions
      .filter((t) => t.transactionType === "purchase" && t.status === "completed")
      .reduce((sum, t) => sum + t.totalAmount, 0)

    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction._id.toString(),
      studentId: transaction.studentId._id.toString(),
      sellerId: transaction.sellerId?.toString(),
      items: transaction.items,
      totalAmount: transaction.totalAmount,
      status: transaction.status,
      transactionType: transaction.transactionType,
      performedBy: transaction.performedBy,
      reason: transaction.reason,
      createdAt: transaction.createdAt,
      student: {
        name: transaction.studentId.name,
        rollNumber: transaction.studentId.rollNumber,
      },
    }))

    return NextResponse.json({
      student: {
        id: student._id.toString(),
        name: student.name,
        rollNumber: student.rollNumber,
        standard: student.standard,
        balance: student.balance,
      },
      totalSpent,
      transactionCount: transactions.length,
      transactions: formattedTransactions,
    })
  } catch (error) {
    console.error("Error fetching student transactions:", error)
    return NextResponse.json({ message: "Failed to fetch student transactions" }, { status: 500 })
  }
}
