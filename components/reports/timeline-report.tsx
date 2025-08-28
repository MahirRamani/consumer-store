"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, DollarSign, ShoppingCart, Users, Calendar } from "lucide-react"
import { toast } from "sonner"
import type { Transaction } from "@/lib/types"

interface TimelineReportStudent {
  student: {
    id: string
    name: string
    rollNumber: string
    balance: number
  }
  transactions: Transaction[]
  totalAmount: number
  totalTransactions: number
}

interface TimelineReportData {
  students: TimelineReportStudent[]
  summary: {
    totalStudents: number
    totalTransactions: number
    totalAmount: number
  }
}

export function TimelineReport() {
  const [dateRange, setDateRange] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { data: reportData, isLoading } = useQuery<TimelineReportData>({
    queryKey: ["timeline-report", dateRange, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("dateRange", dateRange)
      if (dateRange === "custom" && startDate && endDate) {
        params.append("startDate", startDate)
        params.append("endDate", endDate)
      }

      const response = await fetch(`/api/reports/students-timeline?${params}`)
      if (!response.ok) throw new Error("Failed to fetch timeline report")
      return response.json()
    },
  })

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      params.append("dateRange", dateRange)
      if (dateRange === "custom" && startDate && endDate) {
        params.append("startDate", startDate)
        params.append("endDate", endDate)
      }

      const response = await fetch(`/api/reports/students-timeline/export?${params}`)
      if (!response.ok) throw new Error("Failed to export")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `timeline-report-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Timeline report exported successfully!")
    } catch (error) {
      toast.error("Failed to export timeline report")
    }
  }

  const students = reportData?.students || []
  const summary = reportData?.summary || { totalStudents: 0, totalTransactions: 0, totalAmount: 0 }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Timeline Report</h2>
        <Button onClick={handleExport} variant="outline" disabled={isLoading || !students.length}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Student Transaction Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">Loading timeline report...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No transactions found for the selected date range.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((studentData: TimelineReportStudent) => {
                    const lastTransaction = studentData.transactions[0] // Assuming sorted by date desc
                    return (
                      <tr key={studentData.student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                              👤
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{studentData.student.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-blue-600">
                            {studentData.student.rollNumber}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${
                              studentData.student.balance < 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            ₹{studentData.student.balance.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Badge variant="secondary">{studentData.totalTransactions}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          ₹{studentData.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lastTransaction ? (
                            <div>
                              <div className="font-medium">
                                {new Date(lastTransaction.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs">{new Date(lastTransaction.createdAt).toLocaleTimeString()}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No transactions</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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
// import { Download, TrendingUp, Users, DollarSign } from "lucide-react"
// import { toast } from "sonner"
// import type { TimelineReportData } from "@/lib/types"

// export default function TimelineReport() {
//   const [dateRange, setDateRange] = useState("all")
//   const [startDate, setStartDate] = useState("")
//   const [endDate, setEndDate] = useState("")

//   const { data: reportData, isLoading } = useQuery({
//     queryKey: ["timeline-report", dateRange, startDate, endDate],
//     queryFn: async () => {
//       const params = new URLSearchParams({ dateRange })
//       if (dateRange === "custom" && startDate && endDate) {
//         params.append("startDate", startDate)
//         params.append("endDate", endDate)
//       }

//       const response = await fetch(`/api/reports/students-timeline?${params}`)
//       if (!response.ok) throw new Error("Failed to fetch timeline report")
//       return response.json()
//     },
//   })

//   const handleExport = async () => {
//     try {
//       const params = new URLSearchParams({ dateRange })
//       if (dateRange === "custom" && startDate && endDate) {
//         params.append("startDate", startDate)
//         params.append("endDate", endDate)
//       }

//       const response = await fetch(`/api/reports/students-timeline/export?${params}`)
//       if (!response.ok) throw new Error("Failed to export")

//       const blob = await response.blob()
//       const url = window.URL.createObjectURL(blob)
//       const a = document.createElement("a")
//       a.href = url
//       a.download = `timeline-report-${new Date().toISOString().split("T")[0]}.csv`
//       document.body.appendChild(a)
//       a.click()
//       window.URL.revokeObjectURL(url)
//       document.body.removeChild(a)

//       toast.success("Timeline report exported successfully!")
//     } catch (error) {
//       toast.error("Failed to export timeline report")
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
//     })
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Students Timeline Report</h2>
//           <p className="text-sm text-gray-600">Overview of all student spending patterns</p>
//         </div>
//         <Button onClick={handleExport} variant="outline" disabled={isLoading}>
//           <Download className="w-4 h-4 mr-2" />
//           Export Report
//         </Button>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
//         </CardContent>
//       </Card>

//       {/* Summary Cards */}
//       {reportData?.summary && (
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Total Students</p>
//                   <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalStudents}</p>
//                 </div>
//                 <div className="bg-blue-100 p-3 rounded-lg">
//                   <Users className="text-blue-600 w-6 h-6" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Total Spent</p>
//                   <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.totalSpent)}</p>
//                 </div>
//                 <div className="bg-green-100 p-3 rounded-lg">
//                   <DollarSign className="text-green-600 w-6 h-6" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Total Transactions</p>
//                   <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalTransactions}</p>
//                 </div>
//                 <div className="bg-purple-100 p-3 rounded-lg">
//                   <TrendingUp className="text-purple-600 w-6 h-6" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}

//       {/* Students Timeline Table */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">
//             Student Spending Timeline ({reportData?.students?.length || 0} students)
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           {isLoading ? (
//             <div className="text-center py-8">Loading timeline report...</div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Student Details
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Standard
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Total Spent
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Transactions
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Last Transaction
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {reportData?.students?.map((student: TimelineReportData, index: number) => (
//                     <tr key={`${student.rollNumber}-${index}`} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div>
//                           <p className="text-sm font-medium text-gray-900">{student.name}</p>
//                           <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge variant="outline">{student.standard}</Badge>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className="text-sm font-medium text-green-600">{formatCurrency(student.totalSpent)}</span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className="text-sm text-gray-900">{student.transactionCount}</span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {student.lastTransaction ? formatDate(student.lastTransaction.toString()) : "No transactions"}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// // "use client"

// // import { useState, useEffect } from "react"
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Button } from "@/components/ui/button"
// // import { Input } from "@/components/ui/input"
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// // import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// // import { Download, Calendar, Users, TrendingUp } from "lucide-react"
// // import type { TimelineReportData } from "@/lib/types"

// // interface TimelineReportSummary {
// //   totalStudents: number
// //   totalSpent: number
// //   totalTransactions: number
// //   dateRange: string
// //   startDate?: string
// //   endDate?: string
// // }

// // export function TimelineReportComponent() {
// //   const [dateRange, setDateRange] = useState("all")
// //   const [startDate, setStartDate] = useState("")
// //   const [endDate, setEndDate] = useState("")
// //   const [reportData, setReportData] = useState<TimelineReportData[]>([])
// //   const [summary, setSummary] = useState<TimelineReportSummary | null>(null)
// //   const [loading, setLoading] = useState(false)

// //   useEffect(() => {
// //     fetchReport()
// //   }, [])

// //   const fetchReport = async () => {
// //     setLoading(true)
// //     try {
// //       const params = new URLSearchParams({
// //         dateRange,
// //         ...(dateRange === "custom" && startDate && endDate && { startDate, endDate }),
// //       })

// //       const response = await fetch(`/api/reports/students-timeline?${params}`)
// //       if (response.ok) {
// //         const data = await response.json()
// //         setReportData(data.students)
// //         setSummary(data.summary)
// //       }
// //     } catch (error) {
// //       console.error("Error fetching timeline report:", error)
// //       alert("Failed to fetch timeline report")
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   const handleExport = async () => {
// //     try {
// //       const params = new URLSearchParams({
// //         dateRange,
// //         ...(dateRange === "custom" && startDate && endDate && { startDate, endDate }),
// //       })

// //       const response = await fetch(`/api/reports/students-timeline/export?${params}`)
// //       if (response.ok) {
// //         const blob = await response.blob()
// //         const url = window.URL.createObjectURL(blob)
// //         const a = document.createElement("a")
// //         a.href = url
// //         a.download = `students-timeline-report-${dateRange}.csv`
// //         document.body.appendChild(a)
// //         a.click()
// //         window.URL.revokeObjectURL(url)
// //         document.body.removeChild(a)
// //       }
// //     } catch (error) {
// //       console.error("Error exporting timeline report:", error)
// //       alert("Failed to export timeline report")
// //     }
// //   }

// //   return (
// //     <div className="space-y-6">
// //       <Card>
// //         <CardHeader>
// //           <CardTitle className="flex items-center gap-2">
// //             <Users className="h-5 w-5" />
// //             All Students Timeline Report
// //           </CardTitle>
// //         </CardHeader>
// //         <CardContent className="space-y-4">
// //           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
// //             <Button onClick={fetchReport} disabled={loading}>
// //               <Calendar className="h-4 w-4 mr-2" />
// //               {loading ? "Loading..." : "Generate Report"}
// //             </Button>
// //             <Button onClick={handleExport} variant="outline" disabled={!reportData.length}>
// //               <Download className="h-4 w-4 mr-2" />
// //               Export CSV
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

// //       {summary && (
// //         <Card>
// //           <CardHeader>
// //             <CardTitle className="flex items-center gap-2">
// //               <TrendingUp className="h-5 w-5" />
// //               Summary Statistics
// //             </CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //               <div>
// //                 <p className="text-sm font-medium text-muted-foreground">Total Students</p>
// //                 <p className="text-2xl font-bold">{summary.totalStudents}</p>
// //               </div>
// //               <div>
// //                 <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
// //                 <p className="text-2xl font-bold text-green-600">₹{summary.totalSpent}</p>
// //               </div>
// //               <div>
// //                 <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
// //                 <p className="text-2xl font-bold">{summary.totalTransactions}</p>
// //               </div>
// //             </div>
// //           </CardContent>
// //         </Card>
// //       )}

// //       {reportData.length > 0 && (
// //         <Card>
// //           <CardHeader>
// //             <CardTitle className="flex items-center gap-2">
// //               <Calendar className="h-5 w-5" />
// //               Student Spending Report
// //             </CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="overflow-x-auto">
// //               <Table>
// //                 <TableHeader>
// //                   <TableRow>
// //                     <TableHead>Roll Number</TableHead>
// //                     <TableHead>Name</TableHead>
// //                     <TableHead>Standard</TableHead>
// //                     <TableHead>Total Spent</TableHead>
// //                     <TableHead>Transaction Count</TableHead>
// //                     <TableHead>Last Transaction</TableHead>
// //                   </TableRow>
// //                 </TableHeader>
// //                 <TableBody>
// //                   {reportData.map((student, index) => (
// //                     <TableRow key={index}>
// //                       <TableCell className="font-medium">{student.rollNumber}</TableCell>
// //                       <TableCell>{student.name}</TableCell>
// //                       <TableCell>{student.standard}</TableCell>
// //                       <TableCell className="font-medium text-green-600">₹{student.totalSpent}</TableCell>
// //                       <TableCell>{student.transactionCount}</TableCell>
// //                       <TableCell>
// //                         {student.lastTransaction ? new Date(student.lastTransaction).toLocaleDateString() : "N/A"}
// //                       </TableCell>
// //                     </TableRow>
// //                   ))}
// //                 </TableBody>
// //               </Table>
// //             </div>
// //           </CardContent>
// //         </Card>
// //       )}

// //       {!loading && reportData.length === 0 && summary && (
// //         <Card>
// //           <CardContent className="text-center py-8">
// //             <p className="text-muted-foreground">No transaction data found for the selected date range.</p>
// //           </CardContent>
// //         </Card>
// //       )}
// //     </div>
// //   )
// // }
