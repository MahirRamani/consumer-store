import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get("dateRange") || "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build date query
    const transactionQuery: any = {
      transactionType: "purchase",
      status: "completed",
    }

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

    // Aggregate transactions by student
    const pipeline = [
      { $match: transactionQuery },
      {
        $group: {
          _id: "$studentId",
          totalSpent: { $sum: "$totalAmount" },
          transactionCount: { $sum: 1 },
          lastTransaction: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $project: {
          rollNumber: "$student.rollNumber",
          name: "$student.name",
          standard: "$student.standard",
          totalSpent: 1,
          transactionCount: 1,
          lastTransaction: 1,
        },
      },
      { $sort: { totalSpent: -1 } },
    ]

    const results = await Transaction.aggregate(pipeline)

    // Generate CSV content
    const headers = ["Roll Number", "Name", "Standard", "Total Spent (₹)", "Transaction Count", "Last Transaction"]
    const csvRows = [headers.join(",")]

    results.forEach((student) => {
      const row = [
        student.rollNumber,
        `"${student.name}"`,
        student.standard,
        student.totalSpent.toFixed(2),
        student.transactionCount,
        student.lastTransaction ? new Date(student.lastTransaction).toLocaleDateString() : "N/A",
      ]
      csvRows.push(row.join(","))
    })

    const csvContent = csvRows.join("\n")
    const filename = `students-timeline-report-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting students timeline report:", error)
    return NextResponse.json({ message: "Failed to export students timeline report" }, { status: 500 })
  }
}
