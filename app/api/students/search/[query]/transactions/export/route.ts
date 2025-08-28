import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Student } from "@/lib/models/student"
import { Transaction } from "@/lib/models/transaction"

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
    const transactionQuery: any = { studentId: student._id }

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

    // Generate CSV content
    const headers = ["Date", "Transaction ID", "Type", "Items", "Amount (₹)", "Status", "Performed By", "Reason"]
    const csvRows = [headers.join(",")]

    transactions.forEach((transaction) => {
      const itemsText = transaction.items.map((item) => `${item.name} (${item.quantity}x₹${item.price})`).join("; ")

      const row = [
        new Date(transaction.createdAt).toLocaleDateString(),
        transaction._id.toString(),
        transaction.transactionType,
        `"${itemsText}"`,
        transaction.totalAmount.toFixed(2),
        transaction.status,
        transaction.performedBy,
        `"${transaction.reason || ""}"`,
      ]
      csvRows.push(row.join(","))
    })

    const csvContent = csvRows.join("\n")
    const filename = `${student.rollNumber}-transactions-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting student transactions:", error)
    return NextResponse.json({ message: "Failed to export student transactions" }, { status: 500 })
  }
}
