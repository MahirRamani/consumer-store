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

// ===== TYPE DEFINITIONS =====
interface SubProduct {
  id: string;
  productId: string;
  name: string;
  description?: string;
  size: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  weight?: string;
  volume?: string;
  barcode?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EnhancedProduct {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: string;
  isActive: boolean;
  hasVariants: boolean;
  variantCount: number;
  variants: SubProduct[];
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  subProductId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  itemType: "subProduct";
}

interface ProductGridProps {
  onAddToCart: (item: CartItem) => void;
}

// ===== HELPER FUNCTIONS =====
const getFirstVariant = (product: EnhancedProduct): SubProduct | undefined => {
  return product.variants?.[0];
};

const getProductDisplayImage = (product: EnhancedProduct): string => {
  return getFirstVariant(product)?.image || "https://res.cloudinary.com/x.png";
};

const getProductPrice = (product: EnhancedProduct): number => {
  return getFirstVariant(product)?.price || 0;
};

const getProductStock = (product: EnhancedProduct): number => {
  return getFirstVariant(product)?.stock || 0;
};

const isLowStock = (product: EnhancedProduct): boolean => {
  const firstVariant = getFirstVariant(product);
  if (!firstVariant) return false;
  return firstVariant.stock <= firstVariant.lowStockThreshold;
};

// ===== MAIN COMPONENT =====
export default function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products-active"],
    queryFn: async (): Promise<EnhancedProduct[]> => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return data || [];
    },
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories-active"],
    queryFn: async (): Promise<Category[]> => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      return data || [];
    },
  });

  // Filter active products and categories
  const products = (productsData || []).filter(
    (product: EnhancedProduct) => product.isActive
  );
  const categories = (categoriesData || []).filter(
    (category: Category) => category.isActive
  );

  // Handle add to cart action
  const handleAddToCart = (product: EnhancedProduct) => {
    // If product has multiple variants, show variants modal
    if (product.variantCount && product.variantCount > 1) {
      setSelectedProduct(product);
      setShowVariantsModal(true);
      return;
    }

    // Get first variant for single variant products
    const firstVariant = getFirstVariant(product);
    if (firstVariant) {
      if (firstVariant.stock <= 0) {
        toast.error("Product is out of stock");
        return;
      }

      onAddToCart({
        subProductId: firstVariant.id,
        name: firstVariant.name,
        price: firstVariant.price,
        quantity: 1,
        stock: firstVariant.stock,
        itemType: "subProduct",
      });
      toast.success(`${firstVariant.name} added to cart`);
      return;
    }

    toast.error("This product has no available variants");
  };

  // Handle variant selection from modal
  const handleVariantAddToCart = (variant: SubProduct, quantity: number) => {
    onAddToCart({
      subProductId: variant.id,
      name: variant.name,
      price: variant.price,
      quantity,
      stock: variant.stock,
      itemType: "subProduct",
    });
    setShowVariantsModal(false);
    toast.success(`${variant.name} added to cart`);
  };

  // Get category icon (optional - you can remove if not using)
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

  // Get category name from ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: Category) => cat.id === categoryId);
    return category?.name || "Uncategorized";
  };

  // Count products by category (for badges)
  const getProductsCountByCategory = (categoryId: string) => {
    if (categoryId === "all") {
      return products.filter((product: EnhancedProduct) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).length;
    }
    return products.filter(
      (product: EnhancedProduct) =>
        product.categoryId === categoryId &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).length;
  };

  // Filter products based on search and category
  const filteredProducts = products.filter((product: EnhancedProduct) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Loading state
  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <Badge variant="outline" className="text-sm">
          {filteredProducts.length} products available
        </Badge>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by product name..."
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

      {/* Category Tabs */}
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
              className="flex items-center space-x-2 py-2 px-4 bg-white data-[state=active]:border-indigo-500 data-[state=active]:bg-blue-100 data-[state=active]:shadow-sm whitespace-nowrap"
            >
              <span>{category.name}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {getProductsCountByCategory(category.id)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Products Grid */}
        <div className="mt-6">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product: EnhancedProduct) => {
                const firstVariant = getFirstVariant(product);
                const displayImage = getProductDisplayImage(product);
                const isOutOfStock = firstVariant ? firstVariant.stock <= 0 : true;
                const lowStock = isLowStock(product);

                return (
                  <Card
                    key={product.id}
                    className="hover:shadow-lg transition-shadow duration-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        {/* Product Image */}
                        <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={displayImage}
                            alt={product.name}
                            className="object-contain w-full h-full"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (target.src !== "https://res.cloudinary.com/x.png") {
                                target.src = "https://res.cloudinary.com/x.png";
                              }
                            }}
                            loading="lazy"
                          />
                        </div>

                        {/* Price/Variants Info */}
                        <div className="flex flex-col items-end">
                          {product.variantCount === 1 && firstVariant ? (
                            <span className="text-lg font-bold text-green-600">
                              ₹{firstVariant.price.toFixed(2)}
                            </span>
                          ) : product.variantCount > 1 ? (
                            <Badge variant="secondary" className="mt-1">
                              {product.variantCount} Variants
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-500">No variants</span>
                          )}
                        </div>
                      </div>

                      {/* Product Name and Description */}
                      <div className="space-y-2">
                        <CardTitle className="text-lg leading-tight">
                          {product.name}
                        </CardTitle>
                        {product.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Single Variant Stock Info */}
                      {product.variantCount === 1 && firstVariant && (
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span
                              className={`text-sm font-medium ${
                                lowStock ? "text-red-600" : "text-gray-700"
                              }`}
                            >
                              Stock: {firstVariant.stock}
                            </span>
                            {lowStock && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryName(product.categoryId)}
                          </Badge>
                        </div>
                      )}

                      {/* Multi Variant Category Info */}
                      {product.variantCount > 1 && (
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryName(product.categoryId)}
                          </Badge>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        {product.variantCount > 1 ? (
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Variants
                          </Button>
                        ) : firstVariant ? (
                          <Button
                            onClick={() => handleAddToCart(product)}
                            disabled={isOutOfStock}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                          </Button>
                        ) : (
                          <Button 
                            disabled 
                            className="flex-1 bg-gray-400 text-white cursor-not-allowed"
                          >
                            No Variants Available
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No products are available at the moment."}
              </p>
            </div>
          )}
        </div>
      </Tabs>

      {/* Product Variants Modal */}
      {selectedProduct && (
        <ProductVariantsModal
          isOpen={showVariantsModal}
          onClose={() => {
            setShowVariantsModal(false);
            setSelectedProduct(null);
          }}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onAddToCart={handleVariantAddToCart}
        />
      )}
    </div>
  );
}
// "use client";

// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import {
//   Search,
//   Package,
//   AlertTriangle,
//   Eye,
//   ShoppingCart,
// } from "lucide-react";
// import { toast } from "sonner";
// import { ProductVariantsModal } from "@/components/modals/product-variants-modal";
// import type { Product, CartItem, SubProduct, Category } from "@/lib/types";

// interface ProductGridProps {
//   onAddToCart: (item: CartItem) => void;
// }

// export default function ProductGrid({ onAddToCart }: ProductGridProps) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedCategory, setSelectedCategory] = useState<string>("all");
//   const [showVariantsModal, setShowVariantsModal] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

//   const { data: productsData, isLoading: productsLoading } = useQuery({
//     queryKey: ["products-active"],
//     queryFn: async () => {
//       const response = await fetch("/api/products");
//       if (!response.ok) throw new Error("Failed to fetch products");
//       const data = await response.json();
//       return data || [];
//     },
//   });

//   const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
//     queryKey: ["categories-active"],
//     queryFn: async () => {
//       const response = await fetch("/api/categories");
//       if (!response.ok) throw new Error("Failed to fetch categories");
//       const data = await response.json();
//       return data || [];
//     },
//   });

//   const products = (productsData || []).filter(
//     (product: Product) => product.isActive
//   );
//   const categories = (categoriesData || []).filter(
//     (category: any) => category.isActive
//   );

//   const handleAddToCart = (product: Product) => {
//     // If product has multiple variants, show variants modal
//     if (product.variantCount && product.variantCount > 1) {
//       setSelectedProduct(product);
//       setShowVariantsModal(true);
//       return;
//     }

//     // If product has exactly one variant, add it directly to cart
//     if (product.defaultVariant) {
//       const variant = product.defaultVariant;
//       if (variant.stock <= 0) {
//         toast.error("Product is out of stock");
//         return;
//       }

//       onAddToCart({
//         subProductId: variant.id,
//         name: variant.name,
//         price: variant.price,
//         quantity: 1,
//         stock: variant.stock,
//         itemType: "subProduct",
//       });
//       toast.success(`${variant.name} added to cart`);
//       return;
//     }

//     // Fallback for products without variants (shouldn't happen in new system)
//     toast.error("This product has no available variants");
//   };

//   const handleVariantAddToCart = (variant: SubProduct, quantity: number) => {
//     onAddToCart({
//       subProductId: variant.id,
//       name: variant.name,
//       price: variant.price,
//       quantity,
//       stock: variant.stock,
//       itemType: "subProduct",
//     });
//     setShowVariantsModal(false);
//     toast.success(`${variant.name} added to cart`);
//   };

//   const getCategoryIcon = (category: string) => {
//     if (!category) return "📦";

//     switch (category.toLowerCase()) {
//       case "food":
//         return "🍜";
//       case "stationery":
//         return "📚";
//       case "daily-use":
//         return "🧴";
//       case "pooja":
//         return "🔥";
//       default:
//         return "📦";
//     }
//   };

//   const getCategoryName = (categoryId: string) => {
//     const category = categories.find((cat: any) => cat.id === categoryId);
//     return category?.name || "Uncategorized";
//   };

//   const getProductsCountByCategory = (categoryId: string) => {
//     if (categoryId === "all") {
//       return products.filter((product: Product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//       ).length;
//     }
//     return products.filter(
//       (product: Product) =>
//         product.categoryId === categoryId &&
//         product.name.toLowerCase().includes(searchTerm.toLowerCase())
//     ).length;
//   };

//   const filteredProducts = products.filter((product: Product) => {
//     const matchesSearch = product.name
//       .toLowerCase()
//       .includes(searchTerm.toLowerCase());
//     const matchesCategory =
//       selectedCategory === "all" || product.categoryId === selectedCategory;
//     return matchesSearch && matchesCategory;
//   });

//   if (productsLoading || categoriesLoading) {
//     return <div className="text-center py-8">Loading products...</div>;
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
//               <Label className="block text-sm font-medium text-gray-700 mb-2">
//                 Search Products
//               </Label>
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
//               <Label className="block text-sm font-medium text-gray-700 mb-2">
//                 Category
//               </Label>
//               <Select
//                 value={selectedCategory}
//                 onValueChange={setSelectedCategory}
//               >
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
      
//       <Tabs
//         value={selectedCategory}
//         onValueChange={setSelectedCategory}
//         className="w-full"
//       >
//         <TabsList className="flex w-full gap-1 h-auto p-1 bg-gray-100 overflow-x-auto">
//           <TabsTrigger
//             value="all"
//             className="flex items-center space-x-2 py-2 px-4 bg-white data-[state=active]:border-indigo-500 data-[state=active]:bg-blue-100 data-[state=active]:shadow-sm"
//           >
//             {/* <span>📦</span> */}
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
//               {/* <span>{getCategoryIcon(category.name)}</span> */}
//               <span>{category.name}</span>
//               <Badge variant="secondary" className="ml-1 text-xs">
//                 {getProductsCountByCategory(category.id)}
//               </Badge>
//             </TabsTrigger>
//           ))}
//         </TabsList>
//         {/* Products Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {filteredProducts.map((product: Product) => (
//             <Card
//               key={product.id}
//               className="hover:shadow-lg transition-shadow"
//             >
//               <CardHeader className="pb-1">
//                 <div className="flex items-center justify-between">
//                   <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center text-2xl overflow-hidden">
//                     {product.defaultVariant?.image ? (
//                       <img
//                         src={product.defaultVariant.image || "-"}
//                         alt={product.name}
//                         // className="w-full h-full object-cover"
//                         className="object-contain w-full h-full"
//                       />
//                     ) : (
//                       // getCategoryIcon(getCategoryName(product.categoryId))
//                       <img
//                         src={
//                           "https://res.cloudinary.com/x.png"
//                         }
//                         alt={product.name}
//                         // className="w-full h-full object-cover"
//                         className="object-contain w-full h-full"
//                       />
//                     )}
//                   </div>
//                   <div className="flex flex-col items-end">
//                     {product.variantCount === 1 && product.defaultVariant ? (
//                       <span className="text-lg font-bold text-green-600">
//                         ₹{product.defaultVariant.price.toFixed(2)}
//                       </span>
//                     ) : product.variantCount && product.variantCount > 1 ? (
//                       <Badge variant="secondary" className="mt-1">
//                         {product.variantCount} Variants
//                       </Badge>
//                     ) : (
//                       <span className="text-sm text-gray-500">No variants</span>
//                     )}
//                   </div>
//                 </div>
//                 <CardTitle className="text-lg">{product.name}</CardTitle>
//                 {product.description && (
//                   <p className="text-sm text-gray-600 line-clamp-2">
//                     {product.description}
//                   </p>
//                 )}
//               </CardHeader>
//               <CardContent className="pt-0">
//                 {product.variantCount === 1 && product.defaultVariant && (
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex items-center space-x-2">
//                       <Package className="w-4 h-4 text-gray-500" />
//                       <span
//                         className={`text-sm font-medium ${
//                           product.defaultVariant.stock <=
//                           product.defaultVariant.lowStockThreshold
//                             ? "text-red-600"
//                             : "text-gray-700"
//                         }`}
//                       >
//                         Stock: {product.defaultVariant.stock}
//                       </span>
//                       {product.defaultVariant.stock <=
//                         product.defaultVariant.lowStockThreshold && (
//                         <AlertTriangle className="w-4 h-4 text-red-500" />
//                       )}
//                     </div>
//                     <Badge variant="outline" className="text-xs">
//                       {getCategoryName(product.categoryId)}
//                     </Badge>
//                   </div>
//                 )}

//                 {product.variantCount && product.variantCount > 1 && (
//                   <div className="flex items-center justify-between mb-4">
//                     <Badge variant="outline" className="text-xs">
//                       {getCategoryName(product.categoryId)}
//                     </Badge>
//                   </div>
//                 )}

//                 <div className="flex space-x-2">
//                   {product.variantCount && product.variantCount > 1 ? (
//                     <Button
//                       onClick={() => handleAddToCart(product)}
//                       className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
//                     >
//                       <Eye className="w-4 h-4 mr-2" />
//                       View Variants
//                     </Button>
//                   ) : product.defaultVariant ? (
//                     <Button
//                       onClick={() => handleAddToCart(product)}
//                       disabled={product.defaultVariant.stock <= 0}
//                       className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400"
//                     >
//                       <ShoppingCart className="w-4 h-4 mr-2" />
//                       {product.defaultVariant.stock <= 0
//                         ? "Out of Stock"
//                         : "Add to Cart"}
//                     </Button>
//                   ) : (
//                     <Button disabled className="flex-1 bg-gray-400 text-white">
//                       No Variants Available
//                     </Button>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </Tabs>
      
//       {filteredProducts.length === 0 && (
//         <div className="text-center py-12">
//           <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">
//             No products found
//           </h3>
//           <p className="text-gray-600">
//             Try adjusting your search or filter criteria.
//           </p>
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
//   );
// }