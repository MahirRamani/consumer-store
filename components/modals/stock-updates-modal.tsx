"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PackagePlus, Calendar, User, TrendingUp } from "lucide-react"

interface StockUpdate {
  id: string
  product: {
    id: string
    name: string
    category: string
    price: number
    currentStock: number
  }
  quantityAdded: number
  previousStock: number
  newStock: number
  updatedBy: string
  createdAt: string
  reason: string
}

interface StockUpdatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  updates: StockUpdate[]
}

export default function StockUpdatesModal({ open, onOpenChange, updates }: StockUpdatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-green-600" />
            Recent Stock Updates ({updates.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {updates.length > 0 ? (
            updates.map((update) => (
              <Card key={update.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{update.product.name}</h3>
                        <Badge variant="outline" className="capitalize">
                          {update.product.category.replace("-", " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-gray-600">Stock Added</p>
                          <p className="text-lg font-bold text-green-600">+{update.quantityAdded}</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-600">Previous Stock</p>
                          <p className="text-lg font-bold text-blue-600">{update.previousStock}</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <p className="text-xs text-gray-600">Current Stock</p>
                          <p className="text-lg font-bold text-purple-600">{update.product.currentStock}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600">Price</p>
                          <p className="text-lg font-bold text-gray-900">₹{update.product.price.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Updated by: {update.updatedBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(update.createdAt).toLocaleDateString()} at{" "}
                            {new Date(update.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {update.reason && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          <strong>Reason:</strong> {update.reason}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {(
                            ((update.product.currentStock - update.previousStock) / update.previousStock) *
                            100
                          ).toFixed(1)}
                          % increase
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <PackagePlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No stock updates in the last 3 days</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
