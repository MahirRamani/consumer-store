"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Search, Trash2, Eye, EyeOff, Download } from "lucide-react"
import { toast } from "sonner"
import AddProductModal from "@/components/modals/add-product-modal"
import EditProductModal from "@/components/modals/edit-product-modal"
import type { Category, Product } from "@/lib/types"

interface CategoryResponse {
  categories: Category[]
}

interface ProductResponse {
  products?: Product[]
}

interface ProductUpdateData {
  name?: string
  description?: string
  categoryId?: string
  isActive?: boolean
  hasVariants?: boolean
}

export default function ProductsTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const queryClient = useQueryClient()

  const { data: productsData, isLoading } = useQuery<Product[] | ProductResponse>({
    queryKey: ["products", showInactive],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (showInactive) {
        params.append("includeInactive", "true")
      }
      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error("Failed to fetch products")
      return response.json()
    },
  })

  const { data: categoriesData } = useQuery<CategoryResponse>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json()
    },
  })

  // Extract arrays from API responses with debugging
  // Handle both array response and object with products property
  const products = Array.isArray(productsData) ? productsData : (productsData?.products || [])
  const categories = categoriesData?.categories || []

  // Debug logging
  console.log("Products data:", productsData)
  console.log("Products array:", products)
  console.log("Categories data:", categoriesData)
  console.log("Products length:", products.length)

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete product")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product deleted successfully.")
    },
    onError: () => {
      toast.error("Failed to delete product.")
    },
  })

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: ProductUpdateData }) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to update product")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product updated successfully.")
      setShowEditModal(false)
      setSelectedProduct(null)
    },
    onError: () => {
      toast.error("Failed to update product.")
    },
  })

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  const handleToggleActive = (productId: string, currentStatus: boolean) => {
    updateProductMutation.mutate({ productId, data: { isActive: !currentStatus } })
  }

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      deleteProductMutation.mutate(productId)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/products/export?format=csv")
      if (!response.ok) throw new Error("Failed to export")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `products-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Products exported successfully!")
    } catch (error) {
      toast.error("Failed to export products")
    }
  }

  const getCategoryIcon = (category: string) => {
    if (!category) return "📦"

    switch (category.toLowerCase()) {
      case "food":
        return "🍜"
      case "stationery":
        return "📚"
      case "daily use":
        return "🧴"
      case "pooja":
        return "🔥"
      default:
        return "📦"
    }
  }

  const getCategoryName = (product: any) => {
    // First try to use the direct category field if available
    if (product.category) {
      return product.category
    }
    
    // Fallback to looking up by categoryId
    const category = categories.find((cat) => cat.id === product.categoryId)
    return category?.name || "Uncategorized"
  }

  const filteredProducts = products.filter((product: any) => {
    console.log("Filtering product:", product)
    
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
    console.log("Search match:", matchesSearch, "for term:", searchTerm)
    
    let matchesCategory = true
    if (selectedCategory !== "all") {
      // Try to match by categoryId first, then by category name
      matchesCategory = product.categoryId === selectedCategory || 
                      product.category?.toLowerCase() === categories.find(c => c.id === selectedCategory)?.name?.toLowerCase()
    }
    console.log("Category match:", matchesCategory, "selected:", selectedCategory)
    
    const result = matchesSearch && matchesCategory
    console.log("Final filter result:", result)
    
    return result
  })

  console.log("Filtered products:", filteredProducts)

  if (isLoading) {
    return <div className="text-center py-8">Loading products...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
        <div className="flex space-x-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Total products loaded: {products.length}</p>
            <p>Filtered products: {filteredProducts.length}</p>
            <p>Search term: "{searchTerm}"</p>
            <p>Selected category: {selectedCategory}</p>
            <p>Show inactive: {showInactive.toString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Show Inactive Products</Label>
              <div className="flex items-center space-x-2 mt-3">
                <Switch checked={showInactive} onCheckedChange={setShowInactive} />
                <span className="text-sm text-gray-600">Include disabled products</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Products Inventory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {products.length === 0 ? "No products found." : "No products match your current filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product: any) => (
                    <tr key={product.id} className={!product.isActive ? "bg-gray-50 opacity-75" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                              product.isActive ? "bg-gray-100" : "bg-gray-200"
                            }`}
                          >
                            {getCategoryIcon(getCategoryName(product))}
                          </div>
                          <div className="ml-3">
                            <p className={`text-sm font-medium ${product.isActive ? "text-gray-900" : "text-gray-500"}`}>
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-500">{product.description || "No description"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {getCategoryName(product)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {product.hasVariants ? `${product.variantCount || 0} variants` : "No variants"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {new Date(product.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>                    
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={product.isActive ? "default" : "secondary"}
                          className={product.isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"}
                        >
                          {product.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(product.id, product.isActive)}
                            className={
                              product.isActive
                                ? "text-orange-500 hover:text-orange-600"
                                : "text-green-500 hover:text-green-600"
                            }
                            title={product.isActive ? "Disable Product" : "Enable Product"}
                          >
                            {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="text-purple-500 hover:text-purple-600"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="text-red-500 hover:text-red-600"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddProductModal open={showAddModal} onOpenChange={setShowAddModal} />
      <EditProductModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onConfirm={(data: ProductUpdateData) => updateProductMutation.mutate({ productId: selectedProduct?.id || '', data })}
        isLoading={updateProductMutation.isPending}
        product={selectedProduct}
      />
    </div>
  )
}// "use client"

// import { useState } from "react"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Switch } from "@/components/ui/switch"
// import { Plus, Edit, Search, Trash2, Eye, EyeOff, Download } from "lucide-react"
// import { toast } from "sonner"
// import AddProductModal from "@/components/modals/add-product-modal"
// import EditProductModal from "@/components/modals/edit-product-modal"
// import type { Category, Product } from "@/lib/types"

// interface CategoryResponse {
//   categories: Category[]
// }

// interface ProductResponse {
//   products: Product[]
// }

// interface ProductUpdateData {
//   name?: string
//   description?: string
//   categoryId?: string
//   isActive?: boolean
//   hasVariants?: boolean
// }

// export default function ProductsTab() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedCategory, setSelectedCategory] = useState<string>("all")
//   const [showInactive, setShowInactive] = useState(false)
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [showEditModal, setShowEditModal] = useState(false)
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
//   const queryClient = useQueryClient()

//   const { data: productsData, isLoading } = useQuery<ProductResponse>({
//     queryKey: ["products", showInactive],
//     queryFn: async () => {
//       const params = new URLSearchParams()
//       if (showInactive) {
//         params.append("includeInactive", "true")
//       }
//       const response = await fetch(`/api/products?${params}`)
//       if (!response.ok) throw new Error("Failed to fetch products")
//       return response.json()
//     },
//   })

//   const { data: categoriesData } = useQuery<CategoryResponse>({
//     queryKey: ["categories"],
//     queryFn: async () => {
//       const response = await fetch("/api/categories")
//       if (!response.ok) throw new Error("Failed to fetch categories")
//       return response.json()
//     },
//   })

//   // Extract arrays from API responses
//   const products = productsData?.products || []
//   const categories = categoriesData?.categories || []

//   const deleteProductMutation = useMutation({
//     mutationFn: async (productId: string) => {
//       const response = await fetch(`/api/products/${productId}`, {
//         method: "DELETE",
//       })
//       if (!response.ok) throw new Error("Failed to delete product")
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products"] })
//       toast.success("Product deleted successfully.")
//     },
//     onError: () => {
//       toast.error("Failed to delete product.")
//     },
//   })

//   const updateProductMutation = useMutation({
//     mutationFn: async ({ productId, data }: { productId: string; data: ProductUpdateData }) => {
//       const response = await fetch(`/api/products/${productId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       })
//       if (!response.ok) throw new Error("Failed to update product")
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products"] })
//       toast.success("Product updated successfully.")
//       setShowEditModal(false)
//       setSelectedProduct(null)
//     },
//     onError: () => {
//       toast.error("Failed to update product.")
//     },
//   })

//   const handleEditProduct = (product: Product) => {
//     setSelectedProduct(product)
//     setShowEditModal(true)
//   }

//   const handleToggleActive = (productId: string, currentStatus: boolean) => {
//     updateProductMutation.mutate({ productId, data: { isActive: !currentStatus } })
//   }

//   const handleDeleteProduct = (productId: string, productName: string) => {
//     if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
//       deleteProductMutation.mutate(productId)
//     }
//   }

//   const handleExport = async () => {
//     try {
//       const response = await fetch("/api/products/export?format=csv")
//       if (!response.ok) throw new Error("Failed to export")

//       const blob = await response.blob()
//       const url = window.URL.createObjectURL(blob)
//       const a = document.createElement("a")
//       a.href = url
//       a.download = `products-${new Date().toISOString().split("T")[0]}.csv`
//       document.body.appendChild(a)
//       a.click()
//       window.URL.revokeObjectURL(url)
//       document.body.removeChild(a)

//       toast.success("Products exported successfully!")
//     } catch (error) {
//       toast.error("Failed to export products")
//     }
//   }

//   const getCategoryIcon = (category: string) => {
//     if (!category) return "📦"

//     switch (category.toLowerCase()) {
//       case "food":
//         return "🍜"
//       case "stationery":
//         return "📚"
//       case "daily use":
//         return "🧴"
//       case "pooja":
//         return "🔥"
//       default:
//         return "📦"
//     }
//   }

//   const getCategoryName = (categoryId: string) => {
//     const category = categories.find((cat) => cat.id === categoryId)
//     return category?.name || "Uncategorized"
//   }

//   const filteredProducts = products.filter((product: Product) => {
//     const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory
//     return matchesSearch && matchesCategory
//   })

//   if (isLoading) {
//     return <div className="text-center py-8">Loading products...</div>
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
//         <div className="flex space-x-2">
//           <Button onClick={handleExport} variant="outline">
//             <Download className="w-4 h-4 mr-2" />
//             Export
//           </Button>
//           <Button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
//             <Plus className="w-4 h-4 mr-2" />
//             Add Product
//           </Button>
//         </div>
//       </div>

//       {/* Search and Filter */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Search Products</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Product name..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Category</Label>
//               <Select value={selectedCategory} onValueChange={setSelectedCategory}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Categories" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Categories</SelectItem>
//                   {categories.map((category) => (
//                     <SelectItem key={category.id} value={category.id}>
//                       {category.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Show Inactive Products</Label>
//               <div className="flex items-center space-x-2 mt-3">
//                 <Switch checked={showInactive} onCheckedChange={setShowInactive} />
//                 <span className="text-sm text-gray-600">Include disabled products</span>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Products List */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">Products Inventory</CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Product
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Category
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Variants
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Created At
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredProducts.map((product: Product) => (
//                   <tr key={product.id} className={!product.isActive ? "bg-gray-50 opacity-75" : ""}>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div
//                           className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
//                             product.isActive ? "bg-gray-100" : "bg-gray-200"
//                           }`}
//                         >
//                           {getCategoryIcon(getCategoryName(product.categoryId))}
//                         </div>
//                         <div className="ml-3">
//                           <p className={`text-sm font-medium ${product.isActive ? "text-gray-900" : "text-gray-500"}`}>
//                             {product.name}
//                           </p>
//                           <p className="text-sm text-gray-500">{product.description || "No description"}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
//                       {getCategoryName(product.categoryId)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       <Badge variant="outline" className="bg-blue-50 text-blue-700">
//                         {product.hasVariants ? `${product.variantCount || 0} variants` : "No variants"}
//                       </Badge>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
//                       {new Date(product.createdAt).toLocaleDateString('en-GB', {
//                         day: '2-digit',
//                         month: '2-digit',
//                         year: 'numeric'
//                       })}
//                     </td>                    
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <Badge
//                         variant={product.isActive ? "default" : "secondary"}
//                         className={product.isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"}
//                       >
//                         {product.isActive ? "Active" : "Disabled"}
//                       </Badge>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       <div className="flex space-x-2">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleToggleActive(product.id, product.isActive)}
//                           className={
//                             product.isActive
//                               ? "text-orange-500 hover:text-orange-600"
//                               : "text-green-500 hover:text-green-600"
//                           }
//                           title={product.isActive ? "Disable Product" : "Enable Product"}
//                         >
//                           {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleEditProduct(product)}
//                           className="text-purple-500 hover:text-purple-600"
//                           title="Edit Product"
//                         >
//                           <Edit className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleDeleteProduct(product.id, product.name)}
//                           className="text-red-500 hover:text-red-600"
//                           title="Delete Product"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </Button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       <AddProductModal open={showAddModal} onOpenChange={setShowAddModal} />
//       <EditProductModal
//         open={showEditModal}
//         onOpenChange={setShowEditModal}
//         onConfirm={(data: ProductUpdateData) => updateProductMutation.mutate({ productId: selectedProduct?.id || '', data })}
//         isLoading={updateProductMutation.isPending}
//         product={selectedProduct}
//       />
//     </div>
//   )
// }





// "use client"

// import { useState } from "react"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Switch } from "@/components/ui/switch"
// import { Plus, Edit, Package, Search, AlertTriangle, Trash2, Eye, EyeOff, Download } from "lucide-react"
// import { toast } from "sonner"
// import AddProductModal from "@/components/modals/add-product-modal"
// import UpdateStockModal from "@/components/modals/update-stock-modal"
// import EditProductModal from "@/components/modals/edit-product-modal"
// import type { CategoryResponse, Product, ProductResponse, ProductUpdateData } from "@/lib/types"

// export default function ProductsTab() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedCategory, setSelectedCategory] = useState<string>("all")
//   const [showInactive, setShowInactive] = useState(false)
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [showStockModal, setShowStockModal] = useState(false)
//   const [showEditModal, setShowEditModal] = useState(false)
//   const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
//   const queryClient = useQueryClient()

//   const { data: products = [], isLoading } = useQuery<ProductResponse[]>({
//     queryKey: ["products", showInactive],
//     queryFn: async () => {
//       const params = new URLSearchParams()
//       if (showInactive) {
//         params.append("includeInactive", "true")
//       }
//       const response = await fetch(`/api/products?${params}`)
//       if (!response.ok) throw new Error("Failed to fetch products")
//       return response.json()
//     },
//   })

//   const { data: categories = [] } = useQuery<CategoryResponse[]>({
//     queryKey: ["categories"],
//     queryFn: async () => {
//       const response = await fetch("/api/categories")
//       if (!response.ok) throw new Error("Failed to fetch categories")
//       return response.json()
//     },
//   })

//   const deleteProductMutation = useMutation({
//     mutationFn: async (productId: string) => {
//       const response = await fetch(`/api/products/${productId}`, {
//         method: "DELETE",
//       })
//       if (!response.ok) throw new Error("Failed to delete product")
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products"] })
//       toast.success("Product deleted successfully.")
//     },
//     onError: () => {
//       toast.error("Failed to delete product.")
//     },
//   })

//   const updateProductMutation = useMutation({
//     mutationFn: async ({ productId, data }: { productId: string; data: ProductUpdateData }) => {
//       const response = await fetch(`/api/products/${productId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       })
//       if (!response.ok) throw new Error("Failed to update product")
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products"] })
//       toast.success("Product updated successfully.")
//       setShowEditModal(false)
//       setSelectedProduct(null)
//     },
//     onError: () => {
//       toast.error("Failed to update product.")
//     },
//   })

//   const handleUpdateStock = (productId: string) => {
//     setSelectedProductId(productId)
//     setShowStockModal(true)
//   }

//   const handleEditProduct = (product: Product) => {
//     setSelectedProduct(product)
//     setShowEditModal(true)
//   }

//   const handleToggleActive = (productId: string, currentStatus: boolean) => {
//     updateProductMutation.mutate({ productId, data: { isActive: !currentStatus } })
//   }

//   const handleDeleteProduct = (productId: string, productName: string) => {
//     if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
//       deleteProductMutation.mutate(productId)
//     }
//   }

//   const handleExport = async () => {
//     try {
//       const response = await fetch("/api/products/export?format=csv")
//       if (!response.ok) throw new Error("Failed to export")

//       const blob = await response.blob()
//       const url = window.URL.createObjectURL(blob)
//       const a = document.createElement("a")
//       a.href = url
//       a.download = `products-${new Date().toISOString().split("T")[0]}.csv`
//       document.body.appendChild(a)
//       a.click()
//       window.URL.revokeObjectURL(url)
//       document.body.removeChild(a)

//       toast.success("Products exported successfully!")
//     } catch (error) {
//       toast.error("Failed to export products")
//     }
//   }

//   const getCategoryIcon = (category: string) => {
//     if (!category) return "📦"

//     switch (category.toLowerCase()) {
//       case "food":
//         return "🍜"
//       case "stationery":
//         return "📚"
//       case "daily-use":
//         return "🧴"
//       case "pooja":
//         return "🔥"
//       default:
//         return "📦"
//     }
//   }

//   const getCategoryName = (categoryId: string) => {
//     const category = categories.find((cat: any) => cat.id === categoryId)
//     return category?.name || "Uncategorized"
//   }

//   const filteredProducts = products.filter((product: Product) => {
//     const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory
//     return matchesSearch && matchesCategory
//   })

//   if (isLoading) {
//     return <div className="text-center py-8">Loading products...</div>
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
//         <div className="flex space-x-2">
//           <Button onClick={handleExport} variant="outline">
//             <Download className="w-4 h-4 mr-2" />
//             Export
//           </Button>
//           <Button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
//             <Plus className="w-4 h-4 mr-2" />
//             Add Product
//           </Button>
//         </div>
//       </div>

//       {/* Search and Filter */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Search Products</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Product name..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Category</Label>
//               <Select value={selectedCategory} onValueChange={setSelectedCategory}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Categories" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Categories</SelectItem>
//                   {categories?.map((category: any) => (
//                     <SelectItem key={category.id || category._id} value={category.id || category._id}>
//                       {category.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Show Inactive Products</Label>
//               <div className="flex items-center space-x-2 mt-3">
//                 <Switch checked={showInactive} onCheckedChange={setShowInactive} />
//                 <span className="text-sm text-gray-600">Include disabled products</span>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Products List */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">Products Inventory</CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Product
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Category
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Created At
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredProducts.map((product: Product) => (
//                   <tr key={product.id} className={!product.isActive ? "bg-gray-50 opacity-75" : ""}>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div
//                           className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
//                             product.isActive ? "bg-gray-100" : "bg-gray-200"
//                           }`}
//                         >
//                           {getCategoryIcon(getCategoryName(product.categoryId))}
//                         </div>
//                         <div className="ml-3">
//                           <p className={`text-sm font-medium ${product.isActive ? "text-gray-900" : "text-gray-500"}`}>
//                             {product.name}
//                           </p>
//                           <p className="text-sm text-gray-500">{product.description || "No description"}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
//                       {getCategoryName(product.categoryId)}
//                     </td>                    
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
//                       {new Date(product.createdAt).toLocaleDateString('en-GB', {
//                         day: '2-digit',
//                         month: '2-digit',
//                         year: 'numeric'
//                       }) || "🤔?"}
//                     </td>                    
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <Badge
//                         variant={product.isActive ? "default" : "secondary"}
//                         className={product.isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"}
//                       >
//                         {product.isActive ? "Active" : "Disabled"}
//                       </Badge>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       <div className="flex space-x-2">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleUpdateStock(product.id)}
//                           className="text-blue-500 hover:text-blue-600"
//                           disabled={!product.isActive}
//                           title="Update Stock"
//                         >
//                           <Package className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleToggleActive(product.id, product.isActive)}
//                           className={
//                             product.isActive
//                               ? "text-orange-500 hover:text-orange-600"
//                               : "text-green-500 hover:text-green-600"
//                           }
//                           title={product.isActive ? "Disable Product" : "Enable Product"}
//                         >
//                           {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleEditProduct(product)}
//                           className="text-purple-500 hover:text-purple-600"
//                           title="Edit Product"
//                         >
//                           <Edit className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleDeleteProduct(product.id, product.name)}
//                           className="text-red-500 hover:text-red-600"
//                           title="Delete Product"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </Button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       <AddProductModal open={showAddModal} onOpenChange={setShowAddModal} />
//       <UpdateStockModal open={showStockModal} onOpenChange={setShowStockModal} productId={selectedProductId} />
//       // Replace the onConfirm prop
//       <EditProductModal
//         open={showEditModal}
//         onOpenChange={setShowEditModal}
//         onConfirm={(data: ProductUpdateData) => updateProductMutation.mutate({ productId: selectedProduct?.id || '', data })}
//         isLoading={updateProductMutation.isPending}
//         product={selectedProduct}
//       />
//     </div>
//   )
// }