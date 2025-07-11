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
import { Plus, Edit, Package, Search, AlertTriangle, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import AddProductModal from "@/components/modals/add-product-modal"
import EditProductModal from "@/components/modals/edit-product-modal"
import UpdateStockModal from "@/components/modals/update-stock-modal"

import type { Product, EditProduct } from "@/lib/types"

export default function ProductsTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const queryClient = useQueryClient()

  const { data: products, isLoading } = useQuery({
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

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json()
    },
  })

  const editProductMutation = useMutation({
  mutationFn: async (data: {
    name: string
    categoryId: string
    price: number
    stock: number
    lowStockThreshold: number
    barcode?: string
    description?: string
  }) => {
    const response = await fetch(`/api/products/${selectedProduct?.id}`, {
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

const handleConfirmEdit = (data: {
  name: string
  categoryId: string
  price: number
  stock: number
  lowStockThreshold: number
  barcode?: string
  description?: string
}) => {
  editProductMutation.mutate(data)
}

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
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      if (!response.ok) throw new Error("Failed to update product")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product updated successfully.")
    },
    onError: () => {
      toast.error("Failed to update product.")
    },
  })

  const handleUpdateStock = (productId: string) => {
    setSelectedProductId(productId)
    setShowStockModal(true)
  }

  const handleToggleActive = (productId: string, currentStatus: boolean) => {
    updateProductMutation.mutate({ productId, isActive: !currentStatus })
  }

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      deleteProductMutation.mutate(productId)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "food":
        return "🍜"
      case "stationery":
        return "📚"
      case "daily-use":
        return "🧴"
      case "pooja":
        return "🔥"
      default:
        return "📦"
    }
  }

  const filteredProducts = products?.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading products...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

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
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id || category._id} value={category.name}>
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
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
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
                {filteredProducts?.map((product: Product) => (
                  <tr key={product.id} className={!product.isActive ? "bg-gray-50 opacity-75" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                            product.isActive ? "bg-gray-100" : "bg-gray-200"
                          }`}
                        >
                          {getCategoryIcon(product.category)}
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
                      {product.category?.replace("-", " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₹{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`text-sm font-medium ${
                            product.stock <= product.lowStockThreshold ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {product.stock}
                        </span>
                        {product.stock <= product.lowStockThreshold && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />
                        )}
                      </div>
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
                          onClick={() => handleUpdateStock(product.id)}
                          className="text-blue-500 hover:text-blue-600"
                          disabled={!product.isActive}
                          title="Update Stock"
                        >
                          <Package className="w-4 h-4" />
                        </Button>
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
        </CardContent>
      </Card>

      <AddProductModal open={showAddModal} onOpenChange={setShowAddModal} />

      <EditProductModal
  open={showEditModal}
  onOpenChange={setShowEditModal}
  onConfirm={handleConfirmEdit}
  isLoading={editProductMutation.isPending}
  product={selectedProduct}
/>

      <UpdateStockModal open={showStockModal} onOpenChange={setShowStockModal} productId={selectedProductId} />
    </div>
  )
}


// "use client"

// import { useState } from "react"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Plus, Edit, Package, Search, AlertTriangle, Trash2 } from "lucide-react"
// import { toast } from "sonner"
// import AddProductModal from "@/components/modals/add-product-modal"
// import UpdateStockModal from "@/components/modals/update-stock-modal"
// import type { Product } from "@/lib/types"

// export default function ProductsTab() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedCategory, setSelectedCategory] = useState<string>("all")
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [showStockModal, setShowStockModal] = useState(false)
//   const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
//   const queryClient = useQueryClient()

//   const { data: products, isLoading } = useQuery({
//     queryKey: ["products"],
//     queryFn: async () => {
//       const response = await fetch("/api/products")
//       if (!response.ok) throw new Error("Failed to fetch products")
//       return response.json()
//     },
//   })

//   const { data: categories } = useQuery({
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
//     mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
//       const response = await fetch(`/api/products/${productId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ isActive }),
//       })
//       if (!response.ok) throw new Error("Failed to update product")
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products"] })
//       toast.success("Product updated successfully.")
//     },
//     onError: () => {
//       toast.error("Failed to update product.")
//     },
//   })

//   const handleUpdateStock = (productId: string) => {
//     setSelectedProductId(productId)
//     setShowStockModal(true)
//   }

//   const handleToggleActive = (productId: string, currentStatus: boolean) => {
//     updateProductMutation.mutate({ productId, isActive: !currentStatus })
//   }

//   const handleDeleteProduct = (productId: string, productName: string) => {
//     if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
//       deleteProductMutation.mutate(productId)
//     }
//   }

//   const getCategoryIcon = (category: string) => {
//     switch (category) {
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

//   const filteredProducts = products?.filter((product: Product) => {
//     const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
//     return matchesSearch && matchesCategory
//   })

//   if (isLoading) {
//     return <div className="text-center py-8">Loading products...</div>
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
//         <Button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
//           <Plus className="w-4 h-4 mr-2" />
//           Add Product
//         </Button>
//       </div>

//       {/* Search and Filter */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
//                     <SelectItem key={category.id} value={category.name}>
//                       {category.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
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
//                     Price
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Stock
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
//                 {filteredProducts?.map((product: Product) => (
//                   <tr key={product.id}>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="bg-gray-100 w-10 h-10 rounded-lg flex items-center justify-center text-lg">
//                           {getCategoryIcon(product.category)}
//                         </div>
//                         <div className="ml-3">
//                           <p className="text-sm font-medium text-gray-900">{product.name}</p>
//                           <p className="text-sm text-gray-500">{product.description || "No description"}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
//                       {product.category.replace("-", " ")}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
//                       ₹{product.price.toFixed(2)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <span
//                           className={`text-sm font-medium ${product.stock <= product.lowStockThreshold ? "text-red-600" : "text-gray-900"}`}
//                         >
//                           {product.stock}
//                         </span>
//                         {product.stock <= product.lowStockThreshold && (
//                           <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <Badge
//                         variant={product.isActive ? "default" : "secondary"}
//                         className={product.isActive ? "bg-green-500 hover:bg-green-600" : ""}
//                       >
//                         {product.isActive ? "Active" : "Inactive"}
//                       </Badge>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       <div className="flex space-x-2">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleUpdateStock(product.id)}
//                           className="text-blue-500 hover:text-blue-600"
//                         >
//                           <Package className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleToggleActive(product.id, product.isActive)}
//                           className="text-purple-500 hover:text-purple-600"
//                         >
//                           <Edit className="w-4 h-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleDeleteProduct(product.id, product.name)}
//                           className="text-red-500 hover:text-red-600"
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
//     </div>
//   )
// }




// // "use client"

// // import { useState } from "react"
// // import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// // import { Button } from "@/components/ui/button"
// // import { Input } from "@/components/ui/input"
// // import { Label } from "@/components/ui/label"
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// // import { Badge } from "@/components/ui/badge"
// // import { Plus, Edit, Package, Search, AlertTriangle } from "lucide-react"
// // import { toast } from "sonner"
// // import AddProductModal from "@/components/modals/add-product-modal"
// // import UpdateStockModal from "@/components/modals/update-stock-modal"
// // import type { Product } from "@/lib/types"

// // export default function ProductsTab() {
// //   const [searchTerm, setSearchTerm] = useState("")
// //   const [selectedCategory, setSelectedCategory] = useState<string>("all")
// //   const [showAddModal, setShowAddModal] = useState(false)
// //   const [showStockModal, setShowStockModal] = useState(false)
// //   const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
// //   const queryClient = useQueryClient()

// //   const { data: products, isLoading } = useQuery({
// //     queryKey: ["products"],
// //     queryFn: async () => {
// //       const response = await fetch("/api/products")
// //       if (!response.ok) throw new Error("Failed to fetch products")
// //       return response.json()
// //     },
// //   })

// //   const updateProductMutation = useMutation({
// //     mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
// //       const response = await fetch(`/api/products/${productId}`, {
// //         method: "PATCH",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ isActive }),
// //       })
// //       if (!response.ok) throw new Error("Failed to update product")
// //       return response.json()
// //     },
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ["products"] })
// //       toast.success("Product updated successfully.")
// //     },
// //     onError: () => {
// //       toast.error("Failed to update product.")
// //     },
// //   })

// //   const handleUpdateStock = (productId: string) => {
// //     setSelectedProductId(productId)
// //     setShowStockModal(true)
// //   }

// //   const handleToggleActive = (productId: string, currentStatus: boolean) => {
// //     updateProductMutation.mutate({ productId, isActive: !currentStatus })
// //   }

// //   const getCategoryIcon = (category: string) => {
// //     switch (category) {
// //       case "food":
// //         return "🍜"
// //       case "stationery":
// //         return "📚"
// //       case "daily-use":
// //         return "🧴"
// //       case "pooja":
// //         return "🔥"
// //       default:
// //         return "📦"
// //     }
// //   }

// //   const filteredProducts = products?.filter((product: Product) => {
// //     const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
// //     const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
// //     return matchesSearch && matchesCategory
// //   })

// //   if (isLoading) {
// //     return <div className="text-center py-8">Loading products...</div>
// //   }

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex justify-between items-center">
// //         <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
// //         <Button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
// //           <Plus className="w-4 h-4 mr-2" />
// //           Add Product
// //         </Button>
// //       </div>

// //       {/* Search and Filter */}
// //       <Card>
// //         <CardContent className="p-6">
// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //             <div>
// //               <Label className="block text-sm font-medium text-gray-700 mb-2">Search Products</Label>
// //               <div className="relative">
// //                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
// //                 <Input
// //                   placeholder="Product name..."
// //                   value={searchTerm}
// //                   onChange={(e) => setSearchTerm(e.target.value)}
// //                   className="pl-10"
// //                 />
// //               </div>
// //             </div>
// //             <div>
// //               <Label className="block text-sm font-medium text-gray-700 mb-2">Category</Label>
// //               <Select value={selectedCategory} onValueChange={setSelectedCategory}>
// //                 <SelectTrigger>
// //                   <SelectValue placeholder="All Categories" />
// //                 </SelectTrigger>
// //                 <SelectContent>
// //                   <SelectItem value="all">All Categories</SelectItem>
// //                   <SelectItem value="food">Food</SelectItem>
// //                   <SelectItem value="stationery">Stationery</SelectItem>
// //                   <SelectItem value="daily-use">Daily Use</SelectItem>
// //                   <SelectItem value="pooja">Pooja</SelectItem>
// //                 </SelectContent>
// //               </Select>
// //             </div>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Products List */}
// //       <Card>
// //         <CardHeader>
// //           <CardTitle className="text-lg font-semibold text-gray-900">Products Inventory</CardTitle>
// //         </CardHeader>
// //         <CardContent className="p-0">
// //           <div className="overflow-x-auto">
// //             <table className="w-full">
// //               <thead className="bg-gray-50">
// //                 <tr>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Product
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Category
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Price
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Stock
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Status
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Actions
// //                   </th>
// //                 </tr>
// //               </thead>
// //               <tbody className="bg-white divide-y divide-gray-200">
// //                 {filteredProducts?.map((product: Product) => (
// //                   <tr key={product.id}>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <div className="flex items-center">
// //                         <div className="bg-gray-100 w-10 h-10 rounded-lg flex items-center justify-center text-lg">
// //                           {getCategoryIcon(product.category)}
// //                         </div>
// //                         <div className="ml-3">
// //                           <p className="text-sm font-medium text-gray-900">{product.name}</p>
// //                           <p className="text-sm text-gray-500">{product.description || "No description"}</p>
// //                         </div>
// //                       </div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
// //                       {product.category.replace("-", " ")}
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
// //                       ₹{product.price.toFixed(2)}
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <div className="flex items-center">
// //                         <span
// //                           className={`text-sm font-medium ${product.stock <= product.lowStockThreshold ? "text-red-600" : "text-gray-900"}`}
// //                         >
// //                           {product.stock}
// //                         </span>
// //                         {product.stock <= product.lowStockThreshold && (
// //                           <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />
// //                         )}
// //                       </div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <Badge
// //                         variant={product.isActive ? "default" : "secondary"}
// //                         className={product.isActive ? "bg-green-500 hover:bg-green-600" : ""}
// //                       >
// //                         {product.isActive ? "Active" : "Inactive"}
// //                       </Badge>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                       <div className="flex space-x-2">
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           onClick={() => handleUpdateStock(product.id)}
// //                           className="text-blue-500 hover:text-blue-600"
// //                         >
// //                           <Package className="w-4 h-4" />
// //                         </Button>
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           onClick={() => handleToggleActive(product.id, product.isActive)}
// //                           className="text-purple-500 hover:text-purple-600"
// //                         >
// //                           <Edit className="w-4 h-4" />
// //                         </Button>
// //                       </div>
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       <AddProductModal open={showAddModal} onOpenChange={setShowAddModal} />

// //       <UpdateStockModal open={showStockModal} onOpenChange={setShowStockModal} productId={selectedProductId} />
// //     </div>
// //   )
// // }
