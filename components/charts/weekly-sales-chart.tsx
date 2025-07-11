"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"
import { useState } from "react"

interface SalesData {
  date: string
  items: number
  day: string
}

interface ItemOption {
  id: string
  name: string
}

export default function WeeklySalesChart() {
  const [selectedItem, setSelectedItem] = useState<string>("all")

  // Fetch available items for dropdown
  const { data: items } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/items")
      if (!response.ok) throw new Error("Failed to fetch items")
      return response.json() as Promise<ItemOption[]>
    },
  })

  // Fetch sales data based on selected item
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["weekly-sales", selectedItem],
    queryFn: async () => {
      const url = selectedItem === "all" 
        ? "/api/dashboard/weekly-sales" 
        : `/api/dashboard/weekly-sales?itemId=${selectedItem}`
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch weekly sales")
      return response.json() as Promise<SalesData[]>
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Weekly Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Loading chart...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalItems = salesData?.reduce((sum, day) => sum + day.items, 0) || 0
  const avgDaily = salesData ? Math.round(totalItems / salesData.length) : 0
  const selectedItemName = items?.find(item => item.id === selectedItem)?.name || "All Items"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Weekly Sales Trend
        </CardTitle>
        
        {/* Item Selection Dropdown */}
        <div className="flex items-center gap-4 mt-2">
          <label htmlFor="item-select" className="text-sm font-medium text-gray-700">
            Select Item:
          </label>
          <select
            id="item-select"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Items</option>
            {items?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 text-sm text-gray-600 mt-2">
          <span>Item: {selectedItemName}</span>
          <span>Total Sold: {totalItems}</span>
          <span>Daily Average: {avgDaily}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "#374151", fontWeight: "600" }}
              />
              <Line
                type="monotone"
                dataKey="items"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// "use client"

// import { useQuery } from "@tanstack/react-query"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
// import { TrendingUp } from "lucide-react"

// interface SalesData {
//   date: string
//   items: number
//   day: string
// }

// export default function WeeklySalesChart() {
//   const { data: salesData, isLoading } = useQuery({
//     queryKey: ["weekly-sales"],
//     queryFn: async () => {
//       const response = await fetch("/api/dashboard/weekly-sales")
//       if (!response.ok) throw new Error("Failed to fetch weekly sales")
//       return response.json() as Promise<SalesData[]>
//     },
//   })

//   if (isLoading) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">Weekly Sales Trend</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="h-64 flex items-center justify-center">
//             <p className="text-gray-500">Loading chart...</p>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   const totalItems = salesData?.reduce((sum, day) => sum + day.items, 0) || 0
//   const avgDaily = salesData ? Math.round(totalItems / salesData.length) : 0

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
//           <TrendingUp className="w-5 h-5 text-blue-600" />
//           Weekly Sales Trend
//         </CardTitle>
//         <div className="flex gap-4 text-sm text-gray-600">
//           <span>Total Items: {totalItems}</span>
//           <span>Daily Average: {avgDaily}</span>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="h-64">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={salesData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//               <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
//               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
//               <Tooltip
//                 contentStyle={{
//                   backgroundColor: "white",
//                   border: "1px solid #e5e7eb",
//                   borderRadius: "8px",
//                   boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//                 }}
//                 labelStyle={{ color: "#374151", fontWeight: "600" }}
//               />
//               <Line
//                 type="monotone"
//                 dataKey="items"
//                 stroke="#3b82f6"
//                 strokeWidth={3}
//                 dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
//                 activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }
