import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Student } from "@/lib/models/student"
import { updateBalanceSchema } from "@/lib/validations/student"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const body = await request.json()
    const { amount } = updateBalanceSchema.parse(body)

    const student = await Student.findById(params.id)
    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 })
    }

    student.balance += amount
    await student.save()

    return NextResponse.json({
      id: student._id.toString(),
      name: student.name,
      rollNumber: student.rollNumber,
      // email: student.email,
      standard: student.standard,
      // year: student.year,
      balance: student.balance,
      status: student.status,
      createdAt: student.createdAt,
    })
  } catch (error) {
    console.error("Error updating balance:", error)
    return NextResponse.json({ message: "Failed to update balance" }, { status: 500 })
  }
}
