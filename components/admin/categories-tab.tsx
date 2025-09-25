"use client"

import { useState, useMemo, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Search, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import AddCategoryModal from "@/components/modals/add-category-modal"
import EditCategoryModal from "@/components/modals/edit-category-modal"

import type { Category } from "@/lib/types"

interface FilterState {
  searchTerm: string
  showInactive: boolean
}

export default function CategoriesTab() {
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: "",
    showInactive: false
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const queryClient = useQueryClient()

  // Enhanced query to include inactive categories based on toggle
  const { 
    data: categoriesResponse, 
    isLoading, 
    error: categoriesError,
    isError: isCategoriesError 
  } = useQuery({
    queryKey: ["categories", filterState.showInactive],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterState.showInactive) {
        params.append("includeInactive", "true")
      }
      
      const response = await fetch(`/api/categories?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Handle both old and new API response formats
      if (data.categories && Array.isArray(data.categories)) {
        return {
          categories: data.categories,
          totalCount: data.totalCount || data.categories.length,
          activeCount: data.activeCount || data.categories.filter((c: Category) => c.isActive).length,
          inactiveCount: data.inactiveCount || data.categories.filter((c: Category) => !c.isActive).length
        }
      }
      
      // Fallback for old API format
      if (Array.isArray(data)) {
        return {
          categories: data,
          totalCount: data.length,
          activeCount: data.filter((c: Category) => c.isActive).length,
          inactiveCount: data.filter((c: Category) => !c.isActive).length
        }
      }
      
      return { categories: [], totalCount: 0, activeCount: 0, inactiveCount: 0 }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Extract categories and counts from the response
  const categories = categoriesResponse?.categories || []
  const totalCategoriesCount = categoriesResponse?.totalCount || 0
  const activeCategoriesCount = categoriesResponse?.activeCount || 0
  const inactiveCategoriesCount = categoriesResponse?.inactiveCount || 0

  const editCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch(`/api/categories/${selectedCategory?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to update category: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Category updated successfully.")
      setShowEditModal(false)
      setSelectedCategory(null)
    },
    onError: (error: Error) => {
      console.error("Update category error:", error)
      toast.error(`Failed to update category: ${error.message}`)
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to delete category: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Category deleted successfully.")
    },
    onError: (error: Error) => {
      console.error("Delete category error:", error)
      toast.error(`Failed to delete category: ${error.message}`)
    },
  })

  const toggleCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to update category: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Category status updated successfully.")
    },
    onError: (error: Error) => {
      console.error("Toggle category error:", error)
      toast.error(`Failed to update category: ${error.message}`)
    },
  })

  // Memoized filter change handler
  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilterState(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleEditCategory = useCallback((category: Category) => {
    setSelectedCategory(category)
    setShowEditModal(true)
  }, [])

  const handleConfirmEdit = useCallback((data: { name: string; description: string }) => {
    editCategoryMutation.mutate(data)
  }, [editCategoryMutation])

  const handleDeleteCategory = useCallback((categoryId: string, categoryName: string) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}" category? This action cannot be undone.`)) {
      deleteCategoryMutation.mutate(categoryId)
    }
  }, [deleteCategoryMutation])

  const handleToggleActive = useCallback((categoryId: string, currentStatus: boolean) => {
    toggleCategoryMutation.mutate({ categoryId, isActive: !currentStatus })
  }, [toggleCategoryMutation])

  // Memoized filtered categories
  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) {
      console.warn("categories is not an array:", categories)
      return []
    }

    return categories.filter((category: Category) => {
      if (!category) return false
      
      const searchTerm = filterState.searchTerm.toLowerCase().trim()
      const matchesSearch = !searchTerm || 
        category.name?.toLowerCase().includes(searchTerm) ||
        category.description?.toLowerCase().includes(searchTerm)

      return matchesSearch
    })
  }, [categories, filterState.searchTerm])

  // Error state
  if (isCategoriesError) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Categories</h3>
          <p className="text-gray-600 mb-4">
            {categoriesError instanceof Error ? categoriesError.message : 'An unknown error occurred'}
          </p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["categories"] })}
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
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)} 
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Search Categories
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Name or description..."
                  value={filterState.searchTerm}
                  onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                  className="pl-10"
                />
              </div>
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
                <span className="text-sm text-gray-600">Include inactive categories</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 p-6 pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">Categories</CardTitle>
            <p className="text-sm text-gray-600 m-0 pt-1">
              [{filteredCategories.length} of {totalCategoriesCount} categories]
            </p>
          </div>
        </div>
        <CardContent className="p-0">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500 mb-4">
                {categories.length === 0 
                  ? "Get started by adding your first category."
                  : "Try adjusting your search or filters."
                }
              </p>
              {categories.length === 0 && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCategories.map((category: Category) => (
                    <tr 
                      key={category.id} 
                      className={!category.isActive ? "bg-gray-50 opacity-75" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                              category.isActive ? "bg-blue-100" : "bg-gray-200"
                            }`}
                          >
                            📦
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                category.isActive ? "text-gray-900" : "text-gray-500"
                              }`}
                            >
                              {category.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={category.isActive ? "default" : "secondary"}
                          className={
                            category.isActive 
                              ? "bg-green-500 hover:bg-green-600" 
                              : "bg-gray-400"
                          }
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(category.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) || "🤔?"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            disabled={editCategoryMutation.isPending}
                            className="text-purple-500 hover:text-purple-600"
                            title="Edit Category"
                          >
                            {editCategoryMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Edit className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(category.id, category.isActive)}
                            disabled={toggleCategoryMutation.isPending}
                            className={
                              category.isActive
                                ? "text-orange-500 hover:text-orange-600"
                                : "text-green-500 hover:text-green-600"
                            }
                            title={category.isActive ? "Deactivate Category" : "Activate Category"}
                          >
                            {toggleCategoryMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : category.isActive ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            disabled={deleteCategoryMutation.isPending}
                            className="text-red-500 hover:text-red-600"
                            title="Delete Category"
                          >
                            {deleteCategoryMutation.isPending ? (
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

      <AddCategoryModal open={showAddModal} onOpenChange={setShowAddModal} />
      <EditCategoryModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onConfirm={handleConfirmEdit}
        isLoading={editCategoryMutation.isPending}
        category={selectedCategory}
      />
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
// import { Badge } from "@/components/ui/badge"
// import { Switch } from "@/components/ui/switch"
// import { Plus, Edit, Trash2, Search, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react"
// import { toast } from "sonner"
// import AddCategoryModal from "@/components/modals/add-category-modal"
// import EditCategoryModal from "@/components/modals/edit-category-modal"

// import type { Category } from "@/lib/types"

// interface FilterState {
//   searchTerm: string
//   showInactive: boolean
// }

// export default function CategoriesTab() {
//   const [filterState, setFilterState] = useState<FilterState>({
//     searchTerm: "",
//     showInactive: false
//   })
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [showEditModal, setShowEditModal] = useState(false)
//   const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
//   const queryClient = useQueryClient()

//   // Enhanced query to include inactive categories based on toggle
//   const { 
//     data: categories = [], 
//     isLoading, 
//     error: categoriesError,
//     isError: isCategoriesError 
//   } = useQuery({
//     queryKey: ["categories", filterState.showInactive],
//     queryFn: async (): Promise<Category[]> => {
//       const params = new URLSearchParams()
//       if (filterState.showInactive) {
//         params.append("includeInactive", "true")
//       }
      
//       const response = await fetch(`/api/categories?${params}`)
//       if (!response.ok) {
//         throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`)
//       }
      
//       const data = await response.json()
//       return Array.isArray(data) ? data : []
//     },
//     retry: 2,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     gcTime: 10 * 60 * 1000, // 10 minutes
//   })

//   const editCategoryMutation = useMutation({
//     mutationFn: async (data: { name: string; description: string }) => {
//       const response = await fetch(`/api/categories/${selectedCategory?.id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       })
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}))
//         throw new Error(errorData.message || `Failed to update category: ${response.status}`)
//       }
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["categories"] })
//       toast.success("Category updated successfully.")
//       setShowEditModal(false)
//       setSelectedCategory(null)
//     },
//     onError: (error: Error) => {
//       console.error("Update category error:", error)
//       toast.error(`Failed to update category: ${error.message}`)
//     },
//   })

//   const deleteCategoryMutation = useMutation({
//     mutationFn: async (categoryId: string) => {
//       const response = await fetch(`/api/categories/${categoryId}`, {
//         method: "DELETE",
//       })
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}))
//         throw new Error(errorData.message || `Failed to delete category: ${response.status}`)
//       }
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["categories"] })
//       toast.success("Category deleted successfully.")
//     },
//     onError: (error: Error) => {
//       console.error("Delete category error:", error)
//       toast.error(`Failed to delete category: ${error.message}`)
//     },
//   })

//   const toggleCategoryMutation = useMutation({
//     mutationFn: async ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) => {
//       const response = await fetch(`/api/categories/${categoryId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ isActive }),
//       })
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}))
//         throw new Error(errorData.message || `Failed to update category: ${response.status}`)
//       }
//       return response.json()
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["categories"] })
//       toast.success("Category status updated successfully.")
//     },
//     onError: (error: Error) => {
//       console.error("Toggle category error:", error)
//       toast.error(`Failed to update category: ${error.message}`)
//     },
//   })

//   // Memoized filter change handler
//   const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
//     setFilterState(prev => ({ ...prev, [key]: value }))
//   }, [])

//   const handleEditCategory = useCallback((category: Category) => {
//     setSelectedCategory(category)
//     setShowEditModal(true)
//   }, [])

//   const handleConfirmEdit = useCallback((data: { name: string; description: string }) => {
//     editCategoryMutation.mutate(data)
//   }, [editCategoryMutation])

//   const handleDeleteCategory = useCallback((categoryId: string, categoryName: string) => {
//     if (window.confirm(`Are you sure you want to delete "${categoryName}" category? This action cannot be undone.`)) {
//       deleteCategoryMutation.mutate(categoryId)
//     }
//   }, [deleteCategoryMutation])

//   const handleToggleActive = useCallback((categoryId: string, currentStatus: boolean) => {
//     toggleCategoryMutation.mutate({ categoryId, isActive: !currentStatus })
//   }, [toggleCategoryMutation])

//   // Memoized filtered categories
//   const filteredCategories = useMemo(() => {
//     if (!Array.isArray(categories)) {
//       console.warn("categories is not an array:", categories)
//       return []
//     }

//     return categories.filter((category: Category) => {
//       if (!category) return false
      
//       const searchTerm = filterState.searchTerm.toLowerCase().trim()
//       const matchesSearch = !searchTerm || 
//         category.name?.toLowerCase().includes(searchTerm) ||
//         category.description?.toLowerCase().includes(searchTerm)

//       return matchesSearch
//     })
//   }, [categories, filterState.searchTerm])

//   // Error state
//   if (isCategoriesError) {
//     return (
//       <Card className="p-8">
//         <div className="text-center">
//           <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Categories</h3>
//           <p className="text-gray-600 mb-4">
//             {categoriesError instanceof Error ? categoriesError.message : 'An unknown error occurred'}
//           </p>
//           <Button 
//             onClick={() => queryClient.invalidateQueries({ queryKey: ["categories"] })}
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
//           <p className="text-gray-600">Loading categories...</p>
//         </div>
//       </Card>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
//           <p className="text-gray-600 mt-1">
//             {filteredCategories.length} of {categories.length} categories
//           </p>
//         </div>
//         <Button 
//           onClick={() => setShowAddModal(true)} 
//           className="bg-blue-500 hover:bg-blue-600 text-white"
//         >
//           <Plus className="w-4 h-4 mr-2" />
//           Add Category
//         </Button>
//       </div>

//       {/* Search and Filter */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <Label className="block text-sm font-medium text-gray-700 mb-2">
//                 Search Categories
//               </Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Name or description..."
//                   value={filterState.searchTerm}
//                   onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
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
//                 <span className="text-sm text-gray-600">Include inactive categories</span>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Categories List */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-gray-900">Categories</CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           {filteredCategories.length === 0 ? (
//             <div className="text-center py-12">
//               <div className="text-gray-400 mb-4">📦</div>
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
//               <p className="text-gray-500 mb-4">
//                 {categories.length === 0 
//                   ? "Get started by adding your first category."
//                   : "Try adjusting your search or filters."
//                 }
//               </p>
//               {categories.length === 0 && (
//                 <Button 
//                   onClick={() => setShowAddModal(true)}
//                   className="bg-blue-500 hover:bg-blue-600 text-white"
//                 >
//                   <Plus className="w-4 h-4 mr-2" />
//                   Add Category
//                 </Button>
//               )}
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Category Name
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Description
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Status
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Created
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredCategories.map((category: Category) => (
//                     <tr 
//                       key={category.id} 
//                       className={!category.isActive ? "bg-gray-50 opacity-75" : ""}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div
//                             className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
//                               category.isActive ? "bg-blue-100" : "bg-gray-200"
//                             }`}
//                           >
//                             📦
//                           </div>
//                           <div className="ml-3">
//                             <p
//                               className={`text-sm font-medium ${
//                                 category.isActive ? "text-gray-900" : "text-gray-500"
//                               }`}
//                             >
//                               {category.name}
//                             </p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {category.description || "No description"}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge
//                           variant={category.isActive ? "default" : "secondary"}
//                           className={
//                             category.isActive 
//                               ? "bg-green-500 hover:bg-green-600" 
//                               : "bg-gray-400"
//                           }
//                         >
//                           {category.isActive ? "Active" : "Inactive"}
//                         </Badge>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {new Date(category.createdAt).toLocaleDateString('en-GB', {
//                           day: '2-digit',
//                           month: '2-digit',
//                           year: 'numeric'
//                         }) || "🤔?"}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         <div className="flex space-x-2">
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleEditCategory(category)}
//                             disabled={editCategoryMutation.isPending}
//                             className="text-purple-500 hover:text-purple-600"
//                             title="Edit Category"
//                           >
//                             {editCategoryMutation.isPending ? (
//                               <Loader2 className="w-4 h-4 animate-spin" />
//                             ) : (
//                               <Edit className="w-4 h-4" />
//                             )}
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleToggleActive(category.id, category.isActive)}
//                             disabled={toggleCategoryMutation.isPending}
//                             className={
//                               category.isActive
//                                 ? "text-orange-500 hover:text-orange-600"
//                                 : "text-green-500 hover:text-green-600"
//                             }
//                             title={category.isActive ? "Deactivate Category" : "Activate Category"}
//                           >
//                             {toggleCategoryMutation.isPending ? (
//                               <Loader2 className="w-4 h-4 animate-spin" />
//                             ) : category.isActive ? (
//                               <EyeOff className="w-4 h-4" />
//                             ) : (
//                               <Eye className="w-4 h-4" />
//                             )}
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleDeleteCategory(category.id, category.name)}
//                             disabled={deleteCategoryMutation.isPending}
//                             className="text-red-500 hover:text-red-600"
//                             title="Delete Category"
//                           >
//                             {deleteCategoryMutation.isPending ? (
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

//       <AddCategoryModal open={showAddModal} onOpenChange={setShowAddModal} />
//       <EditCategoryModal
//         open={showEditModal}
//         onOpenChange={setShowEditModal}
//         onConfirm={handleConfirmEdit}
//         isLoading={editCategoryMutation.isPending}
//         category={selectedCategory}
//       />
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
// // import { Badge } from "@/components/ui/badge"
// // import { Plus, Edit, Trash2, Search } from "lucide-react"
// // import { toast } from "sonner"
// // import AddCategoryModal from "@/components/modals/add-category-modal"
// // import EditCategoryModal from "@/components/modals/edit-category-modal"

// // import type { Category } from "@/lib/types"

// // export default function CategoriesTab() {
// //   const [searchTerm, setSearchTerm] = useState("")
// //   const [showAddModal, setShowAddModal] = useState(false)
// //   const [showEditModal, setShowEditModal] = useState(false)
// //   const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
// //   const queryClient = useQueryClient()

// //   const { data: categories, isLoading } = useQuery({
// //     queryKey: ["categories"],
// //     queryFn: async () => {
// //       const response = await fetch("/api/categories")
// //       if (!response.ok) throw new Error("Failed to fetch categories")
// //       return response.json()
// //     },
// //   })

// //   const editCategoryMutation = useMutation({
// //     mutationFn: async (data: { name: string; description: string }) => {
// //       const response = await fetch(`/api/categories/${selectedCategory?.id}`, {
// //         method: "PATCH",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify(data),
// //       })
// //       if (!response.ok) throw new Error("Failed to update category")
// //       return response.json()
// //     },
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ["categories"] })
// //       toast.success("Category updated successfully.")
// //       setShowEditModal(false)
// //       setSelectedCategory(null)
// //     },
// //     onError: () => {
// //       toast.error("Failed to update category.")
// //     },
// //   })

// //   const deleteCategoryMutation = useMutation({
// //     mutationFn: async (categoryId: string) => {
// //       const response = await fetch(`/api/categories/${categoryId}`, {
// //         method: "DELETE",
// //       })
// //       if (!response.ok) throw new Error("Failed to delete category")
// //       return response.json()
// //     },
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ["categories"] })
// //       toast.success("Category deleted successfully.")
// //     },
// //     onError: () => {
// //       toast.error("Failed to delete category.")
// //     },
// //   })

// //   const toggleCategoryMutation = useMutation({
// //     mutationFn: async ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) => {
// //       const response = await fetch(`/api/categories/${categoryId}`, {
// //         method: "PATCH",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ isActive }),
// //       })
// //       if (!response.ok) throw new Error("Failed to update category")
// //       return response.json()
// //     },
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ["categories"] })
// //       toast.success("Category updated successfully.")
// //     },
// //     onError: () => {
// //       toast.error("Failed to update category.")
// //     },
// //   })

// //   const handleEditCategory = (category: Category) => {
// //     setSelectedCategory(category)
// //     setShowEditModal(true)
// //   }

// //   const handleConfirmEdit = (data: { name: string; description: string }) => {
// //     editCategoryMutation.mutate(data)
// //   }

// //   const handleDeleteCategory = (categoryId: string, categoryName: string) => {
// //     if (window.confirm(`Are you sure you want to delete "${categoryName}" category? This action cannot be undone.`)) {
// //       deleteCategoryMutation.mutate(categoryId)
// //     }
// //   }

// //   const handleToggleActive = (categoryId: string, currentStatus: boolean) => {
// //     toggleCategoryMutation.mutate({ categoryId, isActive: !currentStatus })
// //   }

// //   const filteredCategories = categories?.filter((category: Category) =>
// //     category.name.toLowerCase().includes(searchTerm.toLowerCase()),
// //   )

// //   if (isLoading) {
// //     return <div className="text-center py-8">Loading categories...</div>
// //   }

// //   return (
// //     <div className="space-y-6">
// //       <div className="flex justify-between items-center">
// //         <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
// //         <Button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
// //           <Plus className="w-4 h-4 mr-2" />
// //           Add Category
// //         </Button>
// //       </div>

// //       {/* Search */}
// //       <Card>
// //         <CardContent className="p-6">
// //           <div className="max-w-md">
// //             <Label className="block text-sm font-medium text-gray-700 mb-2">Search Categories</Label>
// //             <div className="relative">
// //               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
// //               <Input
// //                 placeholder="Category name..."
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //                 className="pl-10"
// //               />
// //             </div>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       {/* Categories List */}
// //       <Card>
// //         <CardHeader>
// //           <CardTitle className="text-lg font-semibold text-gray-900">Categories</CardTitle>
// //         </CardHeader>
// //         <CardContent className="p-0">
// //           <div className="overflow-x-auto">
// //             <table className="w-full">
// //               <thead className="bg-gray-50">
// //                 <tr>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Category Name
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Description
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Status
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Created
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                     Actions
// //                   </th>
// //                 </tr>
// //               </thead>
// //               <tbody className="bg-white divide-y divide-gray-200">
// //                 {filteredCategories?.map((category: Category) => (
// //                   <tr key={category.id}>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <div className="flex items-center">
// //                         <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center text-lg">
// //                           📦
// //                         </div>
// //                         <div className="ml-3">
// //                           <p className="text-sm font-medium text-gray-900">{category.name}</p>
// //                         </div>
// //                       </div>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
// //                       {category.description || "No description"}
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <Badge
// //                         variant={category.isActive ? "default" : "secondary"}
// //                         className={category.isActive ? "bg-green-500 hover:bg-green-600" : ""}
// //                       >
// //                         {category.isActive ? "Active" : "Inactive"}
// //                       </Badge>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                       {new Date(category.createdAt).toLocaleDateString('en-GB', {
// //                         day: '2-digit',
// //                         month: '2-digit',
// //                         year: 'numeric'
// //                       }) || "🤔?"}
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                       <div className="flex space-x-2">
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           onClick={() => handleEditCategory(category)}
// //                           className="text-purple-500 hover:text-purple-600"
// //                           title="Edit Category"
// //                         >
// //                           <Edit className="w-4 h-4" />
// //                         </Button>
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           onClick={() => handleToggleActive(category.id, category.isActive)}
// //                           className="text-blue-500 hover:text-blue-600"
// //                           title="Toggle Active Status"
// //                         >
// //                           {category.isActive ? "Deactivate" : "Activate"}
// //                         </Button>
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           onClick={() => handleDeleteCategory(category.id, category.name)}
// //                           className="text-red-500 hover:text-red-600"
// //                         >
// //                           <Trash2 className="w-4 h-4" />
// //                         </Button>
// //                       </div>
// //                     </td>
// //                     {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                       <div className="flex space-x-2">
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           onClick={() => handleToggleActive(category.id, category.isActive)}
// //                           className="text-purple-500 hover:text-purple-600"
// //                         >
// //                           <Edit className="w-4 h-4" />
// //                         </Button>
// //                         <Button
// //                           variant="ghost"
// //                           size="sm"
// //                           onClick={() => handleDeleteCategory(category.id, category.name)}
// //                           className="text-red-500 hover:text-red-600"
// //                         >
// //                           <Trash2 className="w-4 h-4" />
// //                         </Button>
// //                       </div>
// //                     </td> */}
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         </CardContent>
// //       </Card>

// //       <AddCategoryModal open={showAddModal} onOpenChange={setShowAddModal} />
// //       <EditCategoryModal
// //         open={showEditModal}
// //         onOpenChange={setShowEditModal}
// //         onConfirm={handleConfirmEdit}
// //         isLoading={editCategoryMutation.isPending}
// //         category={selectedCategory}
// //       />
// //     </div>
// //   )
// // }
