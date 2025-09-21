"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Download, DollarSign, ShoppingCart, User } from "lucide-react"
import { toast } from "sonner"
import type { Transaction } from "@/lib/types"

export function StudentTransactionReport() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["student-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { transactions: [], student: null }

      const params = new URLSearchParams()
      params.append("dateRange", dateRange)
      if (dateRange === "custom" && startDate && endDate) {
        params.append("startDate", startDate)
        params.append("endDate", endDate)
      }

      const response = await fetch(`/api/students/search/${encodeURIComponent(searchQuery)}/transactions?${params}`)
      if (!response.ok) throw new Error("Failed to fetch student transactions")
      return response.json()
    },
    enabled: !!searchQuery.trim(),
  })

  const handleExport = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please search for a student first")
      return
    }

    try {
      const params = new URLSearchParams()
      params.append("dateRange", dateRange)
      if (dateRange === "custom" && startDate && endDate) {
        params.append("startDate", startDate)
        params.append("endDate", endDate)
      }

      const response = await fetch(
        `/api/students/search/${encodeURIComponent(searchQuery)}/transactions/export?${params}`,
      )
      if (!response.ok) throw new Error("Failed to export")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `student-transactions-${searchQuery}-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Student transactions exported successfully!")
    } catch (error) {
      toast.error("Failed to export student transactions")
    }
  }

  const transactions = searchResults?.transactions || []
  const student = searchResults?.student

  const totalSpent = transactions.reduce((sum: number, transaction: Transaction) => sum + transaction.totalAmount, 0)
  const totalTransactions = transactions.length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Student Transaction Report</h2>
        <Button
          onClick={handleExport}
          variant="outline"
          disabled={!searchQuery.trim() || searchLoading || !transactions.length}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Roll number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Info and Summary */}
      {student && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{student.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-blue-600">
                    Roll: {student.rollNumber}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ShoppingCart className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {searchLoading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : !searchQuery.trim() ? (
            <div className="text-center py-8 text-gray-500">
              Enter a student's roll number or name to view their transaction history.
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found for this student in the selected date range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction: Transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{new Date(transaction.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            }) || "🤔?"}</div>
                          <div className="text-gray-500">{new Date(transaction.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {transaction.items.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span>
                                {item.product?.name || item.subProduct?.name}
                                {item.subProduct && ` (${item.subProduct.size})`}
                              </span>
                              <span className="text-gray-500">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        ₹{transaction.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={transaction.paymentMethod === "balance" ? "default" : "outline"}
                          className={transaction.paymentMethod === "balance" ? "bg-blue-500" : ""}
                        >
                          {transaction.paymentMethod === "balance" ? "Balance" : "Cash"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={transaction.status === "completed" ? "default" : "secondary"}
                          className={transaction.status === "completed" ? "bg-green-500" : ""}
                        >
                          {transaction.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




// "use client"

// import { useState } from "react"
// import { useQuery } from "@tanstack/react-query"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Search, Download, User, DollarSign, ShoppingCart } from "lucide-react"
// import { toast } from "sonner"
// import type { StudentTransactionReport as StudentTransactionReportType } from "@/lib/types"

// export default function StudentTransactionReport() {
//   const [searchQuery, setSearchQuery] = useState("")
//   const [dateRange, setDateRange] = useState("all")
//   const [startDate, setStartDate] = useState("")
//   const [endDate, setEndDate] = useState("")
//   const [selectedStudent, setSelectedStudent] = useState<StudentTransactionReportType | null>(null)

//   const { data: reportData, isLoading } = useQuery({
//     queryKey: ["student-transaction-report", searchQuery, dateRange, startDate, endDate],
//     queryFn: async () => {
//       if (!searchQuery.trim()) return null

//       const params = new URLSearchParams({ dateRange })
//       if (dateRange === "custom" && startDate && endDate) {
//         params.append("startDate", startDate)
//         params.append("endDate", endDate)
//       }

//       const response = await fetch(`/api/students/search/${encodeURIComponent(searchQuery)}/transactions?${params}`)
//       if (!response.ok) {
//         if (response.status === 404) {
//           throw new Error("Student not found")
//         }
//         throw new Error("Failed to fetch student report")
//       }
//       return response.json()
//     },
//     enabled: !!searchQuery.trim(),
//   })

//   const handleSearch = () => {
//     if (!searchQuery.trim()) {
//       toast.error("Please enter a student name or roll number")
//       return
//     }
//     setSelectedStudent(reportData)
//   }

//   const handleExport = async () => {
//     if (!searchQuery.trim()) {
//       toast.error("Please search for a student first")
//       return
//     }

//     try {
//       const params = new URLSearchParams({ dateRange })
//       if (dateRange === "custom" && startDate && endDate) {
//         params.append("startDate", startDate)
//         params.append("endDate", endDate)
//       }

//       const response = await fetch(
//         `/api/students/search/${encodeURIComponent(searchQuery)}/transactions/export?${params}`,
//       )
//       if (!response.ok) throw new Error("Failed to export")

//       const blob = await response.blob()
//       const url = window.URL.createObjectURL(blob)
//       const a = document.createElement("a")
//       a.href = url
//       a.download = `student-report-${searchQuery}-${new Date().toISOString().split("T")[0]}.csv`
//       document.body.appendChild(a)
//       a.click()
//       window.URL.revokeObjectURL(url)
//       document.body.removeChild(a)

//       toast.success("Student report exported successfully!")
//     } catch (error) {
//       toast.error("Failed to export student report")
//     }
//   }

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//     }).format(amount)
//   }

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString("en-IN", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     })
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Student Transaction Report</h2>
//           <p className="text-sm text-gray-600">Search by roll number or name to view detailed transaction history</p>
//         </div>
//         <Button onClick={handleExport} variant="outline" disabled={!reportData}>
//           <Download className="w-4 h-4 mr-2" />
//           Export Report
//         </Button>
//       </div>

//       {/* Search and Filters */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Student Search</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Roll number or name..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10"
//                   onKeyPress={(e) => e.key === "Enter" && handleSearch()}
//                 />
//               </div>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Date Range</Label>
//               <Select value={dateRange} onValueChange={setDateRange}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select date range" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Time</SelectItem>
//                   <SelectItem value="today">Today</SelectItem>
//                   <SelectItem value="lastMonth">Last Month</SelectItem>
//                   <SelectItem value="custom">Custom Range</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             {dateRange === "custom" && (
//               <>
//                 <div>
//                   <Label className="block text-sm font-medium text-gray-700 mb-2">Start Date</Label>
//                   <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
//                 </div>
//                 <div>
//                   <Label className="block text-sm font-medium text-gray-700 mb-2">End Date</Label>
//                   <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
//                 </div>
//               </>
//             )}
//           </div>
//           <div className="mt-4">
//             <Button onClick={handleSearch} disabled={!searchQuery.trim() || isLoading}>
//               <Search className="w-4 h-4 mr-2" />
//               {isLoading ? "Searching..." : "Search Student"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Student Summary */}
//       {reportData && (
//         <>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <Card>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Student Info</p>
//                     <p className="text-lg font-bold text-gray-900">{reportData.student.name}</p>
//                     <p className="text-sm text-gray-500">Roll: {reportData.student.rollNumber}</p>
//                     <p className="text-sm text-gray-500">Standard: {reportData.student.standard}</p>
//                   </div>
//                   <div className="bg-blue-100 p-3 rounded-lg">
//                     <User className="text-blue-600 w-6 h-6" />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Total Spent</p>
//                     <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalSpent)}</p>
//                     <p className="text-sm text-gray-500">
//                       Current Balance: {formatCurrency(reportData.student.balance)}
//                     </p>
//                   </div>
//                   <div className="bg-green-100 p-3 rounded-lg">
//                     <DollarSign className="text-green-600 w-6 h-6" />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-600">Total Transactions</p>
//                     <p className="text-2xl font-bold text-gray-900">{reportData.transactionCount}</p>
//                     <p className="text-sm text-gray-500">
//                       Avg:{" "}
//                       {reportData.transactionCount > 0
//                         ? formatCurrency(reportData.totalSpent / reportData.transactionCount)
//                         : "₹0.00"}
//                     </p>
//                   </div>
//                   <div className="bg-purple-100 p-3 rounded-lg">
//                     <ShoppingCart className="text-purple-600 w-6 h-6" />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Transaction History */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg font-semibold text-gray-900">
//                 Transaction History ({reportData.transactions.length} transactions)
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="p-0">
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Transaction ID
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Amount
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Items
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Type
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Status
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Date
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {reportData.transactions.map((transaction) => (
//                       <tr key={transaction.id} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
//                           #TXN{transaction.id.toString().padStart(6, "0")}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className="text-sm font-medium text-green-600">
//                             {formatCurrency(transaction.totalAmount)}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           {transaction.items.length} items
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <Badge
//                             className={
//                               transaction.transactionType === "purchase"
//                                 ? "bg-blue-500 hover:bg-blue-600"
//                                 : transaction.transactionType === "topup"
//                                   ? "bg-green-500 hover:bg-green-600"
//                                   : "bg-red-500 hover:bg-red-600"
//                             }
//                           >
//                             {transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1)}
//                           </Badge>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <Badge
//                             variant={transaction.status === "completed" ? "default" : "destructive"}
//                             className={transaction.status === "completed" ? "bg-green-500" : ""}
//                           >
//                             {transaction.status}
//                           </Badge>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {formatDate(transaction.createdAt.toString())}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         </>
//       )}

//       {/* Empty State */}
//       {!reportData && !isLoading && searchQuery && (
//         <Card>
//           <CardContent className="p-12 text-center">
//             <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No student found</h3>
//             <p className="text-gray-500">
//               No student found with roll number or name "{searchQuery}". Please check the spelling and try again.
//             </p>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   )
// }



// // "use client"

// // import { useState } from "react"
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Button } from "@/components/ui/button"
// // import { Input } from "@/components/ui/input"
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// // import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// // import { Badge } from "@/components/ui/badge"
// // import { Search, Download, Calendar, User, CreditCard } from "lucide-react"
// // import type { StudentTransactionReport } from "@/lib/types"

// // export function StudentTransactionReportComponent() {
// //   const [searchQuery, setSearchQuery] = useState("")
// //   const [dateRange, setDateRange] = useState("all")
// //   const [startDate, setStartDate] = useState("")
// //   const [endDate, setEndDate] = useState("")
// //   const [reportData, setReportData] = useState<StudentTransactionReport | null>(null)
// //   const [loading, setLoading] = useState(false)

// //   const handleSearch = async () => {
// //     if (!searchQuery.trim()) return

// //     setLoading(true)
// //     try {
// //       const params = new URLSearchParams({
// //         dateRange,
// //         ...(dateRange === "custom" && startDate && endDate && { startDate, endDate }),
// //       })

// //       const response = await fetch(`/api/students/search/${encodeURIComponent(searchQuery)}/transactions?${params}`)
// //       if (response.ok) {
// //         const data = await response.json()
// //         setReportData(data)
// //       } else {
// //         const error = await response.json()
// //         alert(error.message || "Student not found")
// //         setReportData(null)
// //       }
// //     } catch (error) {
// //       console.error("Error fetching student transactions:", error)
// //       alert("Failed to fetch student transactions")
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   const handleExport = async () => {
// //     if (!reportData) return

// //     try {
// //       const params = new URLSearchParams({
// //         dateRange,
// //         ...(dateRange === "custom" && startDate && endDate && { startDate, endDate }),
// //       })

// //       const response = await fetch(
// //         `/api/students/search/${encodeURIComponent(searchQuery)}/transactions/export?${params}`,
// //       )
// //       if (response.ok) {
// //         const blob = await response.blob()
// //         const url = window.URL.createObjectURL(blob)
// //         const a = document.createElement("a")
// //         a.href = url
// //         a.download = `${reportData.student.rollNumber}-transactions.csv`
// //         document.body.appendChild(a)
// //         a.click()
// //         window.URL.revokeObjectURL(url)
// //         document.body.removeChild(a)
// //       }
// //     } catch (error) {
// //       console.error("Error exporting transactions:", error)
// //       alert("Failed to export transactions")
// //     }
// //   }

// //   const getStatusBadge = (status: string) => {
// //     switch (status) {
// //       case "completed":
// //         return <Badge variant="default">Completed</Badge>
// //       case "pending":
// //         return <Badge variant="secondary">Pending</Badge>
// //       case "cancelled":
// //         return <Badge variant="destructive">Cancelled</Badge>
// //       default:
// //         return <Badge variant="outline">{status}</Badge>
// //     }
// //   }

// //   const getTypeBadge = (type: string) => {
// //     switch (type) {
// //       case "purchase":
// //         return <Badge variant="default">Purchase</Badge>
// //       case "topup":
// //         return <Badge variant="secondary">Top-up</Badge>
// //       case "deduction":
// //         return <Badge variant="destructive">Deduction</Badge>
// //       default:
// //         return <Badge variant="outline">{type}</Badge>
// //     }
// //   }

// //   return (
// //     <div className="space-y-6">
// //       <Card>
// //         <CardHeader>
// //           <CardTitle className="flex items-center gap-2">
// //             <User className="h-5 w-5" />
// //             Student Transaction Report
// //           </CardTitle>
// //         </CardHeader>
// //         <CardContent className="space-y-4">
// //           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
// //             <div className="md:col-span-2">
// //               <Input
// //                 placeholder="Search by roll number or name..."
// //                 value={searchQuery}
// //                 onChange={(e) => setSearchQuery(e.target.value)}
// //                 onKeyPress={(e) => e.key === "Enter" && handleSearch()}
// //               />
// //             </div>
// //             <Select value={dateRange} onValueChange={setDateRange}>
// //               <SelectTrigger>
// //                 <SelectValue placeholder="Select date range" />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 <SelectItem value="all">All Time</SelectItem>
// //                 <SelectItem value="today">Today</SelectItem>
// //                 <SelectItem value="lastMonth">Last Month</SelectItem>
// //                 <SelectItem value="custom">Custom Range</SelectItem>
// //               </SelectContent>
// //             </Select>
// //             <Button onClick={handleSearch} disabled={loading}>
// //               <Search className="h-4 w-4 mr-2" />
// //               {loading ? "Searching..." : "Search"}
// //             </Button>
// //           </div>

// //           {dateRange === "custom" && (
// //             <div className="grid grid-cols-2 gap-4">
// //               <div>
// //                 <label className="text-sm font-medium">Start Date</label>
// //                 <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
// //               </div>
// //               <div>
// //                 <label className="text-sm font-medium">End Date</label>
// //                 <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
// //               </div>
// //             </div>
// //           )}
// //         </CardContent>
// //       </Card>

// //       {reportData && (
// //         <>
// //           <Card>
// //             <CardHeader>
// //               <CardTitle className="flex items-center justify-between">
// //                 <div className="flex items-center gap-2">
// //                   <User className="h-5 w-5" />
// //                   Student Information
// //                 </div>
// //                 <Button onClick={handleExport} variant="outline">
// //                   <Download className="h-4 w-4 mr-2" />
// //                   Export CSV
// //                 </Button>
// //               </CardTitle>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
// //                 <div>
// //                   <p className="text-sm font-medium text-muted-foreground">Name</p>
// //                   <p className="text-lg font-semibold">{reportData.student.name}</p>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm font-medium text-muted-foreground">Roll Number</p>
// //                   <p className="text-lg font-semibold">{reportData.student.rollNumber}</p>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm font-medium text-muted-foreground">Standard</p>
// //                   <p className="text-lg font-semibold">{reportData.student.standard}</p>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
// //                   <p className="text-lg font-semibold text-green-600">₹{reportData.student.balance}</p>
// //                 </div>
// //               </div>
// //             </CardContent>
// //           </Card>

// //           <Card>
// //             <CardHeader>
// //               <CardTitle className="flex items-center gap-2">
// //                 <CreditCard className="h-5 w-5" />
// //                 Transaction Summary
// //               </CardTitle>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 <div>
// //                   <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
// //                   <p className="text-2xl font-bold text-red-600">₹{reportData.totalSpent}</p>
// //                 </div>
// //                 <div>
// //                   <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
// //                   <p className="text-2xl font-bold">{reportData.transactionCount}</p>
// //                 </div>
// //               </div>
// //             </CardContent>
// //           </Card>

// //           <Card>
// //             <CardHeader>
// //               <CardTitle className="flex items-center gap-2">
// //                 <Calendar className="h-5 w-5" />
// //                 Transaction History
// //               </CardTitle>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="overflow-x-auto">
// //                 <Table>
// //                   <TableHeader>
// //                     <TableRow>
// //                       <TableHead>Date</TableHead>
// //                       <TableHead>Type</TableHead>
// //                       <TableHead>Items</TableHead>
// //                       <TableHead>Amount</TableHead>
// //                       <TableHead>Status</TableHead>
// //                       <TableHead>Performed By</TableHead>
// //                     </TableRow>
// //                   </TableHeader>
// //                   <TableBody>
// //                     {reportData.transactions.map((transaction) => (
// //                       <TableRow key={transaction.id}>
// //                         <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
// //                         <TableCell>{getTypeBadge(transaction.transactionType)}</TableCell>
// //                         <TableCell>
// //                           {transaction.items.length > 0 ? (
// //                             <div className="space-y-1">
// //                               {transaction.items.map((item, index) => (
// //                                 <div key={index} className="text-sm">
// //                                   {item.name} ({item.quantity}x₹{item.price})
// //                                   {item.size && <span className="text-muted-foreground"> - {item.size}</span>}
// //                                 </div>
// //                               ))}
// //                             </div>
// //                           ) : (
// //                             <span className="text-muted-foreground">{transaction.reason || "N/A"}</span>
// //                           )}
// //                         </TableCell>
// //                         <TableCell className="font-medium">₹{transaction.totalAmount}</TableCell>
// //                         <TableCell>{getStatusBadge(transaction.status)}</TableCell>
// //                         <TableCell className="capitalize">{transaction.performedBy}</TableCell>
// //                       </TableRow>
// //                     ))}
// //                   </TableBody>
// //                 </Table>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         </>
// //       )}
// //     </div>
// //   )
// // }
