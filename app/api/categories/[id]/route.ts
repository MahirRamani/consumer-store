import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Category } from "@/lib/models/category"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const category = await Category.findById(params.id)
    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 })
    }

    await Category.findByIdAndDelete(params.id)

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ message: "Failed to delete category" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const body = await request.json()
    const category = await Category.findById(params.id)

    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 })
    }

    Object.keys(body).forEach((key) => {
      if (body[key] !== undefined) {
        category[key] = body[key]
      }
    })

    await category.save()

    return NextResponse.json({
      id: category._id.toString(),
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
    })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ message: "Failed to update category" }, { status: 500 })
  }
}
