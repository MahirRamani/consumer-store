"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Store, Bell, LogOut, BarChart3, Package, Warehouse, Receipt, Tag, ShoppingCart, Layers } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import OverviewTab from "@/components/admin/overview-tab"
import ProductsTab from "@/components/admin/products-tab"
import SubProductsTab from "@/components/admin/sub-products-tab"
import InventoryTab from "@/components/admin/inventory-tab"
import TransactionsTab from "@/components/admin/transactions-tab"
import CategoriesTab from "@/components/admin/categories-tab"
import SellingTab from "@/components/admin/selling-tab"
import {StudentTransactionReport} from "@/components/reports/student-transaction-report"
import {TimelineReport} from "@/components/reports/timeline-report"

type AdminTab =
  | "overview"
  | "products"
  | "subproducts"
  | "categories"
  | "inventory"
  | "transactions"
  | "selling"
  | "student-report"
  | "timeline-report"

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
    { id: "subproducts" as AdminTab, label: "Sub-Products", icon: Layers },
    { id: "categories" as AdminTab, label: "Categories", icon: Tag },
    { id: "inventory" as AdminTab, label: "Inventory", icon: Warehouse },
    { id: "transactions" as AdminTab, label: "Transactions", icon: Receipt },
    { id: "student-report" as AdminTab, label: "Student Report", icon: Receipt },
    { id: "timeline-report" as AdminTab, label: "Timeline Report", icon: BarChart3 },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />
      case "selling":
        return <SellingTab />
      case "products":
        return <ProductsTab />
      case "subproducts":
        return <SubProductsTab />
      case "categories":
        return <CategoriesTab />
      case "inventory":
        return <InventoryTab />
      case "transactions":
        return <TransactionsTab />
      case "student-report":
        return <StudentTransactionReport />
      case "timeline-report":
        return <TimelineReport />
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
            <Button variant="outline" className="text-gray-600 bg-transparent">
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
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
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



// "use client"

// import { useState, useEffect } from "react"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Button } from "@/components/ui/button"
// import { LogOut, BarChart3, Package, Users, ShoppingCart, FolderOpen, Layers, FileText, TrendingUp } from "lucide-react"
// import { useAuthStore } from "@/lib/store/auth-store"
// import { useRouter } from "next/navigation"
// import  OverviewTab from "@/components/admin/overview-tab"
// import  ProductsTab from "@/components/admin/products-tab"
// import  {SubProductsTab} from "@/components/admin/sub-products-tab"
// import  CategoriesTab from "@/components/admin/categories-tab"
// import  StudentsTab from "@/components/admin/students-tab"
// import  TransactionsTab from "@/components/admin/transactions-tab"
// import  InventoryTab from "@/components/admin/inventory-tab"
// import { StudentTransactionReportComponent } from "@/components/reports/student-transaction-report"
// import { TimelineReportComponent } from "@/components/reports/timeline-report"

// export default function AdminDashboard() {
//   const { user, logout } = useAuthStore()
//   const router = useRouter()
//   const [activeTab, setActiveTab] = useState("overview")

//   // useEffect(() => {
//   //   if (!user || user.role !== "admin") {
//   //     router.push("/login")
//   //   }
//   // }, [user, router])

//   const handleLogout = () => {
//     logout()
//     router.push("/login")
//   }

//   if (!user || user.role !== "admin") {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-2xl font-bold">Admin Dashboard</h1>
//               <p className="text-muted-foreground">Welcome back, {user.name}</p>
//             </div>
//             <Button onClick={handleLogout} variant="outline">
//               <LogOut className="h-4 w-4 mr-2" />
//               Logout
//             </Button>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-4 py-8">
//         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//           <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
//             <TabsTrigger value="overview" className="flex items-center gap-2">
//               <BarChart3 className="h-4 w-4" />
//               <span className="hidden sm:inline">Overview</span>
//             </TabsTrigger>
//             <TabsTrigger value="products" className="flex items-center gap-2">
//               <Package className="h-4 w-4" />
//               <span className="hidden sm:inline">Products</span>
//             </TabsTrigger>
//             <TabsTrigger value="sub-products" className="flex items-center gap-2">
//               <Layers className="h-4 w-4" />
//               <span className="hidden sm:inline">Variants</span>
//             </TabsTrigger>
//             <TabsTrigger value="categories" className="flex items-center gap-2">
//               <FolderOpen className="h-4 w-4" />
//               <span className="hidden sm:inline">Categories</span>
//             </TabsTrigger>
//             <TabsTrigger value="students" className="flex items-center gap-2">
//               <Users className="h-4 w-4" />
//               <span className="hidden sm:inline">Students</span>
//             </TabsTrigger>
//             <TabsTrigger value="transactions" className="flex items-center gap-2">
//               <ShoppingCart className="h-4 w-4" />
//               <span className="hidden sm:inline">Transactions</span>
//             </TabsTrigger>
//             <TabsTrigger value="inventory" className="flex items-center gap-2">
//               <Package className="h-4 w-4" />
//               <span className="hidden sm:inline">Inventory</span>
//             </TabsTrigger>
//             <TabsTrigger value="student-report" className="flex items-center gap-2">
//               <FileText className="h-4 w-4" />
//               <span className="hidden sm:inline">Student Report</span>
//             </TabsTrigger>
//             <TabsTrigger value="timeline-report" className="flex items-center gap-2">
//               <TrendingUp className="h-4 w-4" />
//               <span className="hidden sm:inline">Timeline Report</span>
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="overview">
//             <OverviewTab />
//           </TabsContent>

//           <TabsContent value="products">
//             <ProductsTab />
//           </TabsContent>

//           <TabsContent value="sub-products">
//             <SubProductsTab />
//           </TabsContent>

//           <TabsContent value="categories">
//             <CategoriesTab />
//           </TabsContent>

//           <TabsContent value="students">
//             <StudentsTab />
//           </TabsContent>

//           <TabsContent value="transactions">
//             <TransactionsTab />
//           </TabsContent>

//           <TabsContent value="inventory">
//             <InventoryTab />
//           </TabsContent>

//           <TabsContent value="student-report">
//             <StudentTransactionReportComponent />
//           </TabsContent>

//           <TabsContent value="timeline-report">
//             <TimelineReportComponent />
//           </TabsContent>
//         </Tabs>
//       </main>
//     </div>
//   )
// }
// // "use client"

// // import { useState } from "react"
// // import { useRouter } from "next/navigation"
// // import { Button } from "@/components/ui/button"
// // import { Store, Bell, LogOut, BarChart3, Package, Warehouse, Receipt, Tag, ShoppingCart } from "lucide-react"
// // import { useAuthStore } from "@/lib/store/auth-store"
// // import OverviewTab from "@/components/admin/overview-tab"
// // import ProductsTab from "@/components/admin/products-tab"
// // import InventoryTab from "@/components/admin/inventory-tab"
// // import TransactionsTab from "@/components/admin/transactions-tab"
// // import CategoriesTab from "@/components/admin/categories-tab"
// // import SellingTab from "@/components/admin/selling-tab"

// // type AdminTab = "overview" | "products" | "categories" | "inventory" | "transactions" | "selling"

// // export default function AdminDashboard() {
// //   const [activeTab, setActiveTab] = useState<AdminTab>("overview")
// //   const router = useRouter()
// //   const { logout, user } = useAuthStore()

// //   const handleLogout = () => {
// //     logout()
// //     router.push("/login")
// //   }

// //   const tabs = [
// //     { id: "overview" as AdminTab, label: "Overview", icon: BarChart3 },
// //     { id: "selling" as AdminTab, label: "Selling", icon: ShoppingCart },
// //     { id: "products" as AdminTab, label: "Products", icon: Package },
// //     { id: "categories" as AdminTab, label: "Categories", icon: Tag },
// //     { id: "inventory" as AdminTab, label: "Inventory", icon: Warehouse },
// //     { id: "transactions" as AdminTab, label: "Transactions", icon: Receipt },
// //   ]

// //   const renderTabContent = () => {
// //     switch (activeTab) {
// //       case "overview":
// //         return <OverviewTab />
// //       case "selling":
// //         return <SellingTab />
// //       case "products":
// //         return <ProductsTab />
// //       case "categories":
// //         return <CategoriesTab />
// //       case "inventory":
// //         return <InventoryTab />
// //       case "transactions":
// //         return <TransactionsTab />
// //       default:
// //         return <OverviewTab />
// //     }
// //   }

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       {/* Header */}
// //       <header className="bg-white shadow-sm border-b border-gray-200">
// //         <div className="px-6 py-4 flex items-center justify-between">
// //           <div className="flex items-center space-x-4">
// //             <div className="bg-blue-500 text-white w-10 h-10 rounded-lg flex items-center justify-center">
// //               <Store className="w-6 h-6" />
// //             </div>
// //             <div>
// //               <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
// //               <p className="text-sm text-gray-600">Hostel Store Management</p>
// //             </div>
// //           </div>
// //           <div className="flex items-center space-x-4">
// //             <Button variant="outline" className="text-gray-600">
// //               <Bell className="w-4 h-4 mr-2" />
// //               Notifications
// //             </Button>
// //             <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
// //               <LogOut className="w-4 h-4 mr-2" />
// //               Logout
// //             </Button>
// //           </div>
// //         </div>
// //       </header>

// //       {/* Navigation Tabs */}
// //       <div className="bg-white border-b border-gray-200">
// //         <nav className="px-6">
// //           <div className="flex space-x-8">
// //             {tabs.map((tab) => {
// //               const Icon = tab.icon
// //               return (
// //                 <button
// //                   key={tab.id}
// //                   onClick={() => setActiveTab(tab.id)}
// //                   className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
// //                     activeTab === tab.id
// //                       ? "border-blue-500 text-blue-500"
// //                       : "border-transparent text-gray-500 hover:text-blue-500"
// //                   }`}
// //                 >
// //                   <Icon className="w-4 h-4" />
// //                   <span>{tab.label}</span>
// //                 </button>
// //               )
// //             })}
// //           </div>
// //         </nav>
// //       </div>

// //       {/* Tab Content */}
// //       <div className="p-6">{renderTabContent()}</div>
// //     </div>
// //   )
// // }
