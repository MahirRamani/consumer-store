"use client"

import { useState, useMemo, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, AlertTriangle, Trash2, Eye, EyeOff, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import AddSubProductModal from "@/components/modals/add-sub-product-modal"
import type { SubProduct } from "@/lib/types"

// Types for better type safety
interface Product {
  id: string
  name: string
}

interface FilterState {
  searchTerm: string
  selectedProduct: string
  showInactive: boolean
}

// API Response interface
interface SubProductsApiResponse {
  subProducts: SubProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function SubProductsTab() {
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: "",
    selectedProduct: "all",
    showInactive: false
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const queryClient = useQueryClient()

  // Fetch sub-products with proper error handling and loading states
  const { 
    data: subProducts = [], 
    isLoading: isSubProductsLoading, 
    error: subProductsError,
    isError: isSubProductsError 
  } = useQuery({
    queryKey: ["sub-products", filterState.showInactive],
    queryFn: async (): Promise<SubProduct[]> => {
      const params = new URLSearchParams()
      if (filterState.showInactive) {
        params.append("includeInactive", "true")
      }
      
      const response = await fetch(`/api/sub-products?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch sub-products: ${response.status} ${response.statusText}`)
      }
      
      const data: SubProductsApiResponse = await response.json()
      
      // Handle the API response structure
      if (data && Array.isArray(data.subProducts)) {
        return data.subProducts
      }
      
      // Fallback: if the response is already an array (for backward compatibility)
      if (Array.isArray(data)) {
        return data
      }
      
      console.warn("Unexpected API response structure:", data)
      return []
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch products for filtering
  const { 
    data: products = [], 
    isLoading: isProductsLoading,
    error: productsError 
  } = useQuery({
    queryKey: ["products-for-filter"],
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes - products change less frequently
  })

  // Optimized mutations with better error handling
  const deleteSubProductMutation = useMutation({
    mutationFn: async (subProductId: string): Promise<void> => {
      const response = await fetch(`/api/sub-products/${subProductId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to delete sub-product: ${response.status}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-products"] })
      toast.success("Sub-product deleted successfully.")
    },
    onError: (error: Error) => {
      console.error("Delete sub-product error:", error)
      toast.error(`Failed to delete sub-product: ${error.message}`)
    },
  })

  const updateSubProductMutation = useMutation({
    mutationFn: async ({ subProductId, data }: { subProductId: string; data: Partial<SubProduct> }): Promise<SubProduct> => {
      const response = await fetch(`/api/sub-products/${subProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to update sub-product: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-products"] })
      toast.success("Sub-product updated successfully.")
    },
    onError: (error: Error) => {
      console.error("Update sub-product error:", error)
      toast.error(`Failed to update sub-product: ${error.message}`)
    },
  })

  // Memoized product name lookup for better performance
  const productNameMap = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.id] = product.name
      return acc
    }, {} as Record<string, string>)
  }, [products])

  const getProductName = useCallback((productId: string): string => {
    return productNameMap[productId] || "Unknown Product"
  }, [productNameMap])

  // Optimized filtering with useMemo to prevent unnecessary re-renders
  const filteredSubProducts = useMemo(() => {
    if (!Array.isArray(subProducts)) {
      console.warn("subProducts is not an array:", subProducts)
      return []
    }

    return subProducts.filter((subProduct: SubProduct) => {
      if (!subProduct) return false

      const searchTerm = filterState.searchTerm.toLowerCase().trim()
      const matchesSearch = !searchTerm || 
        subProduct.name?.toLowerCase().includes(searchTerm) ||
        subProduct.size?.toLowerCase().includes(searchTerm) ||
        subProduct.description?.toLowerCase().includes(searchTerm)

      const matchesProduct = filterState.selectedProduct === "all" || 
        subProduct.productId === filterState.selectedProduct

      return matchesSearch && matchesProduct
    })
  }, [subProducts, filterState])

  // Memoized handlers to prevent unnecessary re-renders
  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilterState(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleToggleActive = useCallback((subProductId: string, currentStatus: boolean) => {
    updateSubProductMutation.mutate({ 
      subProductId, 
      data: { isActive: !currentStatus } 
    })
  }, [updateSubProductMutation])

  const handleDeleteSubProduct = useCallback((subProductId: string, subProductName: string) => {
    if (window.confirm(`Are you sure you want to delete "${subProductName}"? This action cannot be undone.`)) {
      deleteSubProductMutation.mutate(subProductId)
    }
  }, [deleteSubProductMutation])

  const handleExport = useCallback(async () => {
    try {
      const response = await fetch("/api/sub-products/export?format=csv")
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sub-products-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)

      toast.success("Sub-products exported successfully!")
    } catch (error) {
      console.error("Export error:", error)
      toast.error(`Failed to export sub-products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // Loading state
  const isLoading = isSubProductsLoading || isProductsLoading

  // Error state
  if (isSubProductsError) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Sub-Products</h3>
          <p className="text-gray-600 mb-4">
            {subProductsError instanceof Error ? subProductsError.message : 'An unknown error occurred'}
          </p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["sub-products"] })}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading sub-products...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sub-Products Management</h2>
          <p className="text-gray-600 mt-1">
            {filteredSubProducts.length} of {subProducts.length} sub-products
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleExport} 
            variant="outline"
            disabled={subProducts.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)} 
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sub-Product
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Search Sub-Products
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Name, size, or description..."
                  value={filterState.searchTerm}
                  onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Product
              </Label>
              <Select 
                value={filterState.selectedProduct} 
                onValueChange={(value) => handleFilterChange("selectedProduct", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {productsError && (
                <p className="text-xs text-red-500 mt-1">Failed to load products</p>
              )}
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Show Inactive
              </Label>
              <div className="flex items-center space-x-2 mt-3">
                <Switch 
                  checked={filterState.showInactive} 
                  onCheckedChange={(checked) => handleFilterChange("showInactive", checked)} 
                />
                <span className="text-sm text-gray-600">Include disabled variants</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Sub-Products Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sub-products found</h3>
              <p className="text-gray-500 mb-4">
                {subProducts.length === 0 
                  ? "Get started by adding your first sub-product."
                  : "Try adjusting your search or filters."
                }
              </p>
              {subProducts.length === 0 && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sub-Product
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sub-Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size/Weight
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
                  {filteredSubProducts.map((subProduct: SubProduct) => (
                    <tr 
                      key={subProduct.id} 
                      className={!subProduct.isActive ? "bg-gray-50 opacity-75" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                              subProduct.isActive ? "bg-gray-100" : "bg-gray-200"
                            }`}
                          >
                            📦
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                subProduct.isActive ? "text-gray-900" : "text-gray-500"
                              }`}
                            >
                              {subProduct.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {subProduct.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subProduct.parentProduct?.name || getProductName(subProduct.productId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{subProduct.size}</span>
                          {subProduct.weight && (
                            <div className="text-gray-500">{subProduct.weight}</div>
                          )}
                          {subProduct.volume && (
                            <div className="text-gray-500">{subProduct.volume}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{subProduct.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`text-sm font-medium ${
                              subProduct.stock <= subProduct.lowStockThreshold 
                                ? "text-red-600" 
                                : "text-gray-900"
                            }`}
                          >
                            {subProduct.stock}
                          </span>
                          {subProduct.stock <= subProduct.lowStockThreshold && (
                            <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={subProduct.isActive ? "default" : "secondary"}
                          className={
                            subProduct.isActive 
                              ? "bg-green-500 hover:bg-green-600" 
                              : "bg-gray-400"
                          }
                        >
                          {subProduct.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(subProduct.id, subProduct.isActive)}
                            disabled={updateSubProductMutation.isPending}
                            className={
                              subProduct.isActive
                                ? "text-orange-500 hover:text-orange-600"
                                : "text-green-500 hover:text-green-600"
                            }
                            title={subProduct.isActive ? "Disable Sub-Product" : "Enable Sub-Product"}
                          >
                            {updateSubProductMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : subProduct.isActive ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubProduct(subProduct.id, subProduct.name)}
                            disabled={deleteSubProductMutation.isPending}
                            className="text-red-500 hover:text-red-600"
                            title="Delete Sub-Product"
                          >
                            {deleteSubProductMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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

      <AddSubProductModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  )
}

// "use client"

// import { useState, useMemo, useCallback } from "react"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Switch } from "@/components/ui/switch"
// import { Plus, Search, AlertTriangle, Trash2, Eye, EyeOff, Download, Loader2 } from "lucide-react"
// import { toast } from "sonner"
// import AddSubProductModal from "@/components/modals/add-sub-product-modal"
// import type { SubProduct } from "@/lib/types"

// // Types for better type safety
// interface Product {
//   id: string
//   name: string
// }

// interface FilterState {
//   searchTerm: string
//   selectedProduct: string
//   showInactive: boolean
// }

// export default function SubProductsTab() {
//   const [filterState, setFilterState] = useState<FilterState>({
//     searchTerm: "",
//     selectedProduct: "all",
//     showInactive: false
//   })
//   const [showAddModal, setShowAddModal] = useState(false)
//   const queryClient = useQueryClient()

//   // Fetch sub-products with proper error handling and loading states
//   const { 
//     data: subProducts = [], 
//     isLoading: isSubProductsLoading, 
//     error: subProductsError,
//     isError: isSubProductsError 
//   } = useQuery({
//     queryKey: ["sub-products", filterState.showInactive],
//     queryFn: async (): Promise<SubProduct[]> => {
//       const params = new URLSearchParams()
//       if (filterState.showInactive) {
//         params.append("includeInactive", "true")
//       }
      
//       const response = await fetch(`/api/sub-products?${params}`)
//       if (!response.ok) {
//         throw new Error(`Failed to fetch sub-products: ${response.status} ${response.statusText}`)
//       }
      
//       const data = await response.json()
//       // Ensure we always return an array
//       return Array.isArray(data) ? data : []
//     },
//     retry: 2,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     gcTime: 10 * 60 * 1000, // 10 minutes
//   })

//   // Fetch products for filtering
//   const { 
//     data: products = [], 
//     isLoading: isProductsLoading,
//     error: productsError 
//   } = useQuery({
//     queryKey: ["products-for-filter"],
//     queryFn: async (): Promise<Product[]> => {
//       const response = await fetch("/api/products")
//       if (!response.ok) {
//         throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
//       }
      
//       const data = await response.json()
//       return Array.isArray(data) ? data : []
//     },
//     retry: 2,
//     staleTime: 10 * 60 * 1000, // 10 minutes - products change less frequently
//   })

//   // Optimized mutations with better error handling
//   const deleteSubProductMutation = useMutation({
//     mutationFn: async (subProductId: string): Promise<void> => {
//       const response = await fetch(`/api/sub-products/${subProductId}`, {
//         method: "DELETE",
//       })
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}))
//         throw new Error(errorData.message || `Failed to delete sub-product: ${response.status}`)
//       }
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["sub-products"] })
//       toast.success("Sub-product deleted successfully.")
//     },
//     onError: (error: Error) => {
//       console.error("Delete sub-product error:", error)
//       toast.error(`Failed to delete sub-product: ${error.message}`)
//     },
//   })

//   const updateSubProductMutation = useMutation({
//     mutationFn: async ({ subProductId, data }: { subProductId: string; data: Partial<SubProduct> }): Promise<SubProduct> => {
//       const response = await fetch(`/api/sub-products/${subProductId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       })
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}))
//         throw new Error(errorData.message || `Failed to update sub-product: ${response.status}`)
//       }
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["sub-products"] })
//       toast.success("Sub-product updated successfully.")
//     },
//     onError: (error: Error) => {
//       console.error("Update sub-product error:", error)
//       toast.error(`Failed to update sub-product: ${error.message}`)
//     },
//   })

//   // Memoized product name lookup for better performance
//   const productNameMap = useMemo(() => {
//     return products.reduce((acc, product) => {
//       acc[product.id] = product.name
//       return acc
//     }, {} as Record<string, string>)
//   }, [products])

//   const getProductName = useCallback((productId: string): string => {
//     return productNameMap[productId] || "Unknown Product"
//   }, [productNameMap])

//   // Optimized filtering with useMemo to prevent unnecessary re-renders
//   const filteredSubProducts = useMemo(() => {
//     if (!Array.isArray(subProducts)) {
//       console.warn("subProducts is not an array:", subProducts)
//       return []
//     }

//     return subProducts.filter((subProduct: SubProduct) => {
//       if (!subProduct) return false

//       const searchTerm = filterState.searchTerm.toLowerCase().trim()
//       const matchesSearch = !searchTerm || 
//         subProduct.name?.toLowerCase().includes(searchTerm) ||
//         subProduct.size?.toLowerCase().includes(searchTerm) ||
//         subProduct.description?.toLowerCase().includes(searchTerm)

//       const matchesProduct = filterState.selectedProduct === "all" || 
//         subProduct.productId === filterState.selectedProduct

//       return matchesSearch && matchesProduct
//     })
//   }, [subProducts, filterState])

//   // Memoized handlers to prevent unnecessary re-renders
//   const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
//     setFilterState(prev => ({ ...prev, [key]: value }))
//   }, [])

//   const handleToggleActive = useCallback((subProductId: string, currentStatus: boolean) => {
//     updateSubProductMutation.mutate({ 
//       subProductId, 
//       data: { isActive: !currentStatus } 
//     })
//   }, [updateSubProductMutation])

//   const handleDeleteSubProduct = useCallback((subProductId: string, subProductName: string) => {
//     if (window.confirm(`Are you sure you want to delete "${subProductName}"? This action cannot be undone.`)) {
//       deleteSubProductMutation.mutate(subProductId)
//     }
//   }, [deleteSubProductMutation])

//   const handleExport = useCallback(async () => {
//     try {
//       const response = await fetch("/api/sub-products/export?format=csv")
//       if (!response.ok) {
//         throw new Error(`Export failed: ${response.status} ${response.statusText}`)
//       }

//       const blob = await response.blob()
//       const url = window.URL.createObjectURL(blob)
//       const a = document.createElement("a")
//       a.href = url
//       a.download = `sub-products-${new Date().toISOString().split("T")[0]}.csv`
//       document.body.appendChild(a)
//       a.click()
      
//       // Cleanup
//       setTimeout(() => {
//         window.URL.revokeObjectURL(url)
//         document.body.removeChild(a)
//       }, 100)

//       toast.success("Sub-products exported successfully!")
//     } catch (error) {
//       console.error("Export error:", error)
//       toast.error(`Failed to export sub-products: ${error instanceof Error ? error.message : 'Unknown error'}`)
//     }
//   }, [])

//   // Loading state
//   const isLoading = isSubProductsLoading || isProductsLoading

//   // Error state
//   if (isSubProductsError) {
//     return (
//       <Card className="p-8">
//         <div className="text-center">
//           <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Sub-Products</h3>
//           <p className="text-gray-600 mb-4">
//             {subProductsError instanceof Error ? subProductsError.message : 'An unknown error occurred'}
//           </p>
//           <Button 
//             onClick={() => queryClient.invalidateQueries({ queryKey: ["sub-products"] })}
//             variant="outline"
//           >
//             Try Again
//           </Button>
//         </div>
//       </Card>
//     )
//   }

//   if (isLoading) {
//     return (
//       <Card className="p-8">
//         <div className="text-center">
//           <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
//           <p className="text-gray-600">Loading sub-products...</p>
//         </div>
//       </Card>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Sub-Products Management</h2>
//           <p className="text-gray-600 mt-1">
//             {filteredSubProducts.length} of {subProducts.length} sub-products
//           </p>
//         </div>
//         <div className="flex space-x-2">
//           <Button 
//             onClick={handleExport} 
//             variant="outline"
//             disabled={subProducts.length === 0}
//           >
//             <Download className="w-4 h-4 mr-2" />
//             Export
//           </Button>
//           <Button 
//             onClick={() => setShowAddModal(true)} 
//             className="bg-blue-500 hover:bg-blue-600 text-white"
//           >
//             <Plus className="w-4 h-4 mr-2" />
//             Add Sub-Product
//           </Button>
//         </div>
//       </div>

//       {/* Search and Filter */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">
//                 Search Sub-Products
//               </Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Name, size, or description..."
//                   value={filterState.searchTerm}
//                   onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">
//                 Parent Product
//               </Label>
//               <Select 
//                 value={filterState.selectedProduct} 
//                 onValueChange={(value) => handleFilterChange("selectedProduct", value)}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Products" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Products</SelectItem>
//                   {products.map((product) => (
//                     <SelectItem key={product.id} value={product.id}>
//                       {product.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               {productsError && (
//                 <p className="text-xs text-red-500 mt-1">Failed to load products</p>
//               )}
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">
//                 Show Inactive
//               </Label>
//               <div className="flex items-center space-x-2 mt-3">
//                 <Switch 
//                   checked={filterState.showInactive} 
//                   onCheckedChange={(checked) => handleFilterChange("showInactive", checked)} 
//                 />
//                 <span className="text-sm text-gray-600">Include disabled variants</span>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Sub-Products List */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">
//             Sub-Products Inventory
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           {filteredSubProducts.length === 0 ? (
//             <div className="text-center py-12">
//               <div className="text-gray-400 mb-4">📦</div>
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No sub-products found</h3>
//               <p className="text-gray-500 mb-4">
//                 {subProducts.length === 0 
//                   ? "Get started by adding your first sub-product."
//                   : "Try adjusting your search or filters."
//                 }
//               </p>
//               {subProducts.length === 0 && (
//                 <Button 
//                   onClick={() => setShowAddModal(true)}
//                   className="bg-blue-500 hover:bg-blue-600 text-white"
//                 >
//                   <Plus className="w-4 h-4 mr-2" />
//                   Add Sub-Product
//                 </Button>
//               )}
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Sub-Product
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Parent Product
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Size/Weight
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Price
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Stock
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Status
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredSubProducts.map((subProduct: SubProduct) => (
//                     <tr 
//                       key={subProduct.id} 
//                       className={!subProduct.isActive ? "bg-gray-50 opacity-75" : ""}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div
//                             className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
//                               subProduct.isActive ? "bg-gray-100" : "bg-gray-200"
//                             }`}
//                           >
//                             📦
//                           </div>
//                           <div className="ml-3">
//                             <p
//                               className={`text-sm font-medium ${
//                                 subProduct.isActive ? "text-gray-900" : "text-gray-500"
//                               }`}
//                             >
//                               {subProduct.name}
//                             </p>
//                             <p className="text-sm text-gray-500">
//                               {subProduct.description || "No description"}
//                             </p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {getProductName(subProduct.productId)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <span className="font-medium">{subProduct.size}</span>
//                           {subProduct.weight && (
//                             <div className="text-gray-500">{subProduct.weight}</div>
//                           )}
//                           {subProduct.volume && (
//                             <div className="text-gray-500">{subProduct.volume}</div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
//                         ₹{subProduct.price.toFixed(2)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <span
//                             className={`text-sm font-medium ${
//                               subProduct.stock <= subProduct.lowStockThreshold 
//                                 ? "text-red-600" 
//                                 : "text-gray-900"
//                             }`}
//                           >
//                             {subProduct.stock}
//                           </span>
//                           {subProduct.stock <= subProduct.lowStockThreshold && (
//                             <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge
//                           variant={subProduct.isActive ? "default" : "secondary"}
//                           className={
//                             subProduct.isActive 
//                               ? "bg-green-500 hover:bg-green-600" 
//                               : "bg-gray-400"
//                           }
//                         >
//                           {subProduct.isActive ? "Active" : "Disabled"}
//                         </Badge>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         <div className="flex space-x-2">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleToggleActive(subProduct.id, subProduct.isActive)}
//                             disabled={updateSubProductMutation.isPending}
//                             className={
//                               subProduct.isActive
//                                 ? "text-orange-500 hover:text-orange-600"
//                                 : "text-green-500 hover:text-green-600"
//                             }
//                             title={subProduct.isActive ? "Disable Sub-Product" : "Enable Sub-Product"}
//                           >
//                             {updateSubProductMutation.isPending ? (
//                               <Loader2 className="w-4 h-4 animate-spin" />
//                             ) : subProduct.isActive ? (
//                               <EyeOff className="w-4 h-4" />
//                             ) : (
//                               <Eye className="w-4 h-4" />
//                             )}
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleDeleteSubProduct(subProduct.id, subProduct.name)}
//                             disabled={deleteSubProductMutation.isPending}
//                             className="text-red-500 hover:text-red-600"
//                             title="Delete Sub-Product"
//                           >
//                             {deleteSubProductMutation.isPending ? (
//                               <Loader2 className="w-4 h-4 animate-spin" />
//                             ) : (
//                               <Trash2 className="w-4 h-4" />
//                             )}
//                           </Button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <AddSubProductModal open={showAddModal} onOpenChange={setShowAddModal} />
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
// import { Plus, Search, AlertTriangle, Trash2, Eye, EyeOff, Download } from "lucide-react"
// import { toast } from "sonner"
// import AddSubProductModal from "@/components/modals/add-sub-product-modal"
// import type { SubProduct } from "@/lib/types"

// export default function SubProductsTab() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedProduct, setSelectedProduct] = useState<string>("all")
//   const [showInactive, setShowInactive] = useState(false)
//   const [showAddModal, setShowAddModal] = useState(false)
//   const queryClient = useQueryClient()

//   const { data: subProducts = [], isLoading } = useQuery({
//     queryKey: ["sub-products", showInactive],
//     queryFn: async () => {
//       const params = new URLSearchParams()
//       if (showInactive) {
//         params.append("includeInactive", "true")
//       }
//       const response = await fetch(`/api/sub-products?${params}`)
//       if (!response.ok) throw new Error("Failed to fetch sub-products")
//       return response.json()
//     },
//   })

//   const { data: products = [] } = useQuery({
//     queryKey: ["products-for-filter"],
//     queryFn: async () => {
//       const response = await fetch("/api/products")
//       if (!response.ok) throw new Error("Failed to fetch products")
//       return response.json()
//     },
//   })

//   const deleteSubProductMutation = useMutation({
//     mutationFn: async (subProductId: string) => {
//       const response = await fetch(`/api/sub-products/${subProductId}`, {
//         method: "DELETE",
//       })
//       if (!response.ok) throw new Error("Failed to delete sub-product")
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["sub-products"] })
//       toast.success("Sub-product deleted successfully.")
//     },
//     onError: () => {
//       toast.error("Failed to delete sub-product.")
//     },
//   })

//   const updateSubProductMutation = useMutation({
//     mutationFn: async ({ subProductId, data }: { subProductId: string; data: any }) => {
//       const response = await fetch(`/api/sub-products/${subProductId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       })
//       if (!response.ok) throw new Error("Failed to update sub-product")
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["sub-products"] })
//       toast.success("Sub-product updated successfully.")
//     },
//     onError: () => {
//       toast.error("Failed to update sub-product.")
//     },
//   })

//   const handleToggleActive = (subProductId: string, currentStatus: boolean) => {
//     updateSubProductMutation.mutate({ subProductId, data: { isActive: !currentStatus } })
//   }

//   const handleDeleteSubProduct = (subProductId: string, subProductName: string) => {
//     if (window.confirm(`Are you sure you want to delete "${subProductName}"? This action cannot be undone.`)) {
//       deleteSubProductMutation.mutate(subProductId)
//     }
//   }

//   const handleExport = async () => {
//     try {
//       const response = await fetch("/api/sub-products/export?format=csv")
//       if (!response.ok) throw new Error("Failed to export")

//       const blob = await response.blob()
//       const url = window.URL.createObjectURL(blob)
//       const a = document.createElement("a")
//       a.href = url
//       a.download = `sub-products-${new Date().toISOString().split("T")[0]}.csv`
//       document.body.appendChild(a)
//       a.click()
//       window.URL.revokeObjectURL(url)
//       document.body.removeChild(a)

//       toast.success("Sub-products exported successfully!")
//     } catch (error) {
//       toast.error("Failed to export sub-products")
//     }
//   }

//   const getProductName = (productId: string) => {
//     const product = products.find((prod: any) => prod.id === productId)
//     return product?.name || "Unknown Product"
//   }

//   const filteredSubProducts = subProducts.filter((subProduct: SubProduct) => {
//     const matchesSearch =
//       subProduct.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       subProduct.size.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesProduct = selectedProduct === "all" || subProduct.id === selectedProduct
//     return matchesSearch && matchesProduct
//   })

//   if (isLoading) {
//     return <div className="text-center py-8">Loading sub-products...</div>
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Sub-Products Management</h2>
//         <div className="flex space-x-2">
//           <Button onClick={handleExport} variant="outline">
//             <Download className="w-4 h-4 mr-2" />
//             Export
//           </Button>
//           <Button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
//             <Plus className="w-4 h-4 mr-2" />
//             Add Sub-Product
//           </Button>
//         </div>
//       </div>

//       {/* Search and Filter */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Search Sub-Products</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Name or size..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Parent Product</Label>
//               <Select value={selectedProduct} onValueChange={setSelectedProduct}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Products" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Products</SelectItem>
//                   {products.map((product: any) => (
//                     <SelectItem key={product.id} value={product.id}>
//                       {product.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">Show Inactive</Label>
//               <div className="flex items-center space-x-2 mt-3">
//                 <Switch checked={showInactive} onCheckedChange={setShowInactive} />
//                 <span className="text-sm text-gray-600">Include disabled variants</span>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Sub-Products List */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">Sub-Products Inventory</CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Sub-Product
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Parent Product
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Size/Weight
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
//                 {filteredSubProducts.map((subProduct: SubProduct) => (
//                   <tr key={subProduct.id} className={!subProduct.isActive ? "bg-gray-50 opacity-75" : ""}>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div
//                           className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
//                             subProduct.isActive ? "bg-gray-100" : "bg-gray-200"
//                           }`}
//                         >
//                           📦
//                         </div>
//                         <div className="ml-3">
//                           <p
//                             className={`text-sm font-medium ${subProduct.isActive ? "text-gray-900" : "text-gray-500"}`}
//                           >
//                             {subProduct.name}
//                           </p>
//                           <p className="text-sm text-gray-500">{subProduct.description || "No description"}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {getProductName(subProduct.id)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm text-gray-900">
//                         <span className="font-medium">{subProduct.size}</span>
//                         {subProduct.weight && <div className="text-gray-500">{subProduct.weight}</div>}
//                         {subProduct.volume && <div className="text-gray-500">{subProduct.volume}</div>}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
//                       ₹{subProduct.price.toFixed(2)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <span
//                           className={`text-sm font-medium ${
//                             subProduct.stock <= subProduct.lowStockThreshold ? "text-red-600" : "text-gray-900"
//                           }`}
//                         >
//                           {subProduct.stock}
//                         </span>
//                         {subProduct.stock <= subProduct.lowStockThreshold && (
//                           <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <Badge
//                         variant={subProduct.isActive ? "default" : "secondary"}
//                         className={subProduct.isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"}
//                       >
//                         {subProduct.isActive ? "Active" : "Disabled"}
//                       </Badge>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       <div className="flex space-x-2">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleToggleActive(subProduct.id, subProduct.isActive)}
//                           className={
//                             subProduct.isActive
//                               ? "text-orange-500 hover:text-orange-600"
//                               : "text-green-500 hover:text-green-600"
//                           }
//                           title={subProduct.isActive ? "Disable Sub-Product" : "Enable Sub-Product"}
//                         >
//                           {subProduct.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => handleDeleteSubProduct(subProduct.id, subProduct.name)}
//                           className="text-red-500 hover:text-red-600"
//                           title="Delete Sub-Product"
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

//       <AddSubProductModal open={showAddModal} onOpenChange={setShowAddModal} />
//     </div>
//   )
// }




// // "use client"

// // import { useState, useEffect } from "react"
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Button } from "@/components/ui/button"
// // import { Input } from "@/components/ui/input"
// // import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// // import { Badge } from "@/components/ui/badge"
// // import { Plus, Search, Package, Edit, Trash2 } from "lucide-react"
// // import type { SubProduct, Product } from "@/lib/types"
// // import { AddSubProductModal } from "@/components/modals/add-sub-product-modal"

// // export function SubProductsTab() {
// //   const [subProducts, setSubProducts] = useState<SubProduct[]>([])
// //   const [products, setProducts] = useState<Product[]>([])
// //   const [loading, setLoading] = useState(true)
// //   const [searchTerm, setSearchTerm] = useState("")
// //   const [showAddModal, setShowAddModal] = useState(false)

// //   useEffect(() => {
// //     fetchSubProducts()
// //     fetchProducts()
// //   }, [])

// //   const fetchSubProducts = async () => {
// //     try {
// //       const response = await fetch("/api/sub-products")
// //       if (response.ok) {
// //         const data = await response.json()
// //         setSubProducts(data.subProducts)
// //       }
// //     } catch (error) {
// //       console.error("Error fetching sub-products:", error)
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   const fetchProducts = async () => {
// //     try {
// //       const response = await fetch("/api/products")
// //       if (response.ok) {
// //         const data = await response.json()
// //         setProducts(data.products)
// //       }
// //     } catch (error) {
// //       console.error("Error fetching products:", error)
// //     }
// //   }

// //   const filteredSubProducts = subProducts.filter(
// //     (subProduct) =>
// //       subProduct.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       subProduct.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       subProduct.parentProduct?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       subProduct.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
// //   )

// //   const getStockBadge = (stock: number, threshold: number) => {
// //     if (stock === 0) {
// //       return <Badge variant="destructive">Out of Stock</Badge>
// //     } else if (stock <= threshold) {
// //       return <Badge variant="secondary">Low Stock</Badge>
// //     } else {
// //       return <Badge variant="default">In Stock</Badge>
// //     }
// //   }

// //   return (
// //     <div className="space-y-6">
// //       <Card>
// //         <CardHeader>
// //           <CardTitle className="flex items-center justify-between">
// //             <div className="flex items-center gap-2">
// //               <Package className="h-5 w-5" />
// //               Sub-Products (Variants) Management
// //             </div>
// //             <Button onClick={() => setShowAddModal(true)}>
// //               <Plus className="h-4 w-4 mr-2" />
// //               Add Sub-Product
// //             </Button>
// //           </CardTitle>
// //         </CardHeader>
// //         <CardContent>
// //           <div className="flex items-center gap-4 mb-6">
// //             <div className="relative flex-1">
// //               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
// //               <Input
// //                 placeholder="Search sub-products..."
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //                 className="pl-10"
// //               />
// //             </div>
// //           </div>

// //           {loading ? (
// //             <div className="flex items-center justify-center py-8">
// //               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
// //             </div>
// //           ) : (
// //             <div className="overflow-x-auto">
// //               <Table>
// //                 <TableHeader>
// //                   <TableRow>
// //                     <TableHead>Parent Product</TableHead>
// //                     <TableHead>Variant Name</TableHead>
// //                     <TableHead>Size</TableHead>
// //                     <TableHead>Price</TableHead>
// //                     <TableHead>Stock</TableHead>
// //                     <TableHead>Weight/Volume</TableHead>
// //                     <TableHead>SKU</TableHead>
// //                     <TableHead>Status</TableHead>
// //                     <TableHead>Actions</TableHead>
// //                   </TableRow>
// //                 </TableHeader>
// //                 <TableBody>
// //                   {filteredSubProducts.map((subProduct) => (
// //                     <TableRow key={subProduct.id}>
// //                       <TableCell className="font-medium">{subProduct.parentProduct?.name}</TableCell>
// //                       <TableCell>{subProduct.name}</TableCell>
// //                       <TableCell>
// //                         <Badge variant="outline">{subProduct.size}</Badge>
// //                       </TableCell>
// //                       <TableCell className="font-medium">₹{subProduct.price}</TableCell>
// //                       <TableCell>
// //                         <div className="flex items-center gap-2">
// //                           <span>{subProduct.stock}</span>
// //                           {getStockBadge(subProduct.stock, subProduct.lowStockThreshold)}
// //                         </div>
// //                       </TableCell>
// //                       <TableCell>
// //                         <div className="text-sm">
// //                           {subProduct.weight && <div>W: {subProduct.weight}</div>}
// //                           {subProduct.volume && <div>V: {subProduct.volume}</div>}
// //                         </div>
// //                       </TableCell>
// //                       <TableCell className="text-sm text-muted-foreground">{subProduct.sku || "N/A"}</TableCell>
// //                       <TableCell>
// //                         <Badge variant={subProduct.status === "active" ? "default" : "secondary"}>
// //                           {subProduct.status}
// //                         </Badge>
// //                       </TableCell>
// //                       <TableCell>
// //                         <div className="flex items-center gap-2">
// //                           <Button variant="ghost" size="sm">
// //                             <Edit className="h-4 w-4" />
// //                           </Button>
// //                           <Button variant="ghost" size="sm">
// //                             <Trash2 className="h-4 w-4" />
// //                           </Button>
// //                         </div>
// //                       </TableCell>
// //                     </TableRow>
// //                   ))}
// //                 </TableBody>
// //               </Table>
// //             </div>
// //           )}

// //           {!loading && filteredSubProducts.length === 0 && (
// //             <div className="text-center py-8 text-muted-foreground">
// //               {searchTerm
// //                 ? "No sub-products found matching your search."
// //                 : "No sub-products found. Add your first sub-product to get started."}
// //             </div>
// //           )}
// //         </CardContent>
// //       </Card>

// //       <AddSubProductModal
// //         isOpen={showAddModal}
// //         onClose={() => setShowAddModal(false)}
// //         products={products}
// //         onSuccess={fetchSubProducts}
// //       />
// //     </div>
// //   )
// // }
