export interface Student {
  id: string
  name: string
  rollNumber: string
  standard: string
  year: number
  balance: number
  status: "active" | "inactive"
  createdAt: Date
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  lowStockThreshold: number
  barcode?: string
  description?: string
  isActive: boolean
  createdAt: Date
}

export interface AddProduct {
  name: string
  category: string
  price: number
  stock: number
  lowStockThreshold: number
  barcode?: string
  description?: string
}

export interface EditProduct {
  id: string
  name: string
  categoryId: string
  category: string
  price: number
  stock: number
  lowStockThreshold: number
  barcode?: string
  description?: string
  isActive: boolean
  createdAt: Date
}

export interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
}

export interface Transaction {
  id: string
  studentId: string
  sellerId: string
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  totalAmount: number
  status: "completed" | "failed" | "refunded"
  createdAt: Date
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
}
