import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Student } from "@/lib/models/student"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const student = await Student.findById(params.id)
    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 })
    }

    await Student.findByIdAndDelete(params.id)

    return NextResponse.json({ message: "Student deleted successfully" })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ message: "Failed to delete student" }, { status: 500 })
  }
}
