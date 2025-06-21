"use client"

import type React from "react"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface AddCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddCategoryModal({ open, onOpenChange }: AddCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const queryClient = useQueryClient()

  const addCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...categoryData,
          isActive: true,
        }),
      })
      if (!response.ok) throw new Error("Failed to add category")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("New category has been added successfully.")
      resetForm()
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Failed to add category. Please check the details and try again.")
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error("Please enter a category name.")
      return
    }

    addCategoryMutation.mutate(formData)
  }

  const handleClose = () => {
    if (!addCategoryMutation.isPending) {
      resetForm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Category Name *</Label>
            <Input
              id="categoryName"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter category description"
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={addCategoryMutation.isPending}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {addCategoryMutation.isPending ? "Adding..." : "Add Category"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={addCategoryMutation.isPending}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
