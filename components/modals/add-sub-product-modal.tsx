"use client"

import type React from "react"
import { useState } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

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
  const queryClient = useQueryClient()

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-variants"],
    queryFn: async () => {
      const response = await fetch("/api/products")
      if (!response.ok) throw new Error("Failed to fetch products")
      return response.json()
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
    if (!addSubProductMutation.isPending) {
      resetForm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
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

          <div>
            <Label htmlFor="image">Product Image URL (Optional)</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide a URL to the product image. This will be displayed in the product grid.
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
            {/* <div>
              <Label htmlFor="sku">SKU (Optional)</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="Enter SKU"
              />
            </div> */}
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
              disabled={addSubProductMutation.isPending}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {addSubProductMutation.isPending ? "Adding..." : "Add Sub-Product"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={addSubProductMutation.isPending}>
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
// import { useState } from "react"
// import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Textarea } from "@/components/ui/textarea"
// import { toast } from "sonner"

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
//     sku: "",
//     barcode: "",
//     description: "",
//   })
//   const queryClient = useQueryClient()

//   const { data: products = [] } = useQuery({
//     queryKey: ["products-for-variants"],
//     queryFn: async () => {
//       const response = await fetch("/api/products")
//       if (!response.ok) throw new Error("Failed to fetch products")
//       return response.json()
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
//       sku: "",
//       barcode: "",
//       description: "",
//     })
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
//     if (!addSubProductMutation.isPending) {
//       resetForm()
//       onOpenChange(false)
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={handleClose}>
//       <DialogContent className="max-w-2xl">
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
//               <Label htmlFor="sku">SKU (Optional)</Label>
//               <Input
//                 id="sku"
//                 value={formData.sku}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
//                 placeholder="Enter SKU"
//               />
//             </div>
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
//               disabled={addSubProductMutation.isPending}
//               className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
//             >
//               {addSubProductMutation.isPending ? "Adding..." : "Add Sub-Product"}
//             </Button>
//             <Button type="button" variant="outline" onClick={handleClose} disabled={addSubProductMutation.isPending}>
//               Cancel
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }

// "use client"

// import type React from "react"

// import { useState } from "react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Package, Plus } from "lucide-react"
// import type { Product } from "@/lib/types"

// interface AddSubProductModalProps {
//   isOpen: boolean
//   onClose: () => void
//   products: Product[]
//   onSuccess: () => void
// }

// export function AddSubProductModal({ isOpen, onClose, products, onSuccess }: AddSubProductModalProps) {
//   const [formData, setFormData] = useState({
//     parentProductId: "",
//     name: "",
//     size: "",
//     weight: "",
//     volume: "",
//     sku: "",
//     barcode: "",
//     description: "",
//     price: "",
//     stock: "",
//     lowStockThreshold: "10",
//   })
//   const [loading, setLoading] = useState(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)

//     try {
//       const response = await fetch("/api/sub-products", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           ...formData,
//           price: Number.parseFloat(formData.price),
//           stock: Number.parseInt(formData.stock) || 0,
//           lowStockThreshold: Number.parseInt(formData.lowStockThreshold) || 10,
//         }),
//       })

//       if (response.ok) {
//         onSuccess()
//         onClose()
//         setFormData({
//           parentProductId: "",
//           name: "",
//           size: "",
//           weight: "",
//           volume: "",
//           sku: "",
//           barcode: "",
//           description: "",
//           price: "",
//           stock: "",
//           lowStockThreshold: "10",
//         })
//       } else {
//         const error = await response.json()
//         alert(error.message || "Failed to create sub-product")
//       }
//     } catch (error) {
//       console.error("Error creating sub-product:", error)
//       alert("Failed to create sub-product")
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleChange = (field: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }))
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Package className="h-5 w-5" />
//             Add Sub-Product (Variant)
//           </DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="md:col-span-2">
//               <Label htmlFor="parentProductId">Parent Product *</Label>
//               <Select
//                 value={formData.parentProductId}
//                 onValueChange={(value) => handleChange("parentProductId", value)}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select parent product" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {products.map((product) => (
//                     <SelectItem key={product.id} value={product.id}>
//                       {product.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div>
//               <Label htmlFor="name">Variant Name *</Label>
//               <Input
//                 id="name"
//                 value={formData.name}
//                 onChange={(e) => handleChange("name", e.target.value)}
//                 placeholder="e.g., Large Coca Cola"
//                 required
//               />
//             </div>

//             <div>
//               <Label htmlFor="size">Size *</Label>
//               <Input
//                 id="size"
//                 value={formData.size}
//                 onChange={(e) => handleChange("size", e.target.value)}
//                 placeholder="e.g., 500ml, Large, XL"
//                 required
//               />
//             </div>

//             <div>
//               <Label htmlFor="price">Price (₹) *</Label>
//               <Input
//                 id="price"
//                 type="number"
//                 step="0.01"
//                 min="0"
//                 value={formData.price}
//                 onChange={(e) => handleChange("price", e.target.value)}
//                 placeholder="0.00"
//                 required
//               />
//             </div>

//             <div>
//               <Label htmlFor="stock">Initial Stock</Label>
//               <Input
//                 id="stock"
//                 type="number"
//                 min="0"
//                 value={formData.stock}
//                 onChange={(e) => handleChange("stock", e.target.value)}
//                 placeholder="0"
//               />
//             </div>

//             <div>
//               <Label htmlFor="weight">Weight</Label>
//               <Input
//                 id="weight"
//                 value={formData.weight}
//                 onChange={(e) => handleChange("weight", e.target.value)}
//                 placeholder="e.g., 250g, 1kg"
//               />
//             </div>

//             <div>
//               <Label htmlFor="volume">Volume</Label>
//               <Input
//                 id="volume"
//                 value={formData.volume}
//                 onChange={(e) => handleChange("volume", e.target.value)}
//                 placeholder="e.g., 500ml, 1L"
//               />
//             </div>

//             <div>
//               <Label htmlFor="sku">SKU/Barcode</Label>
//               <Input
//                 id="sku"
//                 value={formData.sku}
//                 onChange={(e) => handleChange("sku", e.target.value)}
//                 placeholder="Unique identifier"
//               />
//             </div>

//             <div>
//               <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
//               <Input
//                 id="lowStockThreshold"
//                 type="number"
//                 min="0"
//                 value={formData.lowStockThreshold}
//                 onChange={(e) => handleChange("lowStockThreshold", e.target.value)}
//                 placeholder="10"
//               />
//             </div>
//           </div>

//           <div>
//             <Label htmlFor="description">Description</Label>
//             <Textarea
//               id="description"
//               value={formData.description}
//               onChange={(e) => handleChange("description", e.target.value)}
//               placeholder="Additional details about this variant..."
//               rows={3}
//             />
//           </div>

//           <div className="flex justify-end gap-2">
//             <Button type="button" variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button type="submit" disabled={loading}>
//               <Plus className="h-4 w-4 mr-2" />
//               {loading ? "Creating..." : "Create Sub-Product"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }
