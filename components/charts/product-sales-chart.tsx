"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Package } from "lucide-react"
import { useState } from "react"

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
  "#8DD1E1",
  "#D084D0",
]

export default function ProductSalesChart() {
  const [days, setDays] = useState("30")
  const [chartType, setChartType] = useState<"bar" | "pie">("bar")

  const { data: salesData, isLoading } = useQuery({
    queryKey: ["product-sales", days],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/product-sales?days=${days}`)
      if (!response.ok) throw new Error("Failed to fetch product sales")
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Sales Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalRevenue = salesData?.reduce((sum: number, item: any) => sum + item.revenue, 0) || 0
  const totalQuantity = salesData?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Product Sales Analysis
          </CardTitle>
          <div className="flex gap-2">
            <Select value={chartType} onValueChange={(value: "bar" | "pie") => setChartType(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
              </SelectContent>
            </Select>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Total Items Sold: {totalQuantity}</span>
          <span>Total Revenue: ₹{totalRevenue.toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent>
        {salesData && salesData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} interval={0} />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "quantity" ? `${value} items` : `₹${Number(value).toFixed(2)}`,
                      name === "quantity" ? "Quantity Sold" : "Revenue",
                    ]}
                    labelFormatter={(label) => `Product: ${label}`}
                  />
                  <Bar dataKey="quantity" fill="#8884d8" name="quantity" />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={salesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantity"
                  >
                    {salesData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} items`, "Quantity Sold"]} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No sales data available</p>
              <p className="text-sm">Sales data will appear here once transactions are made</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
