"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Upload, X, ImageIcon, Link2, Loader2, FileText } from "lucide-react"

// Comprehensive type definitions
interface Product {
  id: string
  name: string
  category: {
    id: string
    name: string
  }
}

interface SubProductFormData {
  productId: string
  name: string
  size: string
  weight: string
  volume: string
  price: string
  stock: string
  lowStockThreshold: string
  barcode: string
  description: string
  image: string
}

interface ImageUploadResponse {
  secure_url: string
  public_id?: string
  format?: string
  width?: number
  height?: number
}

interface AddSubProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CreateSubProductPayload {
  productId: string
  name: string
  size: string
  weight?: string
  volume?: string
  price: number
  stock: number
  lowStockThreshold: number
  barcode?: string
  description?: string
  image?: string
  isActive: boolean
}

// Input validation utilities
const validateImageUrl = (url: string): boolean => {
  if (!url.trim()) return false
  
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)' }
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image size should be less than 5MB' }
  }
  
  return { isValid: true }
}

// Helper function to sanitize filename
const sanitizeFileName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Helper function to get file extension
const getFileExtension = (file: File): string => {
  return file.name.split('.').pop()?.toLowerCase() || 'jpg'
}

export default function AddSubProductModal({ open, onOpenChange }: AddSubProductModalProps) {
  const [formData, setFormData] = useState<SubProductFormData>({
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
  const [imageName, setImageName] = useState<string>("") // New state for custom image name
  const [imageUrl, setImageUrl] = useState<string>("")
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageMethod, setImageMethod] = useState<"upload" | "url">("upload")
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SubProductFormData | 'imageName', string>>>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Fetch products with proper error handling
  const { 
    data: products = [], 
    isLoading: isProductsLoading,
    error: productsError 
  } = useQuery({
    queryKey: ["products-for-variants"],
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Image upload mutation with custom name support
  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, customName }: { file: File; customName?: string }): Promise<ImageUploadResponse> => {
      const formData = new FormData()
      formData.append("image", file)
      
      // Add custom name if provided
      if (customName?.trim()) {
        const sanitizedName = sanitizeFileName(customName)
        const fileExtension = getFileExtension(file)
        const finalName = `${sanitizedName}.${fileExtension}`
        formData.append("imageName", finalName)
      }

      const response = await fetch("/api/sub-products/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed: ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (data: ImageUploadResponse) => {
      setFormData(prev => ({ ...prev, image: data.secure_url }))
      setImagePreview(data.secure_url)
      toast.success("Image uploaded successfully!")
      setIsUploadingImage(false)
    },
    onError: (error: Error) => {
      console.error("Image upload error:", error)
      toast.error(`Failed to upload image: ${error.message}`)
      setIsUploadingImage(false)
    },
  })

  // Add sub-product mutation with comprehensive error handling
  const addSubProductMutation = useMutation({
    mutationFn: async (subProductData: SubProductFormData): Promise<any> => {
      const payload: CreateSubProductPayload = {
        productId: subProductData.productId,
        name: subProductData.name.trim(),
        size: subProductData.size.trim(),
        price: Number.parseFloat(subProductData.price),
        stock: Number.parseInt(subProductData.stock, 10),
        lowStockThreshold: Number.parseInt(subProductData.lowStockThreshold, 10),
        isActive: true,
        ...(subProductData.weight.trim() && { weight: subProductData.weight.trim() }),
        ...(subProductData.volume.trim() && { volume: subProductData.volume.trim() }),
        ...(subProductData.barcode.trim() && { barcode: subProductData.barcode.trim() }),
        ...(subProductData.description.trim() && { description: subProductData.description.trim() }),
        ...(subProductData.image.trim() && { image: subProductData.image.trim() }),
      }

      const response = await fetch("/api/sub-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to create sub-product: ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-products"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Sub-product variant created successfully!")
      resetForm()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      console.error("Add sub-product error:", error)
      toast.error(`Failed to create sub-product: ${error.message}`)
    },
  })

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof SubProductFormData | 'imageName', string>> = {}
    
    if (!formData.productId.trim()) errors.productId = "Parent product is required"
    if (!formData.name.trim()) errors.name = "Variant name is required"
    // if (!formData.size.trim()) errors.size = "Size is required"
    if (!formData.price.trim()) {
      errors.price = "Price is required"
    } else if (Number.parseFloat(formData.price) <= 0) {
      errors.price = "Price must be greater than 0"
    }
    if (!formData.stock.trim()) {
      errors.stock = "Stock is required"
    } else if (Number.parseInt(formData.stock, 10) < 0) {
      errors.stock = "Stock cannot be negative"
    }
    if (formData.lowStockThreshold.trim() && Number.parseInt(formData.lowStockThreshold, 10) < 0) {
      errors.lowStockThreshold = "Low stock threshold cannot be negative"
    }

    // Validate image name if provided
    if (imageMethod === "upload" && imageName.trim()) {
      if (imageName.length < 3) {
        errors.imageName = "Image name must be at least 3 characters long"
      } else if (imageName.length > 50) {
        errors.imageName = "Image name must be less than 50 characters"
      } else if (!/^[a-zA-Z0-9\s\-_.]+$/.test(imageName)) {
        errors.imageName = "Image name can only contain letters, numbers, spaces, hyphens, dots, and underscores"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, imageMethod, imageName])

  // Reset form to initial state
  const resetForm = useCallback(() => {
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
    setImageName("")
    setImageUrl("")
    setImagePreview("")
    setImageMethod("upload")
    setIsUploadingImage(false)
    setFormErrors({})
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  // Handle form field changes
  const handleFieldChange = useCallback(<K extends keyof SubProductFormData>(
    field: K,
    value: SubProductFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [formErrors])

  // Handle image name change
  const handleImageNameChange = useCallback((name: string) => {
    setImageName(name)
    
    // Clear image name error when user starts typing
    if (formErrors.imageName) {
      setFormErrors(prev => ({ ...prev, imageName: undefined }))
    }
  }, [formErrors])

  // Handle file selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }

    setImageFile(file)
    setImageMethod("upload")

    // Auto-suggest image name based on file name (without extension)
    const fileName = file.name.split('.').slice(0, -1).join('.')
    if (!imageName.trim()) {
      setImageName(fileName)
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
    }
    reader.readAsDataURL(file)
  }, [imageName])

  // Handle image URL input
  const handleImageUrlChange = useCallback((url: string) => {
    setImageUrl(url)
    
    if (url.trim() && validateImageUrl(url)) {
      setImagePreview(url)
      setFormData(prev => ({ ...prev, image: url }))
      setImageMethod("url")
      // Clear any uploaded file
      setImageFile(null)
      setImageName("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } else if (!url.trim()) {
      setImagePreview("")
      setFormData(prev => ({ ...prev, image: "" }))
    }
  }, [])

  // Handle image upload
  const handleImageUpload = useCallback(() => {
    if (!imageFile) return

    setIsUploadingImage(true)
    uploadImageMutation.mutate({ 
      file: imageFile, 
      customName: imageName.trim() || undefined 
    })
  }, [imageFile, imageName, uploadImageMutation])

  // Remove image
  const removeImage = useCallback(() => {
    setImageFile(null)
    setImageName("")
    setImageUrl("")
    setImagePreview("")
    setFormData(prev => ({ ...prev, image: "" }))
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting")
      return
    }

    // Ensure image is set if upload method was used
    if (imageMethod === "upload" && imageFile && !formData.image) {
      toast.error("Please upload the selected image first")
      return
    }

    addSubProductMutation.mutate(formData)
  }, [formData, imageMethod, imageFile, validateForm, addSubProductMutation])

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!addSubProductMutation.isPending && !isUploadingImage) {
      resetForm()
      onOpenChange(false)
    }
  }, [addSubProductMutation.isPending, isUploadingImage, resetForm, onOpenChange])

  const isSubmitting = addSubProductMutation.isPending || isUploadingImage

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold">Add New Sub-Product Variant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Parent Product Selection */}
          <div className="space-y-1">
            <Label htmlFor="productId" className="text-sm font-medium">
              Parent Product <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => handleFieldChange("productId", value)}
              disabled={isProductsLoading}
            >
              <SelectTrigger className={formErrors.productId ? "border-red-500" : ""}>
                <SelectValue placeholder="Select parent product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product: Product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.category || 'No Category'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.productId && (
              <p className="text-xs text-red-500 mt-1">{formErrors.productId}</p>
            )}
            {productsError && (
              <p className="text-xs text-amber-600 mt-1">Warning: Failed to load products</p>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="variantName" className="text-sm font-medium">
                Variant Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="variantName"
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="e.g., Balaji Masala Wafer Small"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="size" className="text-sm font-medium">
                Size
              </Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => handleFieldChange("size", e.target.value)}
                placeholder="e.g., Small, Medium, Large"
              />
            </div>
          </div>

          {/* Image Management */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Product Image</Label>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  onError={() => {
                    setImagePreview("")
                    toast.error("Failed to load image preview")
                  }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors text-xs"
                  disabled={isSubmitting}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Image Input Methods */}
            <Tabs value={imageMethod} onValueChange={(value) => setImageMethod(value as "upload" | "url")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="text-xs">Upload File</TabsTrigger>
                <TabsTrigger value="url" className="text-xs">Image URL</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-3 mt-2">
                {/* Custom Image Name Input */}
                <div className="space-y-1">
                  <Label htmlFor="imageName" className="text-sm font-medium flex items-center gap-2">
                    <FileText size={14} />
                    Custom Image Name (Optional)
                  </Label>
                  <Input
                    id="imageName"
                    value={imageName}
                    onChange={(e) => handleImageNameChange(e.target.value)}
                    placeholder="e.g., balaji-masala-wafer-small"
                    disabled={isSubmitting}
                    className={formErrors.imageName ? "border-red-500" : ""}
                  />
                  {formErrors.imageName && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.imageName}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Leave empty to use original filename. Only letters, numbers, spaces, hyphens, dots, and underscores allowed.
                  </p>
                </div>

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
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <ImageIcon size={14} />
                    Select Image
                  </Button>

                  {imageFile && !formData.image && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleImageUpload}
                      disabled={isUploadingImage}
                      className="flex items-center gap-2"
                    >
                      {isUploadingImage ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      {isUploadingImage ? "Uploading..." : "Upload"}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Support: JPEG, PNG, WebP, GIF. Max size: 5MB
                </p>
              </TabsContent>

              <TabsContent value="url" className="space-y-2 mt-2">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      value={imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      disabled={isSubmitting}
                    />
                  </div>
                  <Link2 size={16} className="text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">
                  Enter a direct link to an image file
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Physical Properties */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="weight" className="text-sm font-medium">Weight</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => handleFieldChange("weight", e.target.value)}
                placeholder="e.g., 25g, 50g"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="volume" className="text-sm font-medium">Volume</Label>
              <Input
                id="volume"
                value={formData.volume}
                onChange={(e) => handleFieldChange("volume", e.target.value)}
                placeholder="e.g., 250ml, 500ml"
              />
            </div>
          </div>

          {/* Pricing and Stock */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="price" className="text-sm font-medium">
                Price (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={(e) => handleFieldChange("price", e.target.value)}
                placeholder="0.00"
                className={formErrors.price ? "border-red-500" : ""}
              />
              {formErrors.price && (
                <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="stock" className="text-sm font-medium">
                Initial Stock <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleFieldChange("stock", e.target.value)}
                placeholder="0"
                className={formErrors.stock ? "border-red-500" : ""}
              />
              {formErrors.stock && (
                <p className="text-xs text-red-500 mt-1">{formErrors.stock}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lowStockThreshold" className="text-sm font-medium">Low Stock Alert</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => handleFieldChange("lowStockThreshold", e.target.value)}
                placeholder="10"
                className={formErrors.lowStockThreshold ? "border-red-500" : ""}
              />
              {formErrors.lowStockThreshold && (
                <p className="text-xs text-red-500 mt-1">{formErrors.lowStockThreshold}</p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-1">
            <Label htmlFor="barcode" className="text-sm font-medium">Barcode</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => handleFieldChange("barcode", e.target.value)}
              placeholder="Enter barcode number"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Enter variant description"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {isUploadingImage ? "Uploading..." : "Creating..."}
                </div>
              ) : (
                "Create Sub-Product"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}






// "use client"

// import type React from "react"
// import { useState, useRef } from "react"
// import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Textarea } from "@/components/ui/textarea"
// import { toast } from "sonner"
// import { Upload, X, ImageIcon } from "lucide-react"

// interface AddSubProductModalProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
// }

// export default function AddSubProductModal({ open, onOpenChange }: AddSubProductModalProps) {
//   const [formData, setFormData] = useState({
//     productId: "",
//     name: "",
//     size: "",
//     weight: "",
//     volume: "",
//     price: "",
//     stock: "",
//     lowStockThreshold: "10",
//     barcode: "",
//     description: "",
//     image: "",
//   })
//   const [imageFile, setImageFile] = useState<File | null>(null)
//   const [imagePreview, setImagePreview] = useState<string>("")
//   const [isUploadingImage, setIsUploadingImage] = useState(false)
//   const fileInputRef = useRef<HTMLInputElement>(null)
  
//   const queryClient = useQueryClient()

//   const { data: products = [] } = useQuery({
//     queryKey: ["products-for-variants"],
//     queryFn: async () => {
//       const response = await fetch("/api/products")
//       if (!response.ok) throw new Error("Failed to fetch products")
//       return response.json()
//     },
//   })

//   // Image upload mutation
//   const uploadImageMutation = useMutation({
//     mutationFn: async (file: File) => {
//       const formData = new FormData()
//       formData.append("image", file)
      
//       const response = await fetch("/api/sub-products/upload-image", {
//         method: "POST",
//         body: formData,
//       })
      
//       if (!response.ok) throw new Error("Failed to upload image")
//       return response.json()
//     },
//     onSuccess: (data) => {
//       setFormData(prev => ({ ...prev, image: data.secure_url }))
//       toast.success("Image uploaded successfully!")
//       setIsUploadingImage(false)
//     },
//     onError: (error) => {
//       console.error("Image upload error:", error)
//       toast.error("Failed to upload image. Please try again.")
//       setIsUploadingImage(false)
//     },
//   })

//   const addSubProductMutation = useMutation({
//     mutationFn: async (subProductData: any) => {
//       const response = await fetch("/api/sub-products", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...subProductData,
//           price: Number.parseFloat(subProductData.price),
//           stock: Number.parseInt(subProductData.stock),
//           lowStockThreshold: Number.parseInt(subProductData.lowStockThreshold),
//           isActive: true,
//         }),
//       })
//       if (!response.ok) throw new Error("Failed to add sub-product")
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["sub-products"] })
//       queryClient.invalidateQueries({ queryKey: ["products"] })
//       toast.success("New sub-product variant has been added successfully.")
//       resetForm()
//       onOpenChange(false)
//     },
//     onError: () => {
//       toast.error("Failed to add sub-product. Please check the details and try again.")
//     },
//   })

//   const resetForm = () => {
//     setFormData({
//       productId: "",
//       name: "",
//       size: "",
//       weight: "",
//       volume: "",
//       price: "",
//       stock: "",
//       lowStockThreshold: "10",
//       barcode: "",
//       description: "",
//       image: "",
//     })
//     setImageFile(null)
//     setImagePreview("")
//     setIsUploadingImage(false)
//   }

//   const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return

//     // Validate file type
//     if (!file.type.startsWith("image/")) {
//       toast.error("Please select a valid image file.")
//       return
//     }

//     // Validate file size (5MB limit)
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("Image size should be less than 5MB.")
//       return
//     }

//     setImageFile(file)
    
//     // Create preview
//     const reader = new FileReader()
//     reader.onload = (e) => {
//       setImagePreview(e.target?.result as string)
//     }
//     reader.readAsDataURL(file)
//   }

//   const handleImageUpload = () => {
//     if (!imageFile) return
    
//     setIsUploadingImage(true)
//     uploadImageMutation.mutate(imageFile)
//   }

//   const removeImage = () => {
//     setImageFile(null)
//     setImagePreview("")
//     setFormData(prev => ({ ...prev, image: "" }))
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ""
//     }
//   }

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!formData.productId || !formData.name || !formData.size || !formData.price) {
//       toast.error("Please fill in all required fields.")
//       return
//     }

//     if (Number.parseFloat(formData.price) <= 0) {
//       toast.error("Price must be greater than 0.")
//       return
//     }

//     if (Number.parseInt(formData.stock) < 0) {
//       toast.error("Stock cannot be negative.")
//       return
//     }

//     addSubProductMutation.mutate(formData)
//   }

//   const handleClose = () => {
//     if (!addSubProductMutation.isPending && !isUploadingImage) {
//       resetForm()
//       onOpenChange(false)
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={handleClose}>
//       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Add New Sub-Product Variant</DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <Label htmlFor="productId">Parent Product *</Label>
//             <Select
//               value={formData.productId}
//               onValueChange={(value) => setFormData((prev) => ({ ...prev, productId: value }))}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select parent product" />
//               </SelectTrigger>
//               <SelectContent>
//                 {products.map((product: any) => (
//                   <SelectItem key={product.id} value={product.id}>
//                     {product.name} ({product.category})
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label htmlFor="variantName">Variant Name *</Label>
//               <Input
//                 id="variantName"
//                 value={formData.name}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
//                 placeholder="e.g., Balaji Masala Wafer Small"
//                 required
//               />
//             </div>
//             <div>
//               <Label htmlFor="size">Size *</Label>
//               <Input
//                 id="size"
//                 value={formData.size}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
//                 placeholder="e.g., Small, Medium, Large"
//                 required
//               />
//             </div>
//           </div>

//           {/* Image Upload Section */}
//           <div className="space-y-3">
//             <Label>Product Image</Label>
            
//             {/* Image Preview */}
//             {(imagePreview || formData.image) && (
//               <div className="relative inline-block">
//                 <img
//                   src={imagePreview || formData.image}
//                   alt="Product preview"
//                   className="w-32 h-32 object-cover rounded-lg border border-gray-200"
//                 />
//                 <button
//                   type="button"
//                   onClick={removeImage}
//                   className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
//                 >
//                   <X size={14} />
//                 </button>
//               </div>
//             )}

//             {/* Upload Controls */}
//             <div className="flex gap-2 items-center">
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/*"
//                 onChange={handleImageSelect}
//                 className="hidden"
//               />
              
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => fileInputRef.current?.click()}
//                 disabled={isUploadingImage}
//                 className="flex items-center gap-2"
//               >
//                 <ImageIcon size={16} />
//                 Select Image
//               </Button>

//               {imageFile && !formData.image && (
//                 <Button
//                   type="button"
//                   onClick={handleImageUpload}
//                   disabled={isUploadingImage}
//                   className="flex items-center gap-2"
//                 >
//                   <Upload size={16} />
//                   {isUploadingImage ? "Uploading..." : "Upload"}
//                 </Button>
//               )}
//             </div>
            
//             <p className="text-xs text-gray-500">
//               Select an image file (JPG, PNG, WebP). Maximum size: 5MB
//             </p>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label htmlFor="weight">Weight (Optional)</Label>
//               <Input
//                 id="weight"
//                 value={formData.weight}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
//                 placeholder="e.g., 25g, 50g"
//               />
//             </div>
//             <div>
//               <Label htmlFor="volume">Volume (Optional)</Label>
//               <Input
//                 id="volume"
//                 value={formData.volume}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, volume: e.target.value }))}
//                 placeholder="e.g., 250ml, 500ml"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-4">
//             <div>
//               <Label htmlFor="price">Price (₹) *</Label>
//               <Input
//                 id="price"
//                 type="number"
//                 step="0.01"
//                 min="0.01"
//                 value={formData.price}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
//                 placeholder="0.00"
//                 required
//               />
//             </div>
//             <div>
//               <Label htmlFor="stock">Initial Stock *</Label>
//               <Input
//                 id="stock"
//                 type="number"
//                 min="0"
//                 value={formData.stock}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
//                 placeholder="0"
//                 required
//               />
//             </div>
//             <div>
//               <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
//               <Input
//                 id="lowStockThreshold"
//                 type="number"
//                 min="0"
//                 value={formData.lowStockThreshold}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
//                 placeholder="10"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Label htmlFor="barcode">Barcode (Optional)</Label>
//               <Input
//                 id="barcode"
//                 value={formData.barcode}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
//                 placeholder="Enter barcode"
//               />
//             </div>
//           </div>

//           <div>
//             <Label htmlFor="description">Description (Optional)</Label>
//             <Textarea
//               id="description"
//               value={formData.description}
//               onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
//               placeholder="Enter variant description"
//               rows={3}
//             />
//           </div>

//           <div className="flex space-x-2 pt-4">
//             <Button
//               type="submit"
//               disabled={addSubProductMutation.isPending || isUploadingImage}
//               className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
//             >
//               {addSubProductMutation.isPending ? "Adding..." : "Add Sub-Product"}
//             </Button>
//             <Button 
//               type="button" 
//               variant="outline" 
//               onClick={handleClose} 
//               disabled={addSubProductMutation.isPending || isUploadingImage}
//             >
//               Cancel
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }