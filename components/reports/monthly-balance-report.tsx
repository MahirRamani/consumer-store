"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, DollarSign, TrendingUp, TrendingDown, Users, Calendar, FileText } from "lucide-react"
import { toast } from "sonner"

interface StudentBalanceReport {
  studentId: string
  rollNumber: string
  name: string
  standard: string
  medium: string
  lastMonthEndBalance: number
  currentMonthCredited: number
  currentMonthDebited: number
  currentMonthNet: number
  currentBalance: number
  transactionCount: number
  balanceChange: number
  balanceVerification: boolean
}

interface MonthlyBalanceReportData {
  students: StudentBalanceReport[]
  summary: {
    totalStudents: number
    totalLastMonthBalance: number
    totalCurrentMonthCredited: number
    totalCurrentMonthDebited: number
    totalCurrentBalance: number
    totalTransactions: number
    activeStudents: number
    dateRange: {
      lastMonth: { start: string; end: string }
      currentMonth: { start: string; end: string }
    }
  }
  reportGeneratedAt: string
  reportType: string
}

export default function MonthlyBalanceReport() {
  const [dateRange, setDateRange] = useState("current")
  const [customMonth, setCustomMonth] = useState("")

  const { data: reportData, isLoading, refetch, error } = useQuery<MonthlyBalanceReportData>({
    queryKey: ["monthly-balance-report", dateRange, customMonth],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("dateRange", dateRange)
      if (dateRange === "custom" && customMonth) {
        params.append("month", customMonth)
      }

      const response = await fetch(`/api/reports/monthly-balance?${params}`)
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to fetch monthly balance report: ${errorData}`)
      }
      const data = await response.json()
      console.log("API Response:", data) // Debug log
      return data
    },
    refetchOnWindowFocus: false,
  })

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      params.append("dateRange", dateRange)
      if (dateRange === "custom" && customMonth) {
        params.append("month", customMonth)
      }
      params.append("export", "csv")

      const response = await fetch(`/api/reports/monthly-balance?${params}`)
      if (!response.ok) throw new Error("Failed to export")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `monthly-balance-report-${customMonth || 'current'}-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Monthly balance report exported successfully!")
    } catch (error) {
      toast.error("Failed to export monthly balance report")
    }
  }

  const students = reportData?.students || []
  const summary = reportData?.summary || {
    totalStudents: 0,
    totalLastMonthBalance: 0,
    totalCurrentMonthCredited: 0,
    totalCurrentMonthDebited: 0,
    totalCurrentBalance: 0,
    totalTransactions: 0,
    activeStudents: 0,
    dateRange: {
      lastMonth: { start: "", end: "" },
      currentMonth: { start: "", end: "" }
    }
  }

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monthly Balance Report</h2>
          <p className="text-sm text-gray-600">
            Comprehensive student balance tracking from last month to current month
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" disabled={isLoading || !students.length}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Report Period</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current vs Last Month</SelectItem>
                  <SelectItem value="custom">Custom Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Select Month</Label>
                <Input 
                  type="month" 
                  value={customMonth} 
                  onChange={(e) => setCustomMonth(e.target.value)} 
                  max={new Date().toISOString().slice(0, 7)}
                />
              </div>
            )}
          </div>
          
          {summary.dateRange.currentMonth.start && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Previous Month:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDate(summary.dateRange.lastMonth.start)} - {formatDate(summary.dateRange.lastMonth.end)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Current Month:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDate(summary.dateRange.currentMonth.start)} - {formatDate(summary.dateRange.currentMonth.end)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalStudents}</p>
                <p className="text-xs text-gray-500">{summary.activeStudents} active this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Month Credited</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCurrentMonthCredited)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Month Debited</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalCurrentMonthDebited)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalCurrentBalance)}</p>
                <p className="text-xs text-gray-500">
                  {summary.totalCurrentBalance > summary.totalLastMonthBalance ? '+' : ''}
                  {formatCurrency(summary.totalCurrentBalance - summary.totalLastMonthBalance)} vs last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Balance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Student Monthly Balance Report
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading monthly balance report...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading report: {error.message}</p>
              <Button onClick={() => refetch()} className="mt-2" variant="outline">
                Retry
              </Button>
            </div>
          ) : !students || students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No student data found for the selected period.</p>
              <p className="text-sm mt-1">Try selecting a different date range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="p-4 bg-yellow-50 border-b">
                <p className="text-sm text-gray-700">
                  <strong>Debug Info:</strong> Found {students.length} students. 
                  Active students: {summary.activeStudents}. 
                  Total transactions: {summary.totalTransactions}.
                </p>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Details
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Month Balance
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credited
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debited
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Change
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Balance
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student: StudentBalanceReport) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {student.rollNumber}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {student.standard} ({student.medium})
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm font-medium ${
                          student.lastMonthEndBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(student.lastMonthEndBalance)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-medium text-green-600">
                          +{formatCurrency(student.currentMonthCredited)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-medium text-red-600">
                          -{formatCurrency(student.currentMonthDebited)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm font-medium ${
                          student.currentMonthNet >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {student.currentMonthNet >= 0 ? '+' : ''}{formatCurrency(student.currentMonthNet)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm font-bold ${
                          student.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(student.currentBalance)}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Change: {student.balanceChange >= 0 ? '+' : ''}{formatCurrency(student.balanceChange)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={student.transactionCount > 0 ? "default" : "secondary"}>
                          {student.transactionCount}
                        </Badge>
                        {!student.balanceVerification && (
                          <div className="text-xs text-red-500 mt-1">⚠️ Verification issue</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {reportData && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 text-center">
              Report generated on {new Date(reportData.reportGeneratedAt).toLocaleString('en-GB')} • 
              Total balance verification: {students.filter(s => s.balanceVerification).length}/{students.length} students verified
            </div>
          </CardContent>
        </Card>
      )}
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
// import { Download, DollarSign, ShoppingCart, Users, Calendar } from "lucide-react"
// import { toast } from "sonner"
// import type { Transaction } from "@/lib/types"

// interface TimelineReportStudent {
//   student: {
//     id: string
//     name: string
//     rollNumber: string
//     balance: number
//   }
//   transactions: Transaction[]
//   totalAmount: number
//   totalTransactions: number
// }

// interface TimelineReportData {
//   students: TimelineReportStudent[]
//   summary: {
//     totalStudents: number
//     totalTransactions: number
//     totalAmount: number
//   }
// }

// export function TimelineReport() {
//   const [dateRange, setDateRange] = useState("all")
//   const [startDate, setStartDate] = useState("")
//   const [endDate, setEndDate] = useState("")

//   const { data: reportData, isLoading } = useQuery<TimelineReportData>({
//     queryKey: ["timeline-report", dateRange, startDate, endDate],
//     queryFn: async () => {
//       const params = new URLSearchParams()
//       params.append("dateRange", dateRange)
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
//       const params = new URLSearchParams()
//       params.append("dateRange", dateRange)
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

//   const students = reportData?.students || []
//   const summary = reportData?.summary || { totalStudents: 0, totalTransactions: 0, totalAmount: 0 }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Timeline Report</h2>
//         <Button onClick={handleExport} variant="outline" disabled={isLoading || !students.length}>
//           <Download className="w-4 h-4 mr-2" />
//           Export Report
//         </Button>
//       </div>

//       {/* Date Range Filter */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Date Range</Label>
//               <Select value={dateRange} onValueChange={setDateRange}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select range" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Time</SelectItem>
//                   <SelectItem value="today">Today</SelectItem>
//                   <SelectItem value="week">Last 7 Days</SelectItem>
//                   <SelectItem value="month">Last 30 Days</SelectItem>
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
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center">
//               <Users className="w-8 h-8 text-blue-500" />
//               <div className="ml-4">
//                 <p className="text-sm font-medium text-gray-600">Total Students</p>
//                 <p className="text-2xl font-bold text-gray-900">{summary.totalStudents}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center">
//               <ShoppingCart className="w-8 h-8 text-green-500" />
//               <div className="ml-4">
//                 <p className="text-sm font-medium text-gray-600">Total Transactions</p>
//                 <p className="text-2xl font-bold text-gray-900">{summary.totalTransactions}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center">
//               <DollarSign className="w-8 h-8 text-purple-500" />
//               <div className="ml-4">
//                 <p className="text-sm font-medium text-gray-600">Total Revenue</p>
//                 <p className="text-2xl font-bold text-gray-900">₹{summary.totalAmount.toFixed(2)}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Students Timeline */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
//             <Calendar className="w-5 h-5 mr-2" />
//             Student Transaction Timeline
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           {isLoading ? (
//             <div className="text-center py-8">Loading timeline report...</div>
//           ) : students.length === 0 ? (
//             <div className="text-center py-8 text-gray-500">No transactions found for the selected date range.</div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Student
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Roll Number
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Current Balance
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Transactions
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Total Spent
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Last Transaction
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {students.map((studentData: TimelineReportStudent) => {
//                     const lastTransaction = studentData.transactions[0] // Assuming sorted by date desc
//                     return (
//                       <tr key={studentData.student.id}>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center">
//                             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
//                               👤
//                             </div>
//                             <div className="ml-3">
//                               <p className="text-sm font-medium text-gray-900">{studentData.student.name}</p>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <Badge variant="outline" className="text-blue-600">
//                             {studentData.student.rollNumber}
//                           </Badge>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span
//                             className={`text-sm font-medium ${
//                               studentData.student.balance < 0 ? "text-red-600" : "text-green-600"
//                             }`}
//                           >
//                             ₹{studentData.student.balance.toFixed(2)}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           <Badge variant="secondary">{studentData.totalTransactions}</Badge>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
//                           ₹{studentData.totalAmount.toFixed(2)}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {lastTransaction ? (
//                             <div>
//                               <div className="font-medium">
//                                 {new Date(lastTransaction.createdAt).toLocaleDateString('en-GB', {
//                                   day: '2-digit',
//                                   month: '2-digit',
//                                   year: 'numeric'
//                                 }) || "🤔?"}
//                               </div>
//                               <div className="text-xs">{new Date(lastTransaction.createdAt).toLocaleTimeString()}</div>
//                             </div>
//                           ) : (
//                             <span className="text-gray-400">No transactions</span>
//                           )}
//                         </td>
//                       </tr>
//                     )
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }