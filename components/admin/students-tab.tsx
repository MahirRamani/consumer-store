"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import type { Student } from "@/lib/types"

export default function StudentsTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStandard, setSelectedStandard] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const queryClient = useQueryClient()

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await fetch("/api/students")
      if (!response.ok) throw new Error("Failed to fetch students")
      return response.json()
    },
  })

  const filteredStudents = students?.filter((student: Student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStandard = selectedStandard === "all" || student.standard === selectedStandard
    const matchesYear = selectedYear === "all" || student.year.toString() === selectedYear

    return matchesSearch && matchesStandard && matchesYear
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading students...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Student Accounts (View Only)</h2>
        <p className="text-sm text-gray-500">Contact accountant to manage student accounts</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Roll number or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Standard</Label>
              <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                <SelectTrigger>
                  <SelectValue placeholder="All Standards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Standards</SelectItem>
                  <SelectItem value="10th">10th Standard</SelectItem>
                  <SelectItem value="11th">11th Standard</SelectItem>
                  <SelectItem value="12th">12th Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                  <SelectItem value="2019">2019</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Student Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                    Standard
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents?.map((student: Student) => {
                  const balance = student.balance
                  const initials = student.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)

                  return (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                            {initials}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.rollNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.standard}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{balance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={balance > 100 ? "default" : "destructive"}
                          className={balance > 100 ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {balance > 100 ? "Active" : "Low Balance"}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


// "use client"

// import { useState } from "react"
// import { useQuery, useQueryClient } from "@tanstack/react-query"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Search } from "lucide-react"
// import type { Student } from "@/lib/types"

// export default function StudentsTab() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedStandard, setSelectedStandard] = useState<string>("all")
//   const [selectedYear, setSelectedYear] = useState<string>("all")
//   const queryClient = useQueryClient()

//   const { data: students, isLoading } = useQuery({
//     queryKey: ["students"],
//     queryFn: async () => {
//       const response = await fetch("/api/students")
//       if (!response.ok) throw new Error("Failed to fetch students")
//       return response.json()
//     },
//   })

//   const filteredStudents = students?.filter((student: Student) => {
//     const matchesSearch =
//       student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesStandard = selectedStandard === "all" || student.standard === selectedStandard
//     const matchesYear = selectedYear === "all" || student.year.toString() === selectedYear

//     return matchesSearch && matchesStandard && matchesYear
//   })

//   if (isLoading) {
//     return <div className="text-center py-8">Loading students...</div>
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Student Accounts (View Only)</h2>
//         <p className="text-sm text-gray-500">Contact accountant to manage student accounts</p>
//       </div>

//       {/* Search and Filter */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Search Student</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Roll number or name..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Standard</Label>
//               <Select value={selectedStandard} onValueChange={setSelectedStandard}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Standards" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Standards</SelectItem>
//                   <SelectItem value="10th">10th Standard</SelectItem>
//                   <SelectItem value="11th">11th Standard</SelectItem>
//                   <SelectItem value="12th">12th Standard</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Year</Label>
//               <Select value={selectedYear} onValueChange={setSelectedYear}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Years" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Years</SelectItem>
//                   <SelectItem value="2024">2024</SelectItem>
//                   <SelectItem value="2023">2023</SelectItem>
//                   <SelectItem value="2022">2022</SelectItem>
//                   <SelectItem value="2021">2021</SelectItem>
//                   <SelectItem value="2020">2020</SelectItem>
//                   <SelectItem value="2019">2019</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Students List */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">Student Accounts</CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Student
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Roll Number
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Standard
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Balance
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredStudents?.map((student: Student) => {
//                   const balance = student.balance
//                   const initials = student.name
//                     .split(" ")
//                     .map((n) => n[0])
//                     .join("")
//                     .slice(0, 2)

//                   return (
//                     <tr key={student.id}>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
//                             {initials}
//                           </div>
//                           <div className="ml-3">
//                             <p className="text-sm font-medium text-gray-900">{student.name}</p>
//                             <p className="text-sm text-gray-500">{student.email}</p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.rollNumber}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.standard}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
//                         ₹{balance.toFixed(2)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge
//                           variant={balance > 100 ? "default" : "destructive"}
//                           className={balance > 100 ? "bg-green-500 hover:bg-green-600" : ""}
//                         >
//                           {balance > 100 ? "Active" : "Low Balance"}
//                         </Badge>
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
