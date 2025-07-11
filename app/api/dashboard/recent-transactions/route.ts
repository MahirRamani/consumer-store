import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()

    const transactions = await Transaction.find()
      .populate("studentId", "name rollNumber")
      .sort({ createdAt: -1 })
      .limit(10)

    return NextResponse.json(
      transactions.map((transaction) => ({
        id: transaction._id.toString(),
        studentId: transaction.studentId._id.toString(),
        sellerId: transaction.sellerId.toString(),
        items: transaction.items,
        totalAmount: transaction.totalAmount,
        status: transaction.status,
        createdAt: transaction.createdAt,
        student: {
          name: transaction.studentId.name,
          rollNumber: transaction.studentId.rollNumber,
        },
      })),
    )
  } catch (error) {
    console.error("Error fetching recent transactions:", error)
    return NextResponse.json({ message: "Failed to fetch recent transactions" }, { status: 500 })
  }
}
