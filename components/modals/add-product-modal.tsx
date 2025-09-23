"use client"

import type React from "react"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { AddProduct } from "@/lib/types"

interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddProductModal({ open, onOpenChange }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    categoryId: "",
    description: "",
  })
  const queryClient = useQueryClient()

  const addProductMutation = useMutation({
    mutationFn: async (productData: AddProduct) => {
      console.log("Form data 1:", productData)

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productData,
          isActive: true,
          hasVariants: false, // Will be updated when variants are added
        }),
      })
      if (!response.ok) throw new Error("Failed to add product")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success("New product has been added successfully. You can now add variants to this product.")
      resetForm()
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Failed to add product. Please check the details and try again.")
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      categoryId: "",
      description: "",
    })
  }

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories")
      console.log("response", response)

      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    console.log("Form data 0:", formData)

    if (!formData.name || !formData.category) {
      toast.error("Please fill in all required fields.")
      return
    }

    console.log("Form data:", formData)

    addProductMutation.mutate(formData)
  }

  const handleClose = () => {
    if (!addProductMutation.isPending) {
      resetForm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="productName">Product Name *</Label>
            <Input
              id="productName"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              onValueChange={(id: string) => {
                console.log("Selected Category ID:", id)
                const selectedCategory = categories?.find((c: { id: string }) => c.id === id)
                setFormData((prev) => ({
                  ...prev,
                  categoryId: id,
                  category: selectedCategory?.name,
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.name} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> After creating the product, you'll need to add variants (sub-products) with
              specific prices, stock, and images.
            </p>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={addProductMutation.isPending}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {addProductMutation.isPending ? "Adding..." : "Add Product"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={addProductMutation.isPending}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}