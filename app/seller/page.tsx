"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useQuery } from "@tanstack/react-query"
import StudentLookup from "@/components/seller/student-lookup"
import ProductGrid from "@/components/seller/product-grid"
import ShoppingCart from "@/components/seller/shopping-cart"
import type { Student, CartItem, Product, SubProduct } from "@/lib/types"

export default function SellerInterface() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")
      return response.json()
    },
  })

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const addToCart = (product: SubProduct) => {
    if (product.stock <= 0) return

    const existingItem = cartItems.find((item) => item.productId === product.id)
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCartItems((items) =>
          items.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)),
        )
      }
    } else {
      setCartItems((items) => [
        ...items,
        {
          productId: product.id,
          name: product.name,
          price: Number.parseFloat(product.price),
          quantity: 1,
          stock: product.stock,
        },
      ])
    }
  }

  const removeFromCart = (productId: string) => {
    const existingItem = cartItems.find((item) => item.productId === productId)
    if (existingItem) {
      if (existingItem.quantity > 1) {
        setCartItems((items) =>
          items.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item)),
        )
      } else {
        setCartItems((items) => items.filter((item) => item.productId !== productId))
      }
    }
  }

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems((items) => items.filter((item) => item.productId !== productId))
    } else {
      setCartItems((items) =>
        items.map((item) => (item.productId === productId ? { ...item, quantity: newQuantity } : item)),
      )
    }
  }

  const removeFromCartCompletely = (productId: string) => {
    setCartItems((items) => items.filter((item) => item.productId !== productId))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const resetTransaction = () => {
    setSelectedStudent(null)
    clearCart()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main POS Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-[calc(100vh-88px)]">
        {/* Left Side: Student Search & Products */}
        <div className="lg:col-span-2 space-y-6">
          <StudentLookup selectedStudent={selectedStudent} onStudentSelect={setSelectedStudent} />
          <ProductGrid onAddToCart={addToCart} onRemoveFromCart={removeFromCart} cartItems={cartItems} />
        </div>

        {/* Right Side: Shopping Cart */}
        <div>
          <ShoppingCart
            selectedStudent={selectedStudent}
            cartItems={cartItems}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeFromCartCompletely}
            onClearCart={clearCart}
            onTransactionComplete={resetTransaction}
          />
        </div>
      </div>
    </div>
  )
}
