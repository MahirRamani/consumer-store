import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Student } from "@/lib/models/student"
import { Transaction } from "@/lib/models/transaction"
import { StudentQuery } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: Promise<{ rollNumber: string }> }) {
  try {
    await dbConnect()

    const { rollNumber } = await params
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get("dateRange") || "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const format = searchParams.get("format") || "csv"

    // Find student
    const student = await Student.findOne({
      $or: [{ rollNumber: { $regex: rollNumber, $options: "i" } }, { name: { $regex: rollNumber, $options: "i" } }],
    })

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 })
    }

    // Build date query
    const query: StudentQuery = { studentId: student._id }

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
          case "lastMonth":
            start.setMonth(now.getMonth() - 1)
            query.createdAt = { $gte: start, $lte: now }
            break
        }
      }
    }

    const transactions = await Transaction.find(query).sort({ createdAt: -1 })

    if (format === "csv") {
      const csvHeaders = ["Date", "Transaction Type", "Amount (₹)", "Status", "Performed By", "Items Count", "Reason"]

      const csvRows = transactions.map((transaction) => [
        new Date(transaction.createdAt).toLocaleDateString(),
        transaction.transactionType,
        transaction.totalAmount.toFixed(2),
        transaction.status,
        transaction.performedBy,
        transaction.items.length,
        transaction.reason || "N/A",
      ])

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

      const filename = `${student.rollNumber}-transactions-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({ message: "Unsupported format" }, { status: 400 })
  } catch (error) {
    console.error("Error exporting student transactions:", error)
    return NextResponse.json({ message: "Failed to export student transactions" }, { status: 500 })
  }
}
