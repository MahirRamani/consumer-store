import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Student } from "@/lib/models/student"
import { createStudentSchema } from "@/lib/validations/student"

export async function GET() {
  try {
    await dbConnect()
    const students = await Student.find().sort({ createdAt: -1 })

    return NextResponse.json(
      students.map((student) => ({
        id: student._id.toString(),
        name: student.name,
        rollNumber: student.rollNumber,
        standard: student.standard,
        year: student.year,
        balance: student.balance,
        status: student.status,
        createdAt: student.createdAt,
      })),
    )
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ message: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const validatedData = createStudentSchema.parse(body)

    const student = new Student(validatedData)
    await student.save()

    return NextResponse.json(
      {
        id: student._id.toString(),
        name: student.name,
        rollNumber: student.rollNumber,
        standard: student.standard,
        year: student.year,
        balance: student.balance,
        status: student.status,
        createdAt: student.createdAt,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ message: "Failed to create student" }, { status: 500 })
  }
}
