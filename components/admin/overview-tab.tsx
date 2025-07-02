"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, IndianRupee, Receipt, TrendingUp, AlertTriangle, PackagePlus } from "lucide-react"
import LowStockModal from "@/components/modals/low-stock-modal"
import StockUpdatesModal from "@/components/modals/stock-updates-modal"
import WeeklySalesChart from "@/components/charts/weekly-sales-chart"

export default function OverviewTab() {
  const [showLowStockModal, setShowLowStockModal] = useState(false)
  const [showStockUpdatesModal, setShowStockUpdatesModal] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")
      return response.json()
    },
  })

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/recent-transactions")
      if (!response.ok) throw new Error("Failed to fetch transactions")
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

  const { data: recentStockUpdates, isLoading: recentStockLoading } = useQuery({
    queryKey: ["recent-stock-updates"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/recent-stock-updates")
      if (!response.ok) throw new Error("Failed to fetch recent stock updates")
      return response.json()
    },
  })

  if (statsLoading || transactionsLoading || lowStockLoading || recentStockLoading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowStockUpdatesModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Updates</p>
                <p className="text-2xl font-bold text-gray-900">{recentStockUpdates?.length || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <PackagePlus className="text-green-600 w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Stock added in last 3 days
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowLowStockModal(true)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="text-purple-600 w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-2 flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {stats?.lowStockCount || 0} low stock items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats?.todaySales?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <IndianRupee className="text-green-600 w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              18% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.todayTransactions || 0}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Receipt className="text-red-600 w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Today's count</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklySalesChart />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Receipt className="text-green-600 w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.student?.name || "Unknown Student"}</p>
                        <p className="text-sm text-gray-600">{transaction.student?.rollNumber || "N/A"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ₹{Number.parseFloat(transaction.totalAmount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <LowStockModal open={showLowStockModal} onOpenChange={setShowLowStockModal} products={lowStockProducts || []} />
      <StockUpdatesModal
        open={showStockUpdatesModal}
        onOpenChange={setShowStockUpdatesModal}
        updates={recentStockUpdates || []}
      />
    </div>
  )
}
