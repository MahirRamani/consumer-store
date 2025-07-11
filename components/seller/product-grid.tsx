"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Minus } from "lucide-react"
import type { Product, CartItem } from "@/lib/types"

interface ProductGridProps {
  onAddToCart: (product: Product) => void
  onRemoveFromCart: (productId: string) => void
  cartItems: CartItem[]
}

export default function ProductGrid({ onAddToCart, onRemoveFromCart, cartItems }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products")
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

  const getCartQuantity = (productId: string) => {
    const cartItem = cartItems.find((item) => item.productId === productId)
    return cartItem ? cartItem.quantity : 0
  }

  const getAvailableStock = (product: Product) => {
    const cartQuantity = getCartQuantity(product.id)
    return product.stock - cartQuantity
  }

  const filteredProducts = products?.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory && product.isActive
  })

  // Debug information
  console.log("Selected category:", selectedCategory)
  console.log("Categories from API:", categories)
  console.log("Products from API:", products)
  console.log("Filtered products:", filteredProducts)

  if (isLoading) {
    return <div className="text-center py-8">Loading products...</div>
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">Products</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Debug Panel */}
        {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
          <p>
            <strong>Debug Info:</strong>
          </p>
          <p>Selected Category: {selectedCategory}</p>
          <p>Total Products: {products?.length || 0}</p>
          <p>Filtered Products: {filteredProducts?.length || 0}</p>
          <p>Categories: {categories?.length || 0}</p>
        </div> */}

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              console.log("Clicking All button")
              setSelectedCategory("all")
            }}
            className={selectedCategory === "all" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
          >
            All
          </Button>
          {categories?.map((category: any) => {
            const categoryKey = category.id || category._id
            const categoryName = category.name
            console.log("Rendering category button:", categoryName, "Key:", categoryKey)

            return (
              <Button
                key={categoryKey}
                variant={selectedCategory === categoryName ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  console.log("Clicking category:", categoryName)
                  setSelectedCategory(categoryName)
                }}
                className={selectedCategory === categoryName ? "bg-green-500 hover:bg-green-600 text-white" : ""}
              >
                {categoryName}
              </Button>
            )
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
          {filteredProducts?.map((product: Product) => {
            const availableStock = getAvailableStock(product)
            const cartQuantity = getCartQuantity(product.id)

            return (
              <div
                key={product.id}
                className={`border rounded-lg p-3 transition-colors ${
                  availableStock > 0
                    ? "border-gray-200 hover:border-green-500 hover:bg-green-50"
                    : "border-gray-200 bg-gray-50 opacity-50"
                }`}
              >
                <div className="text-center">
                  <div className="bg-gray-100 rounded-lg p-2 mb-2 items-center flex justify-center">
                    {/* <span className="text-2xl">{getCategoryIcon(product.category)}</span> */}
                    <img src="https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSP-aQhW2wzv_K4gx6XvaxXq_eyWnXvxJlDacCTtecfV0X2tCe_-DYVo62PX4j5V205Uk6Pu-Kqo93HbxjOiY9iDNDWT2h4-sGIuAmkNWetJoyWSSJbtmbkJg" alt="" height={"80px"} width={"80px"}/>
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 mb-1">{product.name}</h4>
                  <p className="text-xs text-gray-400 mb-1">Category: {product.category}</p>
                  <p className="text-xs text-gray-500 mb-2">
                    {availableStock > 0 ? `${availableStock} available` : "Out of stock"}
                    {cartQuantity > 0 && <span className="text-blue-600 block">({cartQuantity} in cart)</span>}
                  </p>
                  <p className="font-bold text-green-500 mb-2">₹{product.price.toFixed(2)}</p>

                  {/* Quantity Controls */}
                  {cartQuantity > 0 ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveFromCart(product.id)
                        }}
                        className="w-6 h-6 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{cartQuantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddToCart(product)
                        }}
                        disabled={availableStock <= 0}
                        className="w-6 h-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => onAddToCart(product)}
                      disabled={availableStock <= 0}
                      size="sm"
                      className="w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredProducts?.length === 0 && (
          <div className="text-center py-8 text-gray-500">No products found matching your criteria.</div>
        )}
      </CardContent>
    </Card>
  )
}

// "use client"

// import { useState } from "react"
// import { useQuery } from "@tanstack/react-query"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { Search, Scan, Plus, Minus } from "lucide-react"
// import type { Product, CartItem } from "@/lib/types"

// interface ProductGridProps {
//   onAddToCart: (product: Product) => void
//   onRemoveFromCart: (productId: string) => void
//   cartItems: CartItem[]
// }

// export default function ProductGrid({ onAddToCart, onRemoveFromCart, cartItems }: ProductGridProps) {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedCategory, setSelectedCategory] = useState("all")

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

//   const getCartQuantity = (productId: string) => {
//     const cartItem = cartItems.find((item) => item.productId === productId)
//     return cartItem ? cartItem.quantity : 0
//   }

//   const getAvailableStock = (product: Product) => {
//     const cartQuantity = getCartQuantity(product.id)
//     return product.stock - cartQuantity
//   }

//   const filteredProducts = products?.filter((product: Product) => {
//     const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
//     // const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
//     const matchesCategory = selectedCategory === "all" || 
//   product.category.toLowerCase() === selectedCategory.toLowerCase()
//     return matchesSearch && matchesCategory && product.isActive
//   })

//   if (isLoading) {
//     return <div className="text-center py-8">Loading products...</div>
//   }

//   return (
//     <Card className="flex-1">
//       <CardHeader>
//         <div className="flex justify-between items-center">
//           <CardTitle className="text-lg font-semibold text-gray-900">Products</CardTitle>
//           <div className="flex space-x-2">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <Input
//                 placeholder="Search products..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10 w-64"
//               />
//             </div>
//             <Button
//               variant="outline"
//               className="text-purple-500 border-purple-500 hover:bg-purple-500 hover:text-white"
//             >
//               <Scan className="w-4 h-4 mr-2" />
//               Scan
//             </Button>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {/* Category Filters */}
//         <div className="flex flex-wrap gap-2">
//           <Button
//             variant={selectedCategory === "all" ? "default" : "outline"}
//             size="sm"
//             onClick={() => setSelectedCategory("all")}
//             className={selectedCategory === "all" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
//           >
//             All
//           </Button>
//           {categories?.map((category: any) => (
//             <Button
//               key={category.id}
//               variant={selectedCategory.toLowerCase() === category.name.toLowerCase() ? "default" : "outline"}
//               size="sm"
//               onClick={() => setSelectedCategory(category.name)}
//               className={selectedCategory === category.name ? "bg-green-500 hover:bg-green-600 text-white" : ""}
//             >
//               {category.name}
//             </Button>
//           ))}
//         </div>

//         {/* Products Grid */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
//           {filteredProducts?.map((product: Product) => {
//             const availableStock = getAvailableStock(product)
//             const cartQuantity = getCartQuantity(product.id)

//             return (
//               <div
//                 key={product.id}
//                 className={`border rounded-lg p-3 transition-colors ${
//                   availableStock > 0
//                     ? "border-gray-200 hover:border-green-500 hover:bg-green-50"
//                     : "border-gray-200 bg-gray-50 opacity-50"
//                 }`}
//               >
//                 <div className="text-center">
//                   <div className="bg-gray-100 rounded-lg p-2 mb-2">
//                     <span className="text-2xl">{getCategoryIcon(product.category)}</span>
//                   </div>
//                   <h4 className="font-medium text-sm text-gray-900 mb-1">{product.name}</h4>
//                   <p className="text-xs text-gray-500 mb-2">
//                     {availableStock > 0 ? `${availableStock} available` : "Out of stock"}
//                     {cartQuantity > 0 && <span className="text-blue-600 block">({cartQuantity} in cart)</span>}
//                   </p>
//                   <p className="font-bold text-green-500 mb-2">₹{product.price.toFixed(2)}</p>

//                   {/* Quantity Controls */}
//                   {cartQuantity > 0 ? (
//                     <div className="flex items-center justify-center space-x-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={(e) => {
//                           e.stopPropagation()
//                           onRemoveFromCart(product.id)
//                         }}
//                         className="w-6 h-6 p-0"
//                       >
//                         <Minus className="w-3 h-3" />
//                       </Button>
//                       <span className="text-sm font-medium w-8 text-center">{cartQuantity}</span>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={(e) => {
//                           e.stopPropagation()
//                           onAddToCart(product)
//                         }}
//                         disabled={availableStock <= 0}
//                         className="w-6 h-6 p-0"
//                       >
//                         <Plus className="w-3 h-3" />
//                       </Button>
//                     </div>
//                   ) : (
//                     <Button
//                       onClick={() => onAddToCart(product)}
//                       disabled={availableStock <= 0}
//                       size="sm"
//                       className="w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
//                     >
//                       <Plus className="w-3 h-3 mr-1" />
//                       Add
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             )
//           })}
//         </div>

//         {filteredProducts?.length === 0 && (
//           <div className="text-center py-8 text-gray-500">No products found matching your criteria.</div>
//         )}
//       </CardContent>
//     </Card>
//   )
// }
// // filter
// // "use client"

// // import { useState } from "react"
// // import { useQuery } from "@tanstack/react-query"
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Input } from "@/components/ui/input"
// // import { Button } from "@/components/ui/button"
// // import { Search, Scan, Plus, Minus } from "lucide-react"
// // import type { Product, CartItem } from "@/lib/types"

// // interface ProductGridProps {
// //   onAddToCart: (product: Product) => void
// //   onRemoveFromCart: (productId: string) => void
// //   cartItems: CartItem[]
// // }

// // export default function ProductGrid({ onAddToCart, onRemoveFromCart, cartItems }: ProductGridProps) {
// //   const [searchTerm, setSearchTerm] = useState("")
// //   const [selectedCategory, setSelectedCategory] = useState("all")

// //   const { data: products, isLoading } = useQuery({
// //     queryKey: ["products"],
// //     queryFn: async () => {
// //       const response = await fetch("/api/products")
// //       if (!response.ok) throw new Error("Failed to fetch products")
// //       return response.json()
// //     },
// //   })

// //   const { data: categories } = useQuery({
// //     queryKey: ["categories"],
// //     queryFn: async () => {
// //       const response = await fetch("/api/categories")
// //       if (!response.ok) throw new Error("Failed to fetch categories")
// //       return response.json()
// //     },
// //   })

// //   const getCategoryIcon = (category: string) => {
// //     switch (category.toLowerCase()) {
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

// //   const getCartQuantity = (productId: string) => {
// //     const cartItem = cartItems.find((item) => item.productId === productId)
// //     return cartItem ? cartItem.quantity : 0
// //   }

// //   const getAvailableStock = (product: Product) => {
// //     const cartQuantity = getCartQuantity(product.id)
// //     return product.stock - cartQuantity
// //   }

// //   const filteredProducts = products?.filter((product: Product) => {
// //     const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())

// //     // Case-insensitive category matching
// //     const matchesCategory =
// //       selectedCategory === "all" || product.category.toLowerCase() === selectedCategory.toLowerCase()

// //     const isActive = product.isActive
// //     const hasStock = product.stock > 0

// //     console.log(`Product: ${product.name}`)
// //     console.log(`  - Product Category: "${product.category}"`)
// //     console.log(`  - Selected Category: "${selectedCategory}"`)
// //     console.log(`  - Category Match: ${matchesCategory}`)
// //     console.log(`  - Is Active: ${isActive}`)
// //     console.log(`  - Has Stock: ${hasStock}`)
// //     console.log(`  - Final Result: ${matchesSearch && matchesCategory && isActive}`)

// //     return matchesSearch && matchesCategory && isActive
// //   })

// //   if (isLoading) {
// //     return <div className="text-center py-8">Loading products...</div>
// //   }

// //   return (
// //     <Card className="flex-1">
// //       <CardHeader>
// //         <div className="flex justify-between items-center">
// //           <CardTitle className="text-lg font-semibold text-gray-900">Products</CardTitle>
// //           <div className="flex space-x-2">
// //             <div className="relative">
// //               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
// //               <Input
// //                 placeholder="Search products..."
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //                 className="pl-10 w-64"
// //               />
// //             </div>
// //             <Button
// //               variant="outline"
// //               className="text-purple-500 border-purple-500 hover:bg-purple-500 hover:text-white bg-transparent"
// //             >
// //               <Scan className="w-4 h-4 mr-2" />
// //               Scan
// //             </Button>
// //           </div>
// //         </div>
// //       </CardHeader>
// //       <CardContent className="space-y-4">
// //         {/* Category Filters */}
// //         <div className="flex flex-wrap gap-2">
// //           <Button
// //             variant={selectedCategory === "all" ? "default" : "outline"}
// //             size="sm"
// //             onClick={() => setSelectedCategory("all")}
// //             className={selectedCategory === "all" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
// //           >
// //             All
// //           </Button>
// //           {categories?.map((category: any) => (
// //             <Button
// //               key={category.id || category._id}
// //               variant={selectedCategory.toLowerCase() === category.name.toLowerCase() ? "default" : "outline"}
// //               size="sm"
// //               onClick={() => {
// //                 console.log("Clicking category:", category.name)
// //                 setSelectedCategory(category.name)
// //               }}
// //               className={
// //                 selectedCategory.toLowerCase() === category.name.toLowerCase()
// //                   ? "bg-green-500 hover:bg-green-600 text-white"
// //                   : ""
// //               }
// //             >
// //               {category.name}
// //             </Button>
// //           ))}
// //         </div>

// //         {/* Products Grid */}
// //         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
// //           {filteredProducts?.map((product: Product) => {
// //             const availableStock = getAvailableStock(product)
// //             const cartQuantity = getCartQuantity(product.id)

// //             return (
// //               <div
// //                 key={product.id}
// //                 className={`border rounded-lg p-3 transition-colors ${
// //                   availableStock > 0
// //                     ? "border-gray-200 hover:border-green-500 hover:bg-green-50"
// //                     : "border-gray-200 bg-gray-50 opacity-50"
// //                 }`}
// //               >
// //                 <div className="text-center">
// //                   <div className="bg-gray-100 rounded-lg p-2 mb-2">
// //                     <span className="text-2xl">{getCategoryIcon(product.category)}</span>
// //                   </div>
// //                   <h4 className="font-medium text-sm text-gray-900 mb-1">{product.name}</h4>
// //                   <p className="text-xs text-gray-500 mb-2">
// //                     {availableStock > 0 ? `${availableStock} available` : "Out of stock"}
// //                     {cartQuantity > 0 && <span className="text-blue-600 block">({cartQuantity} in cart)</span>}
// //                   </p>
// //                   <p className="font-bold text-green-500 mb-2">₹{product.price.toFixed(2)}</p>

// //                   {/* Quantity Controls */}
// //                   {cartQuantity > 0 ? (
// //                     <div className="flex items-center justify-center space-x-2">
// //                       <Button
// //                         variant="outline"
// //                         size="sm"
// //                         onClick={(e) => {
// //                           e.stopPropagation()
// //                           onRemoveFromCart(product.id)
// //                         }}
// //                         className="w-6 h-6 p-0"
// //                       >
// //                         <Minus className="w-3 h-3" />
// //                       </Button>
// //                       <span className="text-sm font-medium w-8 text-center">{cartQuantity}</span>
// //                       <Button
// //                         variant="outline"
// //                         size="sm"
// //                         onClick={(e) => {
// //                           e.stopPropagation()
// //                           onAddToCart(product)
// //                         }}
// //                         disabled={availableStock <= 0}
// //                         className="w-6 h-6 p-0"
// //                       >
// //                         <Plus className="w-3 h-3" />
// //                       </Button>
// //                     </div>
// //                   ) : (
// //                     <Button
// //                       onClick={() => onAddToCart(product)}
// //                       disabled={availableStock <= 0}
// //                       size="sm"
// //                       className="w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
// //                     >
// //                       <Plus className="w-3 h-3 mr-1" />
// //                       Add
// //                     </Button>
// //                   )}
// //                 </div>
// //               </div>
// //             )
// //           })}
// //         </div>

// //         {filteredProducts?.length === 0 && (
// //           <div className="text-center py-8 text-gray-500">
// //             <p>No products found matching your criteria.</p>
// //             <div className="text-xs mt-2 space-y-1">
// //               <p>Search: "{searchTerm}"</p>
// //               <p>Category: "{selectedCategory}"</p>
// //               <p>Total Products: {products?.length || 0}</p>
// //               <p>Active Products: {products?.filter((p: Product) => p.isActive).length || 0}</p>
// //             </div>
// //           </div>
// //         )}
// //       </CardContent>
// //     </Card>
// //   )
// // }

// // "use client"

// // import { useState } from "react"
// // import { useQuery } from "@tanstack/react-query"
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Input } from "@/components/ui/input"
// // import { Button } from "@/components/ui/button"
// // import { Search, Scan, Plus, Minus } from "lucide-react"
// // import type { Product, CartItem } from "@/lib/types"

// // interface ProductGridProps {
// //   onAddToCart: (product: Product) => void
// //   cartItems: CartItem[]
// // }

// // export default function ProductGrid({ onAddToCart, cartItems }: ProductGridProps) {
// //   const [searchTerm, setSearchTerm] = useState("")
// //   const [selectedCategory, setSelectedCategory] = useState("all")

// //   const { data: products, isLoading } = useQuery({
// //     queryKey: ["products"],
// //     queryFn: async () => {
// //       const response = await fetch("/api/products")
// //       if (!response.ok) throw new Error("Failed to fetch products")
// //       return response.json()
// //     },
// //   })

// //   const categories = [
// //     { id: "all", label: "All" },
// //     { id: "food", label: "Food" },
// //     { id: "stationery", label: "Stationery" },
// //     { id: "daily-use", label: "Daily Use" },
// //     { id: "pooja", label: "Pooja" },
// //   ]

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

// //   const getCartQuantity = (productId: string) => {
// //     const cartItem = cartItems.find((item) => item.productId === productId)
// //     return cartItem ? cartItem.quantity : 0
// //   }

// //   const getAvailableStock = (product: Product) => {
// //     const cartQuantity = getCartQuantity(product.id)
// //     return product.stock - cartQuantity
// //   }

// //   const filteredProducts = products?.filter((product: Product) => {
// //     const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
// //     const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
// //     return matchesSearch && matchesCategory && product.isActive
// //   })

// //   if (isLoading) {
// //     return <div className="text-center py-8">Loading products...</div>
// //   }

// //   return (
// //     <Card className="flex-1">
// //       <CardHeader>
// //         <div className="flex justify-between items-center">
// //           <CardTitle className="text-lg font-semibold text-gray-900">Products</CardTitle>
// //           <div className="flex space-x-2">
// //             <div className="relative">
// //               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
// //               <Input
// //                 placeholder="Search products..."
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //                 className="pl-10 w-64"
// //               />
// //             </div>
// //             <Button
// //               variant="outline"
// //               className="text-purple-500 border-purple-500 hover:bg-purple-500 hover:text-white"
// //             >
// //               <Scan className="w-4 h-4 mr-2" />
// //               Scan
// //             </Button>
// //           </div>
// //         </div>
// //       </CardHeader>
// //       <CardContent className="space-y-4">
// //         {/* Category Filters */}
// //         <div className="flex flex-wrap gap-2">
// //           {categories.map((category) => (
// //             <Button
// //               key={category.id}
// //               variant={selectedCategory === category.id ? "default" : "outline"}
// //               size="sm"
// //               onClick={() => setSelectedCategory(category.id)}
// //               className={selectedCategory === category.id ? "bg-green-500 hover:bg-green-600 text-white" : ""}
// //             >
// //               {category.label}
// //             </Button>
// //           ))}
// //         </div>

// //         {/* Products Grid */}
// //         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
// //           {filteredProducts?.map((product: Product) => {
// //             const availableStock = getAvailableStock(product)
// //             const cartQuantity = getCartQuantity(product.id)

// //             return (
// //               <div
// //                 key={product.id}
// //                 className={`border rounded-lg p-3 transition-colors ${
// //                   availableStock > 0
// //                     ? "border-gray-200 hover:border-green-500 hover:bg-green-50"
// //                     : "border-gray-200 bg-gray-50 opacity-50"
// //                 }`}
// //               >
// //                 <div className="text-center">
// //                   <div className="bg-gray-100 rounded-lg p-2 mb-2">
// //                     <span className="text-2xl">{getCategoryIcon(product.category)}</span>
// //                   </div>
// //                   <h4 className="font-medium text-sm text-gray-900 mb-1">{product.name}</h4>
// //                   <p className="text-xs text-gray-500 mb-2">
// //                     {availableStock > 0 ? `${availableStock} available` : "Out of stock"}
// //                     {cartQuantity > 0 && <span className="text-blue-600 block">({cartQuantity} in cart)</span>}
// //                   </p>
// //                   <p className="font-bold text-green-500 mb-2">₹{product.price.toFixed(2)}</p>

// //                   {/* Quantity Controls */}
// //                   {cartQuantity > 0 ? (
// //                     <div className="flex items-center justify-center space-x-2">
// //                       <Button
// //                         variant="outline"
// //                         size="sm"
// //                         onClick={(e) => {
// //                           e.stopPropagation()
// //                           // Remove one from cart
// //                           const updatedProduct = { ...product, stock: product.stock + 1 }
// //                           onAddToCart(updatedProduct)
// //                         }}
// //                         className="w-6 h-6 p-0"
// //                       >
// //                         <Minus className="w-3 h-3" />
// //                       </Button>
// //                       <span className="text-sm font-medium w-8 text-center">{cartQuantity}</span>
// //                       <Button
// //                         variant="outline"
// //                         size="sm"
// //                         onClick={(e) => {
// //                           e.stopPropagation()
// //                           onAddToCart(product)
// //                         }}
// //                         disabled={availableStock <= 0}
// //                         className="w-6 h-6 p-0"
// //                       >
// //                         <Plus className="w-3 h-3" />
// //                       </Button>
// //                     </div>
// //                   ) : (
// //                     <Button
// //                       onClick={() => onAddToCart(product)}
// //                       disabled={availableStock <= 0}
// //                       size="sm"
// //                       className="w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
// //                     >
// //                       <Plus className="w-3 h-3 mr-1" />
// //                       Add
// //                     </Button>
// //                   )}
// //                 </div>
// //               </div>
// //             )
// //           })}
// //         </div>

// //         {filteredProducts?.length === 0 && (
// //           <div className="text-center py-8 text-gray-500">No products found matching your criteria.</div>
// //         )}
// //       </CardContent>
// //     </Card>
// //   )
// // }
