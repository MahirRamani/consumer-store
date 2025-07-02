"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"

interface SalesData {
  date: string
  items: number
  day: string
}

export default function WeeklySalesChart() {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["weekly-sales"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/weekly-sales")
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Weekly Sales Trend
        </CardTitle>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Total Items: {totalItems}</span>
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
