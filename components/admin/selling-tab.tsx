"use client";

import { useState, useCallback } from "react";
import ProductGrid from "@/components/seller/product-grid";
import ShoppingCart from "@/components/seller/shopping-cart";
import type { CartItem, Student } from "@/lib/types";
import StudentLookup from "../seller/student-lookup";

// interface PosPageProps {
//   selectedStudent: Student | null;
// }

export default function PosPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)


  // FIXED: Use subProductId as the unique identifier for all cart operations
  const getCartItemId = (item: CartItem): string => {
    if (!item.subProductId) {
      console.error("CartItem missing subProductId:", item);
      throw new Error("All cart items must have a subProductId");
    }
    return item.subProductId;
  };

  // FIXED: Add to cart function that properly handles variants
  const handleAddToCart = useCallback((newItem: CartItem) => {
    if (!newItem.subProductId) {
      console.error("Cannot add item without subProductId:", newItem);
      return;
    }

    setCartItems(prevItems => {
      const itemId = getCartItemId(newItem);
      const existingItemIndex = prevItems.findIndex(item => getCartItemId(item) === itemId);

      if (existingItemIndex >= 0) {
        // Item already exists, update quantity
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + newItem.quantity;
        
        // Check stock limit
        if (newQuantity <= existingItem.stock) {
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity
          };
          return updatedItems;
        } else {
          console.warn("Cannot add more items - stock limit reached");
          return prevItems;
        }
      } else {
        // New item, add to cart
        return [...prevItems, newItem];
      }
    });
  }, []);

  // FIXED: Update quantity function using subProductId
  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (getCartItemId(item) === itemId) {
          // Check stock limit
          if (newQuantity <= item.stock) {
            return { ...item, quantity: newQuantity };
          } else {
            console.warn("Cannot update quantity - exceeds stock limit");
            return item;
          }
        }
        return item;
      });
    });
  }, []);

  // FIXED: Remove item function using subProductId
  const handleRemoveItem = useCallback((itemId: string) => {
    setCartItems(prevItems => {
      return prevItems.filter(item => getCartItemId(item) !== itemId);
    });
  }, []);

  // Clear cart function
  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Transaction complete handler
  const handleTransactionComplete = useCallback(() => {
    setCartItems([]);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Products Grid - Takes up 2/3 of the space on large screens */}
      <div className="lg:col-span-2">
        <StudentLookup selectedStudent={selectedStudent} onStudentSelect={setSelectedStudent} />
        <ProductGrid onAddToCart={handleAddToCart} />
      </div>

      {/* Shopping Cart - Takes up 1/3 of the space on large screens */}
      <div className="lg:col-span-1">
        <ShoppingCart
          selectedStudent={selectedStudent}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onTransactionComplete={handleTransactionComplete}
        />
      </div>
    </div>
  );
}

// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { useAuthStore } from "@/lib/store/auth-store"
// import { useQuery } from "@tanstack/react-query"
// import StudentLookup from "@/components/seller/student-lookup"
// import ProductGrid from "@/components/seller/product-grid"
// import ShoppingCart from "@/components/seller/shopping-cart"
// import type { Student, CartItem, SubProduct } from "@/lib/types"

// export default function SellerInterface() {
//   const router = useRouter()
//   const { logout } = useAuthStore()
//   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
//   const [cartItems, setCartItems] = useState<CartItem[]>([])

//   const { data: dashboardStats } = useQuery({
//     queryKey: ["dashboard-stats"],
//     queryFn: async () => {
//       const response = await fetch("/api/dashboard/stats")
//       if (!response.ok) throw new Error("Failed to fetch stats")
//       return response.json()
//     },
//   })

//   // const handleLogout = () => {
//   //   logout()
//   //   router.push("/login")
//   // }

//   const addToCart = (product: SubProduct) => {
//     if (product.stock <= 0) return

//     const itemId = product.productId || product.id
//     const existingItem = cartItems.find((item) => {
//       const existingItemId = item.subProductId || item.productId
//       return existingItemId === itemId
//     })

//     if (existingItem) {
//       if (existingItem.quantity < product.stock) {
//         setCartItems((items) =>
//           items.map((item) => {
//             const existingItemId = item.subProductId || item.productId
//             return existingItemId === itemId ? { ...item, quantity: item.quantity + 1 } : item
//           }),
//         )
//       }
//     } else {
//       setCartItems((items) => [
//         ...items,
//         {
//           productId: product.productId || product.id,
//           subProductId: product.id,
//           name: product.name,
//           price: product.price,
//           quantity: 1,
//           stock: product.stock,
//           itemType: product.id ? "subProduct" : "product",
//         },
//       ])
//     }
//   }

//   const removeFromCart = (productId: string, subProductId?: string) => {
//     const itemId = subProductId || productId
//     const existingItem = cartItems.find((item) => {
//       const existingItemId = item.subProductId || item.productId
//       return existingItemId === itemId
//     })

//     if (existingItem) {
//       if (existingItem.quantity > 1) {
//         setCartItems((items) =>
//           items.map((item) => {
//             const existingItemId = item.subProductId || item.productId
//             return existingItemId === itemId ? { ...item, quantity: item.quantity - 1 } : item
//           }),
//         )
//       } else {
//         setCartItems((items) =>
//           items.filter((item) => {
//             const existingItemId = item.subProductId || item.productId
//             return existingItemId !== itemId
//           }),
//         )
//       }
//     }
//   }

//   const updateCartItemQuantity = (productId: string, newQuantity: number, subProductId?: string) => {
//     const itemId = subProductId || productId
//     if (newQuantity <= 0) {
//       setCartItems((items) =>
//         items.filter((item) => {
//           const existingItemId = item.subProductId || item.productId
//           return existingItemId !== itemId
//         }),
//       )
//     } else {
//       setCartItems((items) =>
//         items.map((item) => {
//           const existingItemId = item.subProductId || item.productId
//           return existingItemId === itemId ? { ...item, quantity: newQuantity } : item
//         }),
//       )
//     }
//   }

//   const removeFromCartCompletely = (productId: string, subProductId?: string) => {
//     const itemId = subProductId || productId
//     setCartItems((items) =>
//       items.filter((item) => {
//         const existingItemId = item.subProductId || item.productId
//         return existingItemId !== itemId
//       }),
//     )
//   }

//   const clearCart = () => {
//     setCartItems([])
//   }

//   const resetTransaction = () => {
//     setSelectedStudent(null)
//     clearCart()
//   }

//   return (
//     <div className="space-y-1">
//       {/* Main POS Interface */}
//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Left Side: Student Search & Products */}
//         <div className="lg:col-span-3 space-y-2">
//           <StudentLookup selectedStudent={selectedStudent} onStudentSelect={setSelectedStudent} />
//           <ProductGrid onAddToCart={addToCart} onRemoveFromCart={removeFromCart} cartItems={cartItems} />
//         </div>

//         {/* Right Side: Shopping Cart */}
//         <div>
//           <ShoppingCart
//             selectedStudent={selectedStudent}
//             cartItems={cartItems}
//             onUpdateQuantity={updateCartItemQuantity}
//             onRemoveItem={removeFromCartCompletely}
//             onClearCart={clearCart}
//             onTransactionComplete={resetTransaction}
//           />
//         </div>
//       </div>
//     </div>
//   )
// }