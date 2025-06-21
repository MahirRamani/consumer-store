import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Student } from "@/lib/models/student"

export async function GET(request: NextRequest, { params }: { params: { rollNumber: string } }) {
  try {
    await dbConnect()

    const student = await Student.findOne({ rollNumber: params.rollNumber })

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 })
    }

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
    console.error("Error fetching student:", error)
    return NextResponse.json({ message: "Failed to fetch student" }, { status: 500 })
  }
}
