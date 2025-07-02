"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Store, Bell, LogOut, BarChart3, Package, Warehouse, Receipt, Tag, ShoppingCart } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import OverviewTab from "@/components/admin/overview-tab"
import ProductsTab from "@/components/admin/products-tab"
import InventoryTab from "@/components/admin/inventory-tab"
import TransactionsTab from "@/components/admin/transactions-tab"
import CategoriesTab from "@/components/admin/categories-tab"
import SellingTab from "@/components/admin/selling-tab"

type AdminTab = "overview" | "products" | "categories" | "inventory" | "transactions" | "selling"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const router = useRouter()
  const { logout, user } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const tabs = [
    { id: "overview" as AdminTab, label: "Overview", icon: BarChart3 },
    { id: "selling" as AdminTab, label: "Selling", icon: ShoppingCart },
    { id: "products" as AdminTab, label: "Products", icon: Package },
    { id: "categories" as AdminTab, label: "Categories", icon: Tag },
    { id: "inventory" as AdminTab, label: "Inventory", icon: Warehouse },
    { id: "transactions" as AdminTab, label: "Transactions", icon: Receipt },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />
      case "selling":
        return <SellingTab />
      case "products":
        return <ProductsTab />
      case "categories":
        return <CategoriesTab />
      case "inventory":
        return <InventoryTab />
      case "transactions":
        return <TransactionsTab />
      default:
        return <OverviewTab />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500 text-white w-10 h-10 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Hostel Store Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="text-gray-600">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <nav className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-500"
                      : "border-transparent text-gray-500 hover:text-blue-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">{renderTabContent()}</div>
    </div>
  )
}
