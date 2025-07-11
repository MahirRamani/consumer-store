"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit } from "lucide-react"

interface EditProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: any) => void
  isLoading: boolean
  product: {
    id: string
    name: string
    categoryId: string
    price: number
    stock: number
    lowStockThreshold: number
    barcode?: string
    description?: string
  } | null
}

export default function EditProductModal({ open, onOpenChange, onConfirm, isLoading, product }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
    stock: "",
    lowStockThreshold: "",
    barcode: "",
    description: "",
  })

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json()
    },
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        categoryId: product.categoryId,
        price: product.price.toString(),
        stock: product.stock.toString(),
        lowStockThreshold: product.lowStockThreshold.toString(),
        barcode: product.barcode || "",
        description: product.description || "",
      })
    }
  }, [product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim() && formData.categoryId && formData.price) {
      onConfirm({
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock) || 0,
        lowStockThreshold: Number.parseInt(formData.lowStockThreshold) || 10,
        barcode: formData.barcode.trim() || undefined,
        description: formData.description.trim() || undefined,
      })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setFormData({
      name: "",
      categoryId: "",
      price: "",
      stock: "",
      lowStockThreshold: "",
      barcode: "",
      description: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="w-5 h-5 mr-2" />
            Edit Product
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                Product Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2 block">
                Category *
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price" className="text-sm font-medium text-gray-700 mb-2 block">
                Price (₹) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="stock" className="text-sm font-medium text-gray-700 mb-2 block">
                Stock
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="lowStockThreshold" className="text-sm font-medium text-gray-700 mb-2 block">
                Low Stock Alert
              </Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="barcode" className="text-sm font-medium text-gray-700 mb-2 block">
              Barcode
            </Label>
            <Input
              id="barcode"
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="Enter barcode (optional)"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description (optional)"
              className="min-h-[80px]"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-transparent"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || !formData.categoryId || !formData.price || isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isLoading ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
