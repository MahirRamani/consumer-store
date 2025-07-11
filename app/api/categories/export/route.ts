import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Category } from "@/lib/models/category"
import { Product } from "@/lib/models/product"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    const categories = await Category.find({}).sort({ createdAt: -1 })

    if (format === "csv") {
      const csvHeaders = ["Category ID", "Name", "Description", "Products Count", "Status", "Created Date"]

      const csvRows = await Promise.all(
        categories.map(async (category) => {
          const productsCount = await Product.countDocuments({ categoryId: category._id })
          return [
            category._id.toString().slice(-6),
            category.name,
            category.description || "No description",
            productsCount,
            category.isActive ? "Active" : "Inactive",
            new Date(category.createdAt).toLocaleDateString(),
          ]
        }),
      )

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="categories-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ message: "Unsupported format" }, { status: 400 })
  } catch (error) {
    console.error("Error exporting categories:", error)
    return NextResponse.json({ message: "Failed to export categories" }, { status: 500 })
  }
}
