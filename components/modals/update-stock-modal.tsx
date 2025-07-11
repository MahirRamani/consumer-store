"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Package, Plus, Minus } from "lucide-react"

interface UpdateStockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string | null
}

export default function UpdateStockModal({ open, onOpenChange, productId }: UpdateStockModalProps) {
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [operation, setOperation] = useState<"add" | "remove">("add")
  const queryClient = useQueryClient()

  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) return null
      const response = await fetch(`/api/products/${productId}`)
      if (!response.ok) throw new Error("Failed to fetch product")
      return response.json()
    },
    enabled: !!productId && open,
  })

  const updateStockMutation = useMutation({
    mutationFn: async ({ quantity, reason }: { quantity: number; reason: string }) => {
      if (!productId) throw new Error("No product selected")

      const response = await fetch(`/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: operation === "add" ? quantity : -quantity,
          reason,
        }),
      })
      if (!response.ok) throw new Error("Failed to update stock")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success("Stock updated successfully.")
      resetForm()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update stock.")
    },
  })

  const resetForm = () => {
    setQuantity("")
    setReason("")
    setOperation("add")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const qty = Number.parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity greater than 0.")
      return
    }

    if (operation === "remove" && product && qty > product.stock) {
      toast.error("Cannot remove more stock than available.")
      return
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for the stock update.")
      return
    }

    updateStockMutation.mutate({ quantity: qty, reason: reason.trim() })
  }

  const handleClose = () => {
    if (!updateStockMutation.isPending) {
      resetForm()
      onOpenChange(false)
    }
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  if (!product) {
    return null
  }

  const newStock =
    operation === "add"
      ? product.stock + (Number.parseInt(quantity) || 0)
      : product.stock - (Number.parseInt(quantity) || 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-500" />
            Update Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-600 capitalize">{product.category?.name}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Current Stock:</span>
              <Badge variant="outline" className="font-medium">
                {product.stock} units
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operation Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Operation</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={operation === "add" ? "default" : "outline"}
                  onClick={() => setOperation("add")}
                  className={`${operation === "add" ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock
                </Button>
                <Button
                  type="button"
                  variant={operation === "remove" ? "default" : "outline"}
                  onClick={() => setOperation("remove")}
                  className={`${operation === "remove" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Remove Stock
                </Button>
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={operation === "remove" ? product.stock : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
              />
              {operation === "remove" && <p className="text-xs text-gray-500 mt-1">Maximum: {product.stock} units</p>}
            </div>

            {/* Reason Input */}
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Reason for ${operation === "add" ? "adding" : "removing"} stock...`}
                rows={3}
                required
              />
            </div>

            {/* Stock Preview */}
            {quantity && !isNaN(Number.parseInt(quantity)) && Number.parseInt(quantity) > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Stock Level:</span>
                  <span className={`font-bold ${newStock >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {newStock} units
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <span>Change:</span>
                  <span className={operation === "add" ? "text-green-600" : "text-red-600"}>
                    {operation === "add" ? "+" : "-"}
                    {quantity} units
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <Button
                type="submit"
                disabled={updateStockMutation.isPending || newStock < 0}
                className={`flex-1 ${operation === "add" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white`}
              >
                {updateStockMutation.isPending ? "Updating..." : `${operation === "add" ? "Add" : "Remove"} Stock`}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose} disabled={updateStockMutation.isPending}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
