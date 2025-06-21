"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart3, LogOut, Search, Download, Filter, Receipt, Users } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useQuery } from "@tanstack/react-query"
import StudentManagement from "@/components/accountant/student-management"

type AccountantTab = "analytics" | "transactions" | "students"

export default function AccountantDashboard() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState("today")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState<AccountantTab>("analytics")

  const tabs = [
    { id: "analytics" as AccountantTab, label: "Analytics", icon: BarChart3 },
    { id: "transactions" as AccountantTab, label: "Transactions", icon: Receipt },
    { id: "students" as AccountantTab, label: "Students", icon: Users },
  ]

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", searchTerm, dateRange, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (dateRange !== "all") params.append("dateRange", dateRange)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/transactions?${params}`)
      if (!response.ok) throw new Error("Failed to fetch transactions")
      return response.json()
    },
  })

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await fetch("/api/analytics")
      if (!response.ok) throw new Error("Failed to fetch analytics")
      return response.json()
    },
  })

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log("Exporting data...")
  }

  const renderTabContent = (tab: AccountantTab) => {
    switch (tab) {
      case "analytics":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{analytics?.totalRevenue?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <BarChart3 className="text-green-600 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                    <p className="text-2xl font-bold text-gray-900">₹{analytics?.todaySales?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BarChart3 className="text-blue-600 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.totalTransactions || 0}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <BarChart3 className="text-purple-600 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{analytics?.avgTransaction?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <BarChart3 className="text-orange-600 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "transactions":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Analysis</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions?.map((transaction: any) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                          #TXN{transaction.id.toString().padStart(6, "0")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {transaction.student?.name || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-500">{transaction.student?.rollNumber || "N/A"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ₹{Number.parseFloat(transaction.totalAmount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {JSON.parse(transaction.items).length} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={transaction.status === "completed" ? "default" : "destructive"}
                            className={transaction.status === "completed" ? "bg-green-500" : ""}
                          >
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      case "students":
        return <StudentManagement />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-500 text-white w-10 h-10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Accountant Dashboard</h1>
              <p className="text-sm text-gray-600">Financial Analysis & Reports</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-4 px-6 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-2 px-4 text-sm font-medium focus:outline-none border-b-2 ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-4 h-4 mr-2 inline-block" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Filters */}
        {activeTab === "transactions" && (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Search Transactions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Student name or transaction ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content based on active tab */}
        {renderTabContent(activeTab)}
      </div>
    </div>
  )
}





// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { BarChart3, LogOut, Search, Download, Filter } from "lucide-react"
// import { useAuthStore } from "@/lib/store/auth-store"
// import { useQuery } from "@tanstack/react-query"

// export default function AccountantDashboard() {
//   const router = useRouter()
//   const { logout } = useAuthStore()
//   const [searchTerm, setSearchTerm] = useState("")
//   const [dateRange, setDateRange] = useState("today")
//   const [statusFilter, setStatusFilter] = useState("all")

//   const { data: transactions, isLoading } = useQuery({
//     queryKey: ["transactions", searchTerm, dateRange, statusFilter],
//     queryFn: async () => {
//       const params = new URLSearchParams()
//       if (searchTerm) params.append("search", searchTerm)
//       if (dateRange !== "all") params.append("dateRange", dateRange)
//       if (statusFilter !== "all") params.append("status", statusFilter)

//       const response = await fetch(`/api/transactions?${params}`)
//       if (!response.ok) throw new Error("Failed to fetch transactions")
//       return response.json()
//     },
//   })

//   const { data: analytics } = useQuery({
//     queryKey: ["analytics"],
//     queryFn: async () => {
//       const response = await fetch("/api/analytics")
//       if (!response.ok) throw new Error("Failed to fetch analytics")
//       return response.json()
//     },
//   })

//   const handleLogout = () => {
//     logout()
//     router.push("/login")
//   }

//   const handleExport = () => {
//     // Export functionality would be implemented here
//     console.log("Exporting data...")
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b border-gray-200">
//         <div className="px-6 py-4 flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <div className="bg-purple-500 text-white w-10 h-10 rounded-lg flex items-center justify-center">
//               <BarChart3 className="w-6 h-6" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-gray-900">Accountant Dashboard</h1>
//               <p className="text-sm text-gray-600">Financial Analysis & Reports</p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-4">
//             <Button onClick={handleExport} variant="outline">
//               <Download className="w-4 h-4 mr-2" />
//               Export Data
//             </Button>
//             <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
//               <LogOut className="w-4 h-4 mr-2" />
//               Logout
//             </Button>
//           </div>
//         </div>
//       </header>

//       <div className="p-6 space-y-6">
//         {/* Analytics Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Total Revenue</p>
//                   <p className="text-2xl font-bold text-gray-900">₹{analytics?.totalRevenue?.toFixed(2) || "0.00"}</p>
//                 </div>
//                 <div className="bg-green-100 p-3 rounded-lg">
//                   <BarChart3 className="text-green-600 w-6 h-6" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Today's Sales</p>
//                   <p className="text-2xl font-bold text-gray-900">₹{analytics?.todaySales?.toFixed(2) || "0.00"}</p>
//                 </div>
//                 <div className="bg-blue-100 p-3 rounded-lg">
//                   <BarChart3 className="text-blue-600 w-6 h-6" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Total Transactions</p>
//                   <p className="text-2xl font-bold text-gray-900">{analytics?.totalTransactions || 0}</p>
//                 </div>
//                 <div className="bg-purple-100 p-3 rounded-lg">
//                   <BarChart3 className="text-purple-600 w-6 h-6" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
//                   <p className="text-2xl font-bold text-gray-900">₹{analytics?.avgTransaction?.toFixed(2) || "0.00"}</p>
//                 </div>
//                 <div className="bg-orange-100 p-3 rounded-lg">
//                   <BarChart3 className="text-orange-600 w-6 h-6" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Filters */}
//         <Card>
//           <CardContent className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               <div>
//                 <Label>Search Transactions</Label>
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                   <Input
//                     placeholder="Student name or transaction ID..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-10"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label>Date Range</Label>
//                 <Select value={dateRange} onValueChange={setDateRange}>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="today">Today</SelectItem>
//                     <SelectItem value="week">This Week</SelectItem>
//                     <SelectItem value="month">This Month</SelectItem>
//                     <SelectItem value="all">All Time</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div>
//                 <Label>Status</Label>
//                 <Select value={statusFilter} onValueChange={setStatusFilter}>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Status</SelectItem>
//                     <SelectItem value="completed">Completed</SelectItem>
//                     <SelectItem value="failed">Failed</SelectItem>
//                     <SelectItem value="refunded">Refunded</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="flex items-end">
//                 <Button className="w-full">
//                   <Filter className="w-4 h-4 mr-2" />
//                   Apply Filters
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Transactions Table */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Transaction Analysis</CardTitle>
//           </CardHeader>
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {transactions?.map((transaction: any) => (
//                     <tr key={transaction.id}>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
//                         #TXN{transaction.id.toString().padStart(6, "0")}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div>
//                           <p className="text-sm font-medium text-gray-900">{transaction.student?.name || "Unknown"}</p>
//                           <p className="text-sm text-gray-500">{transaction.student?.rollNumber || "N/A"}</p>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
//                         ₹{Number.parseFloat(transaction.totalAmount).toFixed(2)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {JSON.parse(transaction.items).length} items
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge
//                           variant={transaction.status === "completed" ? "default" : "destructive"}
//                           className={transaction.status === "completed" ? "bg-green-500" : ""}
//                         >
//                           {transaction.status}
//                         </Badge>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {new Date(transaction.createdAt).toLocaleDateString()}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }
