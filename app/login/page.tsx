"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/store/auth-store"
import { Store, UserCog, BarChart3 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)

  const handleQuickLogin = async (role: "admin" | "accountant") => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: role,
          password: role === "admin" ? "admin123" : "accountant123",
        }),
      })

      if (response.ok) {
        const user = await response.json()
        login(user)
        toast.success(`Welcome back, ${user.username}!`)
        router.push(`/${role}`)
      } else {
        throw new Error("Login failed")
      }
    } catch (error) {
      toast.error("Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        const user = await response.json()
        login(user)
        toast.success(`Welcome back, ${user.username}!`)
        router.push(`/${user.role}`)
      } else {
        throw new Error("Login failed")
      }
    } catch (error) {
      toast.error("Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hostel Store</h1>
            <p className="text-gray-600 mt-2">Management System</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button
              onClick={() => handleQuickLogin("admin")}
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-base font-medium"
            >
              <UserCog className="w-5 h-5 mr-2" />
              Login as Admin
            </Button>

            <Button
              onClick={() => handleQuickLogin("accountant")}
              disabled={isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 text-base font-medium"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Login as Accountant
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or login manually</span>
            </div>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-gray-800 hover:bg-gray-700 text-white">
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Demo credentials: admin/admin123, accountant/accountant123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
