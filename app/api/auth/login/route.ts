import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { loginSchema } from "@/lib/validations/auth"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    // Find user
    const user = await User.findOne({ username })

    if (!user || user.password !== password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Return user data (excluding password)
    return NextResponse.json({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
