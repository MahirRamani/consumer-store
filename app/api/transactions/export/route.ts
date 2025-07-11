import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const dateRange = searchParams.get("dateRange") || "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build query for date filtering
    const query: any = {}
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

    const transactions = await Transaction.find(query)
      .populate("studentId", "name rollNumber standard")
      .sort({ createdAt: -1 })

    if (format === "csv") {
      const csvHeaders = [
        "Transaction ID",
        "Date",
        "Student Name",
        "Roll Number",
        "Standard",
        "Amount",
        "Items Count",
        "Status",
        "Performed By",
      ]

      const csvRows = transactions.map((transaction) => [
        `TXN${transaction._id.toString().slice(-6)}`,
        new Date(transaction.createdAt).toLocaleDateString(),
        transaction.studentId?.name || "Unknown",
        transaction.studentId?.rollNumber || "N/A",
        transaction.studentId?.standard || "N/A",
        transaction.totalAmount.toFixed(2),
        transaction.items.length,
        transaction.status,
        "Seller",
      ])

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ message: "Unsupported format" }, { status: 400 })
  } catch (error) {
    console.error("Error exporting transactions:", error)
    return NextResponse.json({ message: "Failed to export transactions" }, { status: 500 })
  }
}
