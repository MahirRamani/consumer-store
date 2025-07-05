"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Package, TrendingUp, TrendingDown, RotateCcw, AlertTriangle, Calendar } from "lucide-react"

export default function InventoryTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("today")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { data: inventoryLogs, isLoading } = useQuery({
    queryKey: ["inventory-logs", searchTerm, actionFilter, dateRange, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (actionFilter !== "all") params.append("action", actionFilter)
      if (dateRange !== "all") params.append("dateRange", dateRange)
      if (dateRange === "custom" && startDate) params.append("startDate", startDate)
      if (dateRange === "custom" && endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/inventory/logs?${params}`)
      if (!response.ok) throw new Error("Failed to fetch inventory logs")
      return response.json()
    },
  })

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const response = await fetch("/api/products/low-stock")
      if (!response.ok) throw new Error("Failed to fetch low stock products")
      return response.json()
    },
  })

  const getActionIcon = (action: string) => {
    switch (action) {
      case "restock":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "sale":
        return <TrendingDown className="w-4 h-4 text-red-500" />
      case "adjustment":
        return <RotateCcw className="w-4 h-4 text-blue-500" />
      default:
        return <Package className="w-4 h-4 text-gray-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "restock":
        return "bg-green-500"
      case "sale":
        return "bg-red-500"
      case "adjustment":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading || lowStockLoading) {
    return <div className="text-center py-8">Loading inventory data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Low Stock Alert ({lowStockProducts.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.slice(0, 6).map((product: any) => (
                <div key={product.id} className="bg-white p-3 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{product.category.replace("-", " ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{product.stock} left</p>
                      <p className="text-xs text-gray-500">Min: {product.lowStockThreshold}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {lowStockProducts.length > 6 && (
              <p className="text-sm text-red-600 mt-3">
                And {lowStockProducts.length - 6} more items need restocking...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Search Product</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateRange === "custom" && (
              <div className="md:col-span-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">End Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryLogs?.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{log.product?.name || "Unknown Product"}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {log.product?.category?.replace("-", " ") || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <Badge variant="outline" className={`ml-2 text-white ${getActionColor(log.action)}`}>
                          {log.action}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${log.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {log.quantityChange > 0 ? "+" : ""}
                        {log.quantityChange}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">{log.previousStock}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium">{log.newStock}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.reason || "No reason provided"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p>{new Date(log.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inventoryLogs?.length === 0 && (
            <div className="text-center py-8 text-gray-500">No inventory activity found for the selected criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// "use client"

// import { useState } from "react"
// import { useQuery } from "@tanstack/react-query"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Search, Package, TrendingUp, TrendingDown, RotateCcw, AlertTriangle } from "lucide-react"

// export default function InventoryTab() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [actionFilter, setActionFilter] = useState<string>("all")
//   const [dateRange, setDateRange] = useState<string>("today")

//   const { data: inventoryLogs, isLoading } = useQuery({
//     queryKey: ["inventory-logs", searchTerm, actionFilter, dateRange],
//     queryFn: async () => {
//       const params = new URLSearchParams()
//       if (searchTerm) params.append("search", searchTerm)
//       if (actionFilter !== "all") params.append("action", actionFilter)
//       if (dateRange !== "all") params.append("dateRange", dateRange)

//       const response = await fetch(`/api/inventory/logs?${params}`)
//       if (!response.ok) throw new Error("Failed to fetch inventory logs")
//       return response.json()
//     },
//   })

//   const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
//     queryKey: ["low-stock-products"],
//     queryFn: async () => {
//       const response = await fetch("/api/products/low-stock")
//       if (!response.ok) throw new Error("Failed to fetch low stock products")
//       return response.json()
//     },
//   })

//   const getActionIcon = (action: string) => {
//     switch (action) {
//       case "restock":
//         return <TrendingUp className="w-4 h-4 text-green-500" />
//       case "sale":
//         return <TrendingDown className="w-4 h-4 text-red-500" />
//       case "adjustment":
//         return <RotateCcw className="w-4 h-4 text-blue-500" />
//       default:
//         return <Package className="w-4 h-4 text-gray-500" />
//     }
//   }

//   const getActionColor = (action: string) => {
//     switch (action) {
//       case "restock":
//         return "bg-green-500"
//       case "sale":
//         return "bg-red-500"
//       case "adjustment":
//         return "bg-blue-500"
//       default:
//         return "bg-gray-500"
//     }
//   }

//   if (isLoading || lowStockLoading) {
//     return <div className="text-center py-8">Loading inventory data...</div>
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
//       </div>

//       {/* Low Stock Alert */}
//       {lowStockProducts && lowStockProducts.length > 0 && (
//         <Card className="border-red-200 bg-red-50">
//           <CardHeader>
//             <CardTitle className="text-lg font-semibold text-red-800 flex items-center">
//               <AlertTriangle className="w-5 h-5 mr-2" />
//               Low Stock Alert ({lowStockProducts.length} items)
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {lowStockProducts.slice(0, 6).map((product: any) => (
//                 <div key={product.id} className="bg-white p-3 rounded-lg border border-red-200">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="font-medium text-gray-900">{product.name}</p>
//                       <p className="text-sm text-gray-600 capitalize">{product.category.replace("-", " ")}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="font-bold text-red-600">{product.stock} left</p>
//                       <p className="text-xs text-gray-500">Min: {product.lowStockThreshold}</p>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//             {lowStockProducts.length > 6 && (
//               <p className="text-sm text-red-600 mt-3">
//                 And {lowStockProducts.length - 6} more items need restocking...
//               </p>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       {/* Filters */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Search Product</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Product name..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Action Type</Label>
//               <Select value={actionFilter} onValueChange={setActionFilter}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Actions" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Actions</SelectItem>
//                   <SelectItem value="restock">Restock</SelectItem>
//                   <SelectItem value="sale">Sale</SelectItem>
//                   <SelectItem value="adjustment">Adjustment</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Date Range</Label>
//               <Select value={dateRange} onValueChange={setDateRange}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select range" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="today">Today</SelectItem>
//                   <SelectItem value="week">This Week</SelectItem>
//                   <SelectItem value="month">This Month</SelectItem>
//                   <SelectItem value="all">All Time</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Inventory Logs */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">Activity Log</CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Product
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Action
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Change
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Stock Level
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Reason
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {inventoryLogs?.map((log: any) => (
//                   <tr key={log.id}>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center">
//                           <Package className="w-4 h-4 text-gray-600" />
//                         </div>
//                         <div className="ml-3">
//                           <p className="text-sm font-medium text-gray-900">{log.product?.name || "Unknown Product"}</p>
//                           <p className="text-sm text-gray-500 capitalize">
//                             {log.product?.category?.replace("-", " ") || "N/A"}
//                           </p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         {getActionIcon(log.action)}
//                         <Badge variant="outline" className={`ml-2 text-white ${getActionColor(log.action)}`}>
//                           {log.action}
//                         </Badge>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span
//                         className={`text-sm font-medium ${log.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}
//                       >
//                         {log.quantityChange > 0 ? "+" : ""}
//                         {log.quantityChange}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       <div className="flex items-center space-x-2">
//                         <span className="text-gray-500">{log.previousStock}</span>
//                         <span className="text-gray-400">→</span>
//                         <span className="font-medium">{log.newStock}</span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       {log.reason || "No reason provided"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       <div>
//                         <p>{new Date(log.createdAt).toLocaleDateString()}</p>
//                         <p className="text-xs">{new Date(log.createdAt).toLocaleTimeString()}</p>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           {inventoryLogs?.length === 0 && (
//             <div className="text-center py-8 text-gray-500">No inventory activity found for the selected criteria.</div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// // "use client"

// // import { useState } from "react"
// // import { useQuery } from "@tanstack/react-query"
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Input } from "@/components/ui/input"
// // import { Label } from "@/components/ui/label"
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// // import { Badge } from "@/components/ui/badge"
// // import { Search, Package, TrendingUp, TrendingDown, RotateCcw } from "lucide-react"

// // export default function InventoryTab() {
// //   const [searchTerm, setSearchTerm] = useState("")
// //   const [actionFilter, setActionFilter] = useState<string>("all")
// //   const [dateRange, setDateRange] = useState<string>("today")

// //   const { data: inventoryLogs, isLoading } = useQuery({
// //     queryKey: ["inventory-logs", searchTerm, actionFilter, dateRange],
// //     queryFn: async () => {
// //       const params = new URLSearchParams()
// //       if (searchTerm) params.append("search", searchTerm)
// //       if (actionFilter !== "all") params.append("action", actionFilter)
// //       if (dateRange !== "all") params.append("dateRange", dateRange)

// //       const response = await fetch(`/api/inventory/logs?${params}`)
// //       if (!response.ok) throw new Error("Failed to fetch inventory logs")
// //       return response.json()
// //     },
// //   })

// //   const getActionIcon = (action: string) => {
// //     switch (action) {
// //       case "restock":
// //         return <TrendingUp className="w-4 h-4 text-green-500" />
// //       case "sale":
// //         return <TrendingDown className="w-4 h-4 text-red-500" />
// //       case "adjustment":
// //         return <RotateCcw className="w-4 h-4 text-blue-500" />
// //       default:
// //         return <Package className="w-4 h-4 text-gray-500" />
// //     }
// //   }

// //   const getActionColor = (action: string) => {
// //     switch (action) {
// //       case "restock":
// //         return "bg-green-500"
// //       case "sale":
// //         return "bg-red-500"
// //       case "adjustment":
// //         return "bg-blue-500"
// //       default:
// //         return "bg-gray-500"
// //     }
// //   }

// //   if (isLoading) {
// //     return <div className="text-center py-8">Loading inventory logs...</div>
// //   }

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex justify-between items-center">
// //         <h2 className="text-2xl font-bold text-gray-900">Inventory Activity</h2>
// //       </div>

// //       {/* Filters */}
// //       <Card>
// //         <CardContent className="p-6">
// //           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //             <div>
// //               <Label className="block text-sm font-medium text-gray-700 mb-2">Search Product</Label>
// //               <div className="relative">
// //                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
// //                 <Input
// //                   placeholder="Product name..."
// //                   value={searchTerm}
// //                   onChange={(e) => setSearchTerm(e.target.value)}
// //                   className="pl-10"
// //                 />
// //               </div>
// //             </div>
// //             <div>
// //               <Label className="block text-sm font-medium text-gray-700 mb-2">Action Type</Label>
// //               <Select value={actionFilter} onValueChange={setActionFilter}>
// //                 <SelectTrigger>
// //                   <SelectValue placeholder="All Actions" />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="all">All Actions</SelectItem>
// //                   <SelectItem value="restock">Restock</SelectItem>
// //                   <SelectItem value="sale">Sale</SelectItem>
// //                   <SelectItem value="adjustment">Adjustment</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>
// //             <div>
// //               <Label className="block text-sm font-medium text-gray-700 mb-2">Date Range</Label>
// //               <Select value={dateRange} onValueChange={setDateRange}>
// //                 <SelectTrigger>
// //                   <SelectValue placeholder="Select range" />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="today">Today</SelectItem>
// //                   <SelectItem value="week">This Week</SelectItem>
// //                   <SelectItem value="month">This Month</SelectItem>
// //                   <SelectItem value="all">All Time</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Inventory Logs */}
// //       <Card>
// //         <CardHeader>
// //           <CardTitle className="text-lg font-semibold text-gray-900">Activity Log</CardTitle>
// //         </CardHeader>
// //         <CardContent className="p-0">
// //           <div className="overflow-x-auto">
// //             <table className="w-full">
// //               <thead className="bg-gray-50">
// //                 <tr>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Product
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Action
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Change
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Stock Level
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Reason
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Date
// //                   </th>
// //                 </tr>
// //               </thead>
// //               <tbody className="bg-white divide-y divide-gray-200">
// //                 {inventoryLogs?.map((log: any) => (
// //                   <tr key={log.id}>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <div className="flex items-center">
// //                         <div className="bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center">
// //                           <Package className="w-4 h-4 text-gray-600" />
// //                         </div>
// //                         <div className="ml-3">
// //                           <p className="text-sm font-medium text-gray-900">{log.product?.name || "Unknown Product"}</p>
// //                           <p className="text-sm text-gray-500 capitalize">
// //                             {log.product?.category?.replace("-", " ") || "N/A"}
// //                           </p>
// //                         </div>
// //                       </div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <div className="flex items-center">
// //                         {getActionIcon(log.action)}
// //                         <Badge variant="outline" className={`ml-2 text-white ${getActionColor(log.action)}`}>
// //                           {log.action}
// //                         </Badge>
// //                       </div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <span
// //                         className={`text-sm font-medium ${log.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}
// //                       >
// //                         {log.quantityChange > 0 ? "+" : ""}
// //                         {log.quantityChange}
// //                       </span>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
// //                       <div className="flex items-center space-x-2">
// //                         <span className="text-gray-500">{log.previousStock}</span>
// //                         <span className="text-gray-400">→</span>
// //                         <span className="font-medium">{log.newStock}</span>
// //                       </div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                       {log.reason || "No reason provided"}
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                       <div>
// //                         <p>{new Date(log.createdAt).toLocaleDateString()}</p>
// //                         <p className="text-xs">{new Date(log.createdAt).toLocaleTimeString()}</p>
// //                       </div>
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //           {inventoryLogs?.length === 0 && (
// //             <div className="text-center py-8 text-gray-500">No inventory activity found for the selected criteria.</div>
// //           )}
// //         </CardContent>
// //       </Card>
// //     </div>
// //   )
// // }
