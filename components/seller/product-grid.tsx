"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Package,
  AlertTriangle,
  Eye,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { ProductVariantsModal } from "@/components/modals/product-variants-modal";
import type { Product, CartItem, SubProduct, Category } from "@/lib/types";

interface ProductGridProps {
  onAddToCart: (item: CartItem) => void;
}

export default function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products-active"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return data || [];
    },
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories-active"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      console.log("data.categories:", data.categories);
      
      return data.categories || [];
    },
  });

  const products = Array.isArray(productsData) 
    ? productsData.filter((product: Product) => product.isActive)
    : [];
  const categories = Array.isArray(categoriesData) 
    ? categoriesData.filter((category: Category) => category.isActive)
    : [];
  // const categories = categoriesData ? categoriesData.filter((category: Category) => category.isActive) : "[]";
  
  console.log("Categories:", categories);
  

  // Helper function to get the first variant as default (for display purposes)
  const getDefaultVariant = (product: Product): SubProduct | null => {
    if (!product.variants || product.variants.length === 0) return null;
    // Return the first variant (active or inactive) for display purposes
    return product.variants[0];
  };

  // Helper function to get the first active variant for cart operations
  const getFirstActiveVariant = (product: Product): SubProduct | null => {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.find(variant => variant.isActive) || null;
  };

  // Helper function to get price range for multiple variants
  const getPriceRange = (product: Product): { min: number; max: number } | null => {
    if (!product.variants || product.variants.length === 0) return null;
    const activePrices = product.variants
      .filter(variant => variant.isActive)
      .map(variant => variant.price);
    
    if (activePrices.length === 0) return null;
    
    return {
      min: Math.min(...activePrices),
      max: Math.max(...activePrices)
    };
  };

  // Helper function to check if product has low stock
  const hasLowStock = (product: Product): boolean => {
    const firstActiveVariant = getFirstActiveVariant(product);
    return firstActiveVariant ? firstActiveVariant.stock <= firstActiveVariant.lowStockThreshold : false;
  };

  // Helper function to check if product is out of stock
  const isOutOfStock = (product: Product): boolean => {
    if (product.variantCount === 1) {
      const firstActiveVariant = getFirstActiveVariant(product);
      return firstActiveVariant ? firstActiveVariant.stock <= 0 : true;
    }
    // For multiple variants, check if all are out of stock
    return product.variants?.every(variant => !variant.isActive || variant.stock <= 0) ?? true;
  };

  const handleAddToCart = (product: Product) => {
    // If product has multiple variants, show variants modal
    if (product.variantCount && product.variantCount > 1) {
      setSelectedProduct(product);
      setShowVariantsModal(true);
      return;
    }

    // If product has exactly one variant, add it directly to cart
    const firstActiveVariant = getFirstActiveVariant(product);
    if (firstActiveVariant) {
      if (firstActiveVariant.stock <= 0) {
        toast.error("Product is out of stock");
        return;
      }

      // FIXED: Create proper CartItem with subProductId as the unique identifier
      const cartItem: CartItem = {
        itemKey: `sub:${firstActiveVariant.id}`,
        subProductId: firstActiveVariant.id,
        productId: product.id, // Include productId for reference
        name: firstActiveVariant.name,
        price: firstActiveVariant.price,
        quantity: 1,
        stock: firstActiveVariant.stock,
        itemType: "subProduct",
      };

      onAddToCart(cartItem);
      toast.success(`${firstActiveVariant.name} added to cart`);
      return;
    }

    // Fallback for products without variants
    toast.error("This product has no available variants");
  };

  const handleVariantAddToCart = (variant: SubProduct, quantity: number) => {
    // FIXED: Create proper CartItem with subProductId as the unique identifier
    const cartItem: CartItem = {
      itemKey: `sub:${variant.id}`, // Add required itemKey
      subProductId: variant.id,
      productId: selectedProduct?.id, // Include productId for reference 
      name: variant.name,
      price: variant.price,
      quantity,
      stock: variant.stock,
      itemType: "subProduct",
    };

    onAddToCart(cartItem);
    setShowVariantsModal(false);
    toast.success(`${variant.name} added to cart`);
  };

  const getCategoryIcon = (category: string) => {
    if (!category) return "📦";

    switch (category.toLowerCase()) {
      case "food":
        return "🍜";
      case "stationery":
        return "📚";
      case "daily-use":
        return "🧴";
      case "pooja":
        return "🔥";
      default:
        return "📦";
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: Category) => cat.id === categoryId);
    return category?.name || "Uncategorized";
  };

  const getProductsCountByCategory = (categoryId: string) => {
    if (categoryId === "all") {
      return products.filter((product: Product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).length;
    }
    return products.filter(
      (product: Product) =>
        product.categoryId === categoryId &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).length;
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (productsLoading || categoriesLoading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <Badge variant="outline" className="text-sm">
          {filteredProducts.length} products available
        </Badge>
      </div>
      
      {/* Search and Filter */}
      <Card>
        <CardContent className="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </Label>
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
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className="w-full"
      >
        <TabsList className="flex w-full gap-1 h-auto p-1 bg-gray-100 overflow-x-auto">
          <TabsTrigger
            value="all"
            className="flex items-center space-x-2 py-2 px-4 bg-white data-[state=active]:border-indigo-500 data-[state=active]:bg-blue-100 data-[state=active]:shadow-sm"
          >
            <span>All Categories</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {getProductsCountByCategory("all")}
            </Badge>
          </TabsTrigger>
          {categories.map((category: Category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center space-x-2 py-2 px-4 bg-white data-[state=active]:border-indigo-500 data-[state=active]:bg-blue-100 data-[state=active]:shadow-sm"
            >
              <span>{category.name}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {getProductsCountByCategory(category.id)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product: Product) => {
            const defaultVariant = getDefaultVariant(product); // First variant for display
            const firstActiveVariant = getFirstActiveVariant(product); // First active variant for operations
            const priceRange = getPriceRange(product);
            const productIsOutOfStock = isOutOfStock(product);
            const productHasLowStock = hasLowStock(product);
            
            return (
              <Card
                key={product.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-1">
                  <div className="flex items-center justify-between">
                    <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center text-2xl overflow-hidden">
                      {defaultVariant?.image ? (
                        <img
                          src={`https://res.cloudinary.com/dap7sy5lk/image/upload/v1758647199/svm-consumer-store/${defaultVariant.name}.jpg`}
                          alt={product.name}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <img
                          src="https://res.cloudinary.com/dap7sy5lk/image/upload/v1758647199/svm-consumer-store/Wax__Crayons_Kores.jpg"
                          alt={product.name}
                          className="object-contain w-full h-full"
                        />
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      {product.variantCount === 1 && firstActiveVariant ? (
                        <span className="text-lg font-bold text-green-600">
                          ₹{firstActiveVariant.price.toFixed(2)}
                        </span>
                      ) : product.variantCount && product.variantCount > 1 && priceRange ? (
                        <div className="text-right">
                          <span className="text-lg font-bold text-green-600">
                            ₹{priceRange.min.toFixed(2)}
                            {priceRange.min !== priceRange.max && ` - ₹${priceRange.max.toFixed(2)}`}
                          </span>
                          <Badge variant="secondary" className="mt-1 block">
                            {product.variantCount} Variants
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No variants</span>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {product.variantCount === 1 && firstActiveVariant && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span
                          className={`text-sm font-medium ${
                            firstActiveVariant.stock <= firstActiveVariant.lowStockThreshold
                              ? "text-red-600"
                              : "text-gray-700"
                          }`}
                        >
                          Stock: {firstActiveVariant.stock}
                        </span>
                        {productHasLowStock && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(product.categoryId)}
                      </Badge>
                    </div>
                  )}

                  {product.variantCount && product.variantCount > 1 && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {product.variants?.filter(v => v.isActive).length || 0} active variants
                        </span>
                        {productIsOutOfStock && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(product.categoryId)}
                      </Badge>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {product.variantCount && product.variantCount > 1 ? (
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={productIsOutOfStock}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {productIsOutOfStock ? "All Out of Stock" : "View Variants"}
                      </Button>
                    ) : firstActiveVariant ? (
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={firstActiveVariant.stock <= 0}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {firstActiveVariant.stock <= 0
                          ? "Out of Stock"
                          : "Add to Cart"}
                      </Button>
                    ) : (
                      <Button disabled className="flex-1 bg-gray-400 text-white">
                        No Variants Available
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Tabs>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
      
      {selectedProduct && (
        <ProductVariantsModal
          isOpen={showVariantsModal}
          onClose={() => setShowVariantsModal(false)}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onAddToCart={handleVariantAddToCart}
        />
      )}
    </div>
  );
}


// "use client"

// import { useState } from "react"
// import { useQuery } from "@tanstack/react-query"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Search, Package, AlertTriangle, Eye, ShoppingCart } from "lucide-react"
// import { toast } from "sonner"
// import { ProductVariantsModal } from "@/components/modals/product-variants-modal"
// import type { Product, CartItemInput, SubProduct, Category } from "@/lib/types"

// interface ProductGridProps {
//   onAddToCart: (item: CartItemInput) => void
// }

// export default function ProductGrid({ onAddToCart }: ProductGridProps) {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedCategory, setSelectedCategory] = useState<string>("all")
//   const [showVariantsModal, setShowVariantsModal] = useState(false)
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

//   const { data: productsData, isLoading: productsLoading } = useQuery({
//     queryKey: ["products-active"],
//     queryFn: async () => {
//       const response = await fetch("/api/products")
//       if (!response.ok) throw new Error("Failed to fetch products")
//       const data = await response.json()
//       return data || []
//     },
//   })

//   const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
//     queryKey: ["categories-active"],
//     queryFn: async () => {
//       const response = await fetch("/api/categories")
//       if (!response.ok) throw new Error("Failed to fetch categories")
//       const data = await response.json()
//       return data || []
//     },
//   })

//   const products = Array.isArray(productsData) ? productsData.filter((product: Product) => product.isActive) : []
//   const categories = Array.isArray(categoriesData) ? categoriesData.filter((category: any) => category.isActive) : []

//   // Helper function to get the first variant as default (for display purposes)
//   const getDefaultVariant = (product: Product): SubProduct | null => {
//     if (!product.variants || product.variants.length === 0) return null
//     // Return the first variant (active or inactive) for display purposes
//     return product.variants[0]
//   }

//   // Helper function to get the first active variant for cart operations
//   const getFirstActiveVariant = (product: Product): SubProduct | null => {
//     if (!product.variants || product.variants.length === 0) return null
//     return product.variants.find((variant) => variant.isActive) || null
//   }

//   // Helper function to get price range for multiple variants
//   const getPriceRange = (product: Product): { min: number; max: number } | null => {
//     if (!product.variants || product.variants.length === 0) return null
//     const activePrices = product.variants.filter((variant) => variant.isActive).map((variant) => variant.price)

//     if (activePrices.length === 0) return null

//     return {
//       min: Math.min(...activePrices),
//       max: Math.max(...activePrices),
//     }
//   }

//   // Helper function to check if product has low stock
//   const hasLowStock = (product: Product): boolean => {
//     const firstActiveVariant = getFirstActiveVariant(product)
//     return firstActiveVariant ? firstActiveVariant.stock <= firstActiveVariant.lowStockThreshold : false
//   }

//   // Helper function to check if product is out of stock
//   const isOutOfStock = (product: Product): boolean => {
//     if (product.variantCount === 1) {
//       const firstActiveVariant = getFirstActiveVariant(product)
//       return firstActiveVariant ? firstActiveVariant.stock <= 0 : true
//     }
//     // For multiple variants, check if all are out of stock
//     return product.variants?.every((variant) => !variant.isActive || variant.stock <= 0) ?? true
//   }

//   const handleAddToCart = (product: Product) => {
//     // If product has multiple variants, show variants modal
//     if (product.variantCount && product.variantCount > 1) {
//       setSelectedProduct(product)
//       setShowVariantsModal(true)
//       return
//     }

//     // If product has exactly one variant, add it directly to cart
//     const firstActiveVariant = getFirstActiveVariant(product)
//     if (firstActiveVariant) {
//       if (firstActiveVariant.stock <= 0) {
//         toast.error("Product is out of stock")
//         return
//       }

//       // FIXED: Create proper CartItem with subProductId as the unique identifier
//       const cartItem: CartItemInput = {
//         itemKey: `sub:${firstActiveVariant.id}`,
//         subProductId: firstActiveVariant.id,
//         productId: product.id, // Include productId for reference
//         name: firstActiveVariant.name,
//         price: firstActiveVariant.price,
//         quantity: 1,
//         stock: firstActiveVariant.stock,
//         itemType: "subProduct",
//       }

//       onAddToCart(cartItem)
//       toast.success(`${firstActiveVariant.name} added to cart`)
//       return
//     }

//     // Fallback for products without variants
//     toast.error("This product has no available variants")
//   }

//   const handleVariantAddToCart = (variant: SubProduct, quantity: number) => {
//     // FIXED: Create proper CartItem with subProductId as the unique identifier
//     const cartItem: CartItemInput = {
//       itemKey: `sub:${variant.id}`,
//       subProductId: variant.id,
//       productId: selectedProduct?.id, // Include productId for reference
//       name: variant.name,
//       price: variant.price,
//       quantity,
//       stock: variant.stock,
//       itemType: "subProduct",
//     }

//     onAddToCart(cartItem)
//     setShowVariantsModal(false)
//     toast.success(`${variant.name} added to cart`)
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

//   const getProductsCountByCategory = (categoryId: string) => {
//     if (categoryId === "all") {
//       return products.filter((product: Product) => product.name.toLowerCase().includes(searchTerm.toLowerCase())).length
//     }
//     return products.filter(
//       (product: Product) =>
//         product.categoryId === categoryId && product.name.toLowerCase().includes(searchTerm.toLowerCase()),
//     ).length
//   }

//   const filteredProducts = products.filter((product: Product) => {
//     const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory
//     return matchesSearch && matchesCategory
//   })

//   if (productsLoading || categoriesLoading) {
//     return <div className="text-center py-8">Loading products...</div>
//   }

//   return (
//     <div className="space-y-2">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Products</h2>
//         <Badge variant="outline" className="text-sm">
//           {filteredProducts.length} products available
//         </Badge>
//       </div>

//       {/* Search and Filter */}
//       <Card>
//         <CardContent className="">
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
//                   {categories.map((category: any) => (
//                     <SelectItem key={category.id} value={category.id}>
//                       {category.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
//         <TabsList className="flex w-full gap-1 h-auto p-1 bg-gray-100 overflow-x-auto">
//           <TabsTrigger
//             value="all"
//             className="flex items-center space-x-2 py-2 px-4 bg-white data-[state=active]:border-indigo-500 data-[state=active]:bg-blue-100 data-[state=active]:shadow-sm"
//           >
//             <span>All Categories</span>
//             <Badge variant="secondary" className="ml-1 text-xs">
//               {getProductsCountByCategory("all")}
//             </Badge>
//           </TabsTrigger>
//           {categories.map((category: Category) => (
//             <TabsTrigger
//               key={category.id}
//               value={category.id}
//               className="flex items-center space-x-2 py-2 px-4 bg-white data-[state=active]:border-indigo-500 data-[state=active]:bg-blue-100 data-[state=active]:shadow-sm"
//             >
//               <span>{category.name}</span>
//               <Badge variant="secondary" className="ml-1 text-xs">
//                 {getProductsCountByCategory(category.id)}
//               </Badge>
//             </TabsTrigger>
//           ))}
//         </TabsList>

//         {/* Products Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {filteredProducts.map((product: Product) => {
//             const defaultVariant = getDefaultVariant(product) // First variant for display
//             const firstActiveVariant = getFirstActiveVariant(product) // First active variant for operations
//             const priceRange = getPriceRange(product)
//             const productIsOutOfStock = isOutOfStock(product)
//             const productHasLowStock = hasLowStock(product)

//             return (
//               <Card key={product.id} className="hover:shadow-lg transition-shadow">
//                 <CardHeader className="pb-1">
//                   <div className="flex items-center justify-between">
//                     <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center text-2xl overflow-hidden">
//                       {defaultVariant?.image ? (
//                         <img
//                           src={defaultVariant.image || "/placeholder.svg"}
//                           alt={product.name}
//                           className="object-contain w-full h-full"
//                         />
//                       ) : (
//                         <img
//                           src="https://res.cloudinary.com/X.jpg"
//                           alt={product.name}
//                           className="object-contain w-full h-full"
//                         />
//                       )}
//                     </div>
//                     <div className="flex flex-col items-end">
//                       {product.variantCount === 1 && firstActiveVariant ? (
//                         <span className="text-lg font-bold text-green-600">₹{firstActiveVariant.price.toFixed(2)}</span>
//                       ) : product.variantCount && product.variantCount > 1 && priceRange ? (
//                         <div className="text-right">
//                           <span className="text-lg font-bold text-green-600">
//                             ₹{priceRange.min.toFixed(2)}
//                             {priceRange.min !== priceRange.max && ` - ₹${priceRange.max.toFixed(2)}`}
//                           </span>
//                           <Badge variant="secondary" className="mt-1 block">
//                             {product.variantCount} Variants
//                           </Badge>
//                         </div>
//                       ) : (
//                         <span className="text-sm text-gray-500">No variants</span>
//                       )}
//                     </div>
//                   </div>
//                   <CardTitle className="text-lg">{product.name}</CardTitle>
//                   {product.description && <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>}
//                 </CardHeader>
//                 <CardContent className="pt-0">
//                   {product.variantCount === 1 && firstActiveVariant && (
//                     <div className="flex items-center justify-between mb-4">
//                       <div className="flex items-center space-x-2">
//                         <Package className="w-4 h-4 text-gray-500" />
//                         <span
//                           className={`text-sm font-medium ${
//                             firstActiveVariant.stock <= firstActiveVariant.lowStockThreshold
//                               ? "text-red-600"
//                               : "text-gray-700"
//                           }`}
//                         >
//                           Stock: {firstActiveVariant.stock}
//                         </span>
//                         {productHasLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
//                       </div>
//                       <Badge variant="outline" className="text-xs">
//                         {getCategoryName(product.categoryId)}
//                       </Badge>
//                     </div>
//                   )}

//                   {product.variantCount && product.variantCount > 1 && (
//                     <div className="flex items-center justify-between mb-4">
//                       <div className="flex items-center space-x-2">
//                         <Package className="w-4 h-4 text-gray-500" />
//                         <span className="text-sm font-medium text-gray-700">
//                           {product.variants?.filter((v) => v.isActive).length || 0} active variants
//                         </span>
//                         {productIsOutOfStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
//                       </div>
//                       <Badge variant="outline" className="text-xs">
//                         {getCategoryName(product.categoryId)}
//                       </Badge>
//                     </div>
//                   )}

//                   <div className="flex space-x-2">
//                     {product.variantCount && product.variantCount > 1 ? (
//                       <Button
//                         onClick={() => handleAddToCart(product)}
//                         className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
//                         disabled={productIsOutOfStock}
//                       >
//                         <Eye className="w-4 h-4 mr-2" />
//                         {productIsOutOfStock ? "All Out of Stock" : "View Variants"}
//                       </Button>
//                     ) : firstActiveVariant ? (
//                       <Button
//                         onClick={() => handleAddToCart(product)}
//                         disabled={firstActiveVariant.stock <= 0}
//                         className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400"
//                       >
//                         <ShoppingCart className="w-4 h-4 mr-2" />
//                         {firstActiveVariant.stock <= 0 ? "Out of Stock" : "Add to Cart"}
//                       </Button>
//                     ) : (
//                       <Button disabled className="flex-1 bg-gray-400 text-white">
//                         No Variants Available
//                       </Button>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             )
//           })}
//         </div>
//       </Tabs>

//       {filteredProducts.length === 0 && (
//         <div className="text-center py-12">
//           <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
//           <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
//         </div>
//       )}

//       {selectedProduct && (
//         <ProductVariantsModal
//           isOpen={showVariantsModal}
//           onClose={() => setShowVariantsModal(false)}
//           productId={selectedProduct.id}
//           productName={selectedProduct.name}
//           onAddToCart={handleVariantAddToCart}
//         />
//       )}
//     </div>
//   )
// }