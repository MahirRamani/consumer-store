// Frontend Component with Pagination and Working Export (TransactionsTab.tsx)
"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  startIndex: number
  endIndex: number
}

interface TransactionsResponse {
  data: any[]
  pagination: PaginationInfo
}

export default function TransactionsTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("today")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isExporting, setIsExporting] = useState(false)

  const { data: response, isLoading } = useQuery<TransactionsResponse>({
    queryKey: ["transactions", searchTerm, statusFilter, dateRange, startDate, endDate, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (dateRange !== "all") params.append("dateRange", dateRange)
      if (dateRange === "custom" && startDate) params.append("startDate", startDate)
      if (dateRange === "custom" && endDate) params.append("endDate", endDate)
      params.append("page", currentPage.toString())
      params.append("limit", pageSize.toString())

      const response = await fetch(`/api/transactions?${params}`)
      if (!response.ok) throw new Error("Failed to fetch transactions")
      return response.json()
    },
  })

  const transactions = response?.data || []
  const pagination = response?.pagination

  // Reset to first page when filters change
  const handleFilterChange = (callback: () => void) => {
    callback()
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize))
    setCurrentPage(1)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const params = new URLSearchParams()
      params.append("format", "csv")
      if (dateRange !== "all") params.append("dateRange", dateRange)
      if (dateRange === "custom" && startDate) params.append("startDate", startDate)
      if (dateRange === "custom" && endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/transactions/export?${params}`)
      if (!response.ok) throw new Error("Failed to export transactions")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting transactions:", error)
      alert("Failed to export transactions. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const PaginationControls = () => {
    if (!pagination) return null

    const { currentPage, totalPages, totalCount, startIndex, endIndex, hasNextPage, hasPreviousPage } = pagination

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Showing {startIndex} to {endIndex} of {totalCount} results
          </span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">per page</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={!hasPreviousPage}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber
              if (totalPages <= 5) {
                pageNumber = i + 1
              } else if (currentPage <= 3) {
                pageNumber = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i
              } else {
                pageNumber = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  className="w-8 h-8"
                >
                  {pageNumber}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={!hasNextPage}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading transactions...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
        <Button 
          onClick={handleExport} 
          variant="outline" 
          disabled={isExporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exporting..." : "Export Data"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Student name or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange(() => setSearchTerm(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => handleFilterChange(() => setStatusFilter(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Date Range</Label>
              <Select value={dateRange} onValueChange={(value) => handleFilterChange(() => setDateRange(value))}>
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
              <div className="md:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleFilterChange(() => setStartDate(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleFilterChange(() => setEndDate(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Transactions
            {pagination && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({pagination.totalCount} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction: any) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      #TXN{transaction.id.toString().padStart(6, "0")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.student?.name || "Unknown"}</p>
                        <p className="text-sm text-gray-500">{transaction.student?.rollNumber || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₹{Number.parseFloat(transaction.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {JSON.parse(transaction.items || "[]").length} items
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
                      <div>
                        <p>{new Date(transaction.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs">{new Date(transaction.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">No transactions found for the selected criteria.</div>
          )}
          
          {/* Pagination Controls */}
          <PaginationControls />
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
// import { Button } from "@/components/ui/button"
// import { Search, Download, Eye, Calendar } from "lucide-react"

// export default function TransactionsTab() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [statusFilter, setStatusFilter] = useState<string>("all")
//   const [dateRange, setDateRange] = useState<string>("today")
//   const [startDate, setStartDate] = useState("")
//   const [endDate, setEndDate] = useState("")

//   const { data: transactions, isLoading } = useQuery({
//     queryKey: ["transactions", searchTerm, statusFilter, dateRange, startDate, endDate],
//     queryFn: async () => {
//       const params = new URLSearchParams()
//       if (searchTerm) params.append("search", searchTerm)
//       if (statusFilter !== "all") params.append("status", statusFilter)
//       if (dateRange !== "all") params.append("dateRange", dateRange)
//       if (dateRange === "custom" && startDate) params.append("startDate", startDate)
//       if (dateRange === "custom" && endDate) params.append("endDate", endDate)

//       const response = await fetch(`/api/transactions?${params}`)
//       if (!response.ok) throw new Error("Failed to fetch transactions")
//       return response.json()
//     },
//   })

//   const handleExport = () => {
//     // Export functionality would be implemented here
//     console.log("Exporting transactions...")
//   }


//   if (isLoading) {
//     return <div className="text-center py-8">Loading transactions...</div>
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
//         <Button onClick={handleExport} variant="outline">
//           <Download className="w-4 h-4 mr-2" />
//           Export Data
//         </Button>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Search</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Student name or transaction ID..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Status</Label>
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Status</SelectItem>
//                   <SelectItem value="completed">Completed</SelectItem>
//                   <SelectItem value="failed">Failed</SelectItem>
//                   <SelectItem value="refunded">Refunded</SelectItem>
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
//                   <SelectItem value="custom">Custom Range</SelectItem>
//                   <SelectItem value="all">All Time</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             {dateRange === "custom" && (
//               <div className="md:col-span-3">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label className="block text-sm font-medium text-gray-700 mb-2">Start Date</Label>
//                     <div className="relative">
//                       <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                       <Input
//                         type="date"
//                         value={startDate}
//                         onChange={(e) => setStartDate(e.target.value)}
//                         className="pl-10"
//                       />
//                     </div>
//                   </div>
//                   <div>
//                     <Label className="block text-sm font-medium text-gray-700 mb-2">End Date</Label>
//                     <div className="relative">
//                       <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                       <Input
//                         type="date"
//                         value={endDate}
//                         onChange={(e) => setEndDate(e.target.value)}
//                         className="pl-10"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Transactions Table */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Transaction ID
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Student
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Amount
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Items
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date
//                   </th>
//                   {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th> */}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {transactions?.map((transaction: any) => (
//                   <tr key={transaction.id}>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
//                       #TXN{transaction.id.toString().padStart(6, "0")}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div>
//                         <p className="text-sm font-medium text-gray-900">{transaction.student?.name || "Unknown"}</p>
//                         <p className="text-sm text-gray-500">{transaction.student?.rollNumber || "N/A"}</p>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
//                       ₹{Number.parseFloat(transaction.totalAmount).toFixed(2)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {JSON.parse(transaction.items || "[]").length} items
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <Badge
//                         variant={transaction.status === "completed" ? "default" : "destructive"}
//                         className={transaction.status === "completed" ? "bg-green-500" : ""}
//                       >
//                         {transaction.status}
//                       </Badge>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       <div>
//                         <p>{new Date(transaction.createdAt).toLocaleDateString()}</p>
//                         <p className="text-xs">{new Date(transaction.createdAt).toLocaleTimeString()}</p>
//                       </div>
//                     </td>
//                     {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleViewDetails(transaction.id)}
//                         className="text-blue-500 hover:text-blue-600"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </Button>
//                     </td> */}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           {transactions?.length === 0 && (
//             <div className="text-center py-8 text-gray-500">No transactions found for the selected criteria.</div>
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
// // import { Button } from "@/components/ui/button"
// // import { Search, Download, Eye } from "lucide-react"

// // export default function TransactionsTab() {
// //   const [searchTerm, setSearchTerm] = useState("")
// //   const [statusFilter, setStatusFilter] = useState<string>("all")
// //   const [dateRange, setDateRange] = useState<string>("today")

// //   const { data: transactions, isLoading } = useQuery({
// //     queryKey: ["transactions", searchTerm, statusFilter, dateRange],
// //     queryFn: async () => {
// //       const params = new URLSearchParams()
// //       if (searchTerm) params.append("search", searchTerm)
// //       if (statusFilter !== "all") params.append("status", statusFilter)
// //       if (dateRange !== "all") params.append("dateRange", dateRange)

// //       const response = await fetch(`/api/transactions?${params}`)
// //       if (!response.ok) throw new Error("Failed to fetch transactions")
// //       return response.json()
// //     },
// //   })

// //   const handleExport = () => {
// //     // Export functionality would be implemented here
// //     console.log("Exporting transactions...")
// //   }

// //   const handleViewDetails = (transactionId: string) => {
// //     // View transaction details functionality
// //     console.log("Viewing transaction:", transactionId)
// //   }

// //   if (isLoading) {
// //     return <div className="text-center py-8">Loading transactions...</div>
// //   }

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex justify-between items-center">
// //         <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
// //         <Button onClick={handleExport} variant="outline">
// //           <Download className="w-4 h-4 mr-2" />
// //           Export Data
// //         </Button>
// //       </div>

// //       {/* Filters */}
// //       <Card>
// //         <CardContent className="p-6">
// //           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //             <div>
// //               <Label className="block text-sm font-medium text-gray-700 mb-2">Search</Label>
// //               <div className="relative">
// //                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
// //                 <Input
// //                   placeholder="Student name or transaction ID..."
// //                   value={searchTerm}
// //                   onChange={(e) => setSearchTerm(e.target.value)}
// //                   className="pl-10"
// //                 />
// //               </div>
// //             </div>
// //             <div>
// //               <Label className="block text-sm font-medium text-gray-700 mb-2">Status</Label>
// //               <Select value={statusFilter} onValueChange={setStatusFilter}>
// //                 <SelectTrigger>
// //                   <SelectValue placeholder="All Status" />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="all">All Status</SelectItem>
// //                   <SelectItem value="completed">Completed</SelectItem>
// //                   <SelectItem value="failed">Failed</SelectItem>
// //                   <SelectItem value="refunded">Refunded</SelectItem>
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

// //       {/* Transactions Table */}
// //       <Card>
// //         <CardHeader>
// //           <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
// //         </CardHeader>
// //         <CardContent className="p-0">
// //           <div className="overflow-x-auto">
// //             <table className="w-full">
// //               <thead className="bg-gray-50">
// //                 <tr>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Transaction ID
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Student
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Amount
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Items
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Status
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Date
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Actions
// //                   </th>
// //                 </tr>
// //               </thead>
// //               <tbody className="bg-white divide-y divide-gray-200">
// //                 {transactions?.map((transaction: any) => (
// //                   <tr key={transaction.id}>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
// //                       #TXN{transaction.id.toString().padStart(6, "0")}
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <div>
// //                         <p className="text-sm font-medium text-gray-900">{transaction.student?.name || "Unknown"}</p>
// //                         <p className="text-sm text-gray-500">{transaction.student?.rollNumber || "N/A"}</p>
// //                       </div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
// //                       ₹{Number.parseFloat(transaction.totalAmount).toFixed(2)}
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
// //                       {JSON.parse(transaction.items || "[]").length} items
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <Badge
// //                         variant={transaction.status === "completed" ? "default" : "destructive"}
// //                         className={transaction.status === "completed" ? "bg-green-500" : ""}
// //                       >
// //                         {transaction.status}
// //                       </Badge>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                       <div>
// //                         <p>{new Date(transaction.createdAt).toLocaleDateString()}</p>
// //                         <p className="text-xs">{new Date(transaction.createdAt).toLocaleTimeString()}</p>
// //                       </div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                       <Button
// //                         variant="ghost"
// //                         size="sm"
// //                         onClick={() => handleViewDetails(transaction.id)}
// //                         className="text-blue-500 hover:text-blue-600"
// //                       >
// //                         <Eye className="w-4 h-4" />
// //                       </Button>
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //           {transactions?.length === 0 && (
// //             <div className="text-center py-8 text-gray-500">No transactions found for the selected criteria.</div>
// //           )}
// //         </CardContent>
// //       </Card>
// //     </div>
// //   )
// // }
