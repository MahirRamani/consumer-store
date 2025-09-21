import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Category } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()

    const categories = await Category.find({ isActive: true }).sort({ name: 1 })

    return NextResponse.json(
      categories.map((category) => ({
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt,
      })),
    )
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect()

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ message: "Category name is required" }, { status: 400 })
    }

    const category = new Category({
      name,
      description,
      isActive: true,
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
    console.error("Error creating category:", error)
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "Category name already exists" }, { status: 400 })
    }
    return NextResponse.json({ message: "Failed to create category" }, { status: 500 })
  }
}

// import { type NextRequest, NextResponse } from "next/server"
// import dbConnect from "@/lib/mongodb"
// import { Category } from "@/lib/models/category"
// import { createCategorySchema } from "@/lib/validations/category"

// export async function GET() {
//   try {
//     await dbConnect()
//     const categories = await Category.find().sort({ createdAt: -1 })

//     return NextResponse.json(
//       categories.map((category) => ({
//         id: category._id.toString(),
//         name: category.name,
//         description: category.description,
//         isActive: category.isActive,
//         createdAt: category.createdAt,
//       })),
//     )
//   } catch (error) {
//     console.error("Error fetching categories:", error)
//     return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 })
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     await dbConnect()

//     const body = await request.json()
//     const validatedData = createCategorySchema.parse(body)

//     const category = new Category(validatedData)
//     await category.save()

//     return NextResponse.json(
//       {
//         id: category._id.toString(),
//         name: category.name,
//         description: category.description,
//         isActive: category.isActive,
//         createdAt: category.createdAt,
//       },
//       { status: 201 },
//     )
//   } catch (error) {
//     console.error("Error creating category:", error)
//     return NextResponse.json({ message: "Failed to create category" }, { status: 500 })
//   }
// }
