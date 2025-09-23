"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth-store"
import { useQuery } from "@tanstack/react-query"
import StudentLookup from "@/components/seller/student-lookup"
import ProductGrid from "@/components/seller/product-grid"
import ShoppingCart from "@/components/seller/shopping-cart"
import type { Student, CartItem, SubProduct } from "@/lib/types"

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

  // const handleLogout = () => {
  //   logout()
  //   router.push("/login")
  // }

  const addToCart = (product: SubProduct) => {
    if (product.stock <= 0) return

    const itemId = product.productId || product.id
    const existingItem = cartItems.find((item) => {
      const existingItemId = item.subProductId || item.productId
      return existingItemId === itemId
    })

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCartItems((items) =>
          items.map((item) => {
            const existingItemId = item.subProductId || item.productId
            return existingItemId === itemId ? { ...item, quantity: item.quantity + 1 } : item
          }),
        )
      }
    } else {
      setCartItems((items) => [
        ...items,
        {
          productId: product.productId || product.id,
          subProductId: product.subProductId,
          name: product.name,
          price: Number.parseFloat(product.price),
          quantity: 1,
          stock: product.stock,
          itemType: product.subProductId ? "subProduct" : "product",
        },
      ])
    }
  }

  const removeFromCart = (productId: string, subProductId?: string) => {
    const itemId = subProductId || productId
    const existingItem = cartItems.find((item) => {
      const existingItemId = item.subProductId || item.productId
      return existingItemId === itemId
    })

    if (existingItem) {
      if (existingItem.quantity > 1) {
        setCartItems((items) =>
          items.map((item) => {
            const existingItemId = item.subProductId || item.productId
            return existingItemId === itemId ? { ...item, quantity: item.quantity - 1 } : item
          }),
        )
      } else {
        setCartItems((items) =>
          items.filter((item) => {
            const existingItemId = item.subProductId || item.productId
            return existingItemId !== itemId
          }),
        )
      }
    }
  }

  const updateCartItemQuantity = (productId: string, newQuantity: number, subProductId?: string) => {
    const itemId = subProductId || productId
    if (newQuantity <= 0) {
      setCartItems((items) =>
        items.filter((item) => {
          const existingItemId = item.subProductId || item.productId
          return existingItemId !== itemId
        }),
      )
    } else {
      setCartItems((items) =>
        items.map((item) => {
          const existingItemId = item.subProductId || item.productId
          return existingItemId === itemId ? { ...item, quantity: newQuantity } : item
        }),
      )
    }
  }

  const removeFromCartCompletely = (productId: string, subProductId?: string) => {
    const itemId = subProductId || productId
    setCartItems((items) =>
      items.filter((item) => {
        const existingItemId = item.subProductId || item.productId
        return existingItemId !== itemId
      }),
    )
  }

  const clearCart = () => {
    setCartItems([])
  }

  const resetTransaction = () => {
    setSelectedStudent(null)
    clearCart()
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-sm text-gray-600">Hostel Store Transactions</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Today's Sales</p>
              <p className="text-lg font-bold text-green-500">₹{dashboardStats?.todaySales?.toFixed(2) || "0.00"}</p>
            </div>
            {/* <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button> */}
          </div>
        </div>
      </header>

      {/* Main POS Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Student Search & Products */}
        <div className="lg:col-span-2 space-y-2">
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