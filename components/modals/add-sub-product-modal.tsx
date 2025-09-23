"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Upload, X, ImageIcon } from "lucide-react"

interface AddSubProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddSubProductModal({ open, onOpenChange }: AddSubProductModalProps) {
  const [formData, setFormData] = useState({
    productId: "",
    name: "",
    size: "",
    weight: "",
    volume: "",
    price: "",
    stock: "",
    lowStockThreshold: "10",
    barcode: "",
    description: "",
    image: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const queryClient = useQueryClient()

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-variants"],
    queryFn: async () => {
      const response = await fetch("/api/products")
      if (!response.ok) throw new Error("Failed to fetch products")
      return response.json()
    },
  })

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("image", file)
      
      const response = await fetch("/api/sub-products/upload-image", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) throw new Error("Failed to upload image")
      return response.json()
    },
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, image: data.secure_url }))
      toast.success("Image uploaded successfully!")
      setIsUploadingImage(false)
    },
    onError: (error) => {
      console.error("Image upload error:", error)
      toast.error("Failed to upload image. Please try again.")
      setIsUploadingImage(false)
    },
  })

  const addSubProductMutation = useMutation({
    mutationFn: async (subProductData: any) => {
      const response = await fetch("/api/sub-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subProductData,
          price: Number.parseFloat(subProductData.price),
          stock: Number.parseInt(subProductData.stock),
          lowStockThreshold: Number.parseInt(subProductData.lowStockThreshold),
          isActive: true,
        }),
      })
      if (!response.ok) throw new Error("Failed to add sub-product")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-products"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("New sub-product variant has been added successfully.")
      resetForm()
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Failed to add sub-product. Please check the details and try again.")
    },
  })

  const resetForm = () => {
    setFormData({
      productId: "",
      name: "",
      size: "",
      weight: "",
      volume: "",
      price: "",
      stock: "",
      lowStockThreshold: "10",
      barcode: "",
      description: "",
      image: "",
    })
    setImageFile(null)
    setImagePreview("")
    setIsUploadingImage(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.")
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB.")
      return
    }

    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = () => {
    if (!imageFile) return
    
    setIsUploadingImage(true)
    uploadImageMutation.mutate(imageFile)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview("")
    setFormData(prev => ({ ...prev, image: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productId || !formData.name || !formData.size || !formData.price) {
      toast.error("Please fill in all required fields.")
      return
    }

    if (Number.parseFloat(formData.price) <= 0) {
      toast.error("Price must be greater than 0.")
      return
    }

    if (Number.parseInt(formData.stock) < 0) {
      toast.error("Stock cannot be negative.")
      return
    }

    addSubProductMutation.mutate(formData)
  }

  const handleClose = () => {
    if (!addSubProductMutation.isPending && !isUploadingImage) {
      resetForm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Sub-Product Variant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="productId">Parent Product *</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, productId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product: any) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="variantName">Variant Name *</Label>
              <Input
                id="variantName"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Balaji Masala Wafer Small"
                required
              />
            </div>
            <div>
              <Label htmlFor="size">Size *</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
                placeholder="e.g., Small, Medium, Large"
                required
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label>Product Image</Label>
            
            {/* Image Preview */}
            {(imagePreview || formData.image) && (
              <div className="relative inline-block">
                <img
                  src={imagePreview || formData.image}
                  alt="Product preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Upload Controls */}
            <div className="flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex items-center gap-2"
              >
                <ImageIcon size={16} />
                Select Image
              </Button>

              {imageFile && !formData.image && (
                <Button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={isUploadingImage}
                  className="flex items-center gap-2"
                >
                  <Upload size={16} />
                  {isUploadingImage ? "Uploading..." : "Upload"}
                </Button>
              )}
            </div>
            
            <p className="text-xs text-gray-500">
              Select an image file (JPG, PNG, WebP). Maximum size: 5MB
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Weight (Optional)</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                placeholder="e.g., 25g, 50g"
              />
            </div>
            <div>
              <Label htmlFor="volume">Volume (Optional)</Label>
              <Input
                id="volume"
                value={formData.volume}
                onChange={(e) => setFormData((prev) => ({ ...prev, volume: e.target.value }))}
                placeholder="e.g., 250ml, 500ml"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="stock">Initial Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
                placeholder="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="barcode">Barcode (Optional)</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                placeholder="Enter barcode"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter variant description"
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={addSubProductMutation.isPending || isUploadingImage}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {addSubProductMutation.isPending ? "Adding..." : "Add Sub-Product"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={addSubProductMutation.isPending || isUploadingImage}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}