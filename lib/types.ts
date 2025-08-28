export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "seller" | "accountant"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  stock: number
  lowStockThreshold: number
  categoryId: string
  category?: Category
  image?: string
  isActive: boolean
  hasVariants: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SubProduct {
  id: string
  productId: string
  parentProduct?: Product
  name: string
  description?: string
  size: string
  price: number
  stock: number
  lowStockThreshold: number
  weight?: string
  volume?: string
  sku?: string
  barcode?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Student {
  id: string
  rollNumber: string
  name: string
  email?: string
  phone?: string
  standard: string
  year: number
  balance: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  studentId: string
  student?: Student
  items: TransactionItem[]
  totalAmount: number
  paymentMethod: "balance" | "cash"
  status: "completed" | "pending" | "cancelled"
  sellerId: string
  seller?: User
  createdAt: Date
  updatedAt: Date
}

export interface TransactionItem {
  productId?: string
  subProductId?: string
  product?: Product
  subProduct?: SubProduct
  quantity: number
  price: number
  totalPrice: number
}

export interface InventoryLog {
  id: string
  productId?: string
  subProductId?: string
  product?: Product
  subProduct?: SubProduct
  type: "stock_in" | "stock_out" | "adjustment"
  quantity: number
  previousStock: number
  newStock: number
  reason?: string
  userId: string
  user?: User
  createdAt: Date
}

// Dashboard Stats
export interface DashboardStats {
  totalProducts: number
  totalStudents: number
  totalCategories: number
  totalTransactions: number
  totalRevenue: number
  lowStockProducts: number
  activeStudents: number
  inactiveStudents: number
}

// Chart Data
export interface WeeklySalesData {
  day: string
  sales: number
  transactions: number
}

export interface ProductSalesData {
  name: string
  sales: number
  revenue: number
}

// Form types
export interface AddProduct {
  name: string
  description?: string
  price: number
  stock: number
  lowStockThreshold: number
  categoryId: string
  image?: string
  hasVariants: boolean
}

export interface EditProduct {
  name: string
  description?: string
  price: number
  stock: number
  lowStockThreshold: number
  categoryId: string
  image?: string
  hasVariants: boolean
}

export interface AddCategory {
  name: string
  description?: string
}

export interface EditCategory {
  name: string
  description?: string
}

export interface AddStudent {
  rollNumber: string
  name: string
  email?: string
  phone?: string
  standard: string
  year: number
  balance: number
}

export interface EditStudent {
  rollNumber: string
  name: string
  email?: string
  phone?: string
  standard: string
  year: number
  balance: number
}

export interface AddSubProduct {
  productId: string
  name: string
  description?: string
  size: string
  price: number
  stock: number
  lowStockThreshold: number
  weight?: string
  volume?: string
  sku?: string
  barcode?: string
}

export interface EditSubProduct {
  name: string
  description?: string
  size: string
  price: number
  stock: number
  lowStockThreshold: number
  weight?: string
  volume?: string
  sku?: string
  barcode?: string
}

// Balance operations
export interface TopUpBalance {
  amount: number
  reason?: string
}

export interface DeductBalance {
  amount: number
  reason?: string
}

// Stock operations
export interface UpdateStock {
  quantity: number
  type: "add" | "subtract" | "set"
  reason?: string
}

// Search and filter types
export interface ProductFilter {
  categoryId?: string
  isActive?: boolean
  hasVariants?: boolean
  lowStock?: boolean
  search?: string
}

export interface StudentFilter {
  isActive?: boolean
  search?: string
  minBalance?: number
  maxBalance?: number
}

export interface TransactionFilter {
  studentId?: string
  sellerId?: string
  paymentMethod?: "balance" | "cash"
  startDate?: Date
  endDate?: Date
  status?: "completed" | "pending" | "cancelled"
}

// Report types
export interface StudentTransactionReport {
  student: Student
  transactions: Transaction[]
  totalAmount: number
  totalTransactions: number
  dateRange: {
    startDate: Date
    endDate: Date
  }
}

export interface TimelineReportData {
  students: Array<{
    student: Student
    transactions: Transaction[]
    totalAmount: number
    totalTransactions: number
  }>
  summary: {
    totalStudents: number
    totalTransactions: number
    totalAmount: number
  }
  dateRange: {
    startDate: Date
    endDate: Date
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Shopping cart types
export interface CartItem {
  productId?: string
  subProductId?: string
  name: string
  price: number
  quantity: number
  stock: number
  itemType: "product" | "subProduct"
}

export interface Cart {
  items: CartItem[]
  totalItems: number
  totalAmount: number
}

// Authentication types
export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "admin" | "seller" | "accountant"
  isActive: boolean
}

// Export types
export interface ExportOptions {
  format: "csv" | "excel"
  includeInactive?: boolean
  dateRange?: {
    startDate: Date
    endDate: Date
  }
  filters?: Record<string, any>
}

export interface Transaction {
  id: string
  studentId: string
  student?: Student
  sellerId: string
  seller?: User
  items: TransactionItem[]
  totalAmount: number
  status: "pending" | "completed" | "cancelled"
  transactionType: "purchase" | "topup" | "deduction"
  performedBy: "seller" | "accountant" | "admin"
  reason?: string
  createdAt: Date
}

// export interface User {
  //   id: string
//   username: string
//   role: "admin" | "seller" | "accountant"
//   name: string
//   createdAt: Date
// }

// export interface Student {
//   id: string
//   name: string
//   rollNumber: string
//   standard: string
//   year: string
//   balance: number
//   status: "active" | "inactive"
//   createdAt: Date
// }

// export interface Category {
//   id: string
//   name: string
//   description?: string
//   status: "active" | "inactive"
//   createdAt: Date
// }

// export interface Product {
//   id: string
//   name: string
//   description?: string
//   price: number
//   stock: number
//   lowStockThreshold: number
//   categoryId: string
//   category?: string
//   image?: string
//   sku?: string
//   barcode?: string
//   isActive: boolean
//   hasVariants: boolean
//   createdAt: Date
// }

// export interface SubProduct {
//   id: string
//   productId: string
//   product?: Product
//   name: string
//   size: string
//   weight?: string
//   volume?: string
//   sku?: string
//   barcode?: string
//   description?: string
//   price: number
//   stock: number
//   lowStockThreshold: number
//   isActive: boolean
//   createdAt: Date
// }

// export interface CartItem {
//   productId?: string
//   subProductId?: string
//   name: string
//   price: number
//   quantity: number
//   stock: number
//   itemType?: "product" | "subproduct"
//   size?: string
// }

// export interface TransactionItem {
//   productId?: string
//   subProductId?: string
//   name: string
//   price: number
//   quantity: number
//   size?: string
// }

// export interface Transaction {
//   id: string
//   studentId: string
//   student?: Student
//   sellerId: string
//   seller?: User
//   items: TransactionItem[]
//   totalAmount: number
//   status: "pending" | "completed" | "cancelled"
//   transactionType: "purchase" | "topup" | "deduction"
//   performedBy: "seller" | "accountant" | "admin"
//   reason?: string
//   createdAt: Date
// }

// export interface InventoryLog {
//   id: string
//   productId?: string
//   subProductId?: string
//   product?: Product
//   subProduct?: SubProduct
//   type: "stock_in" | "stock_out" | "adjustment"
//   quantity: number
//   previousStock: number
//   newStock: number
//   reason: string
//   performedBy: string
//   createdAt: Date
// }

// export interface DashboardStats {
//   totalStudents: number
//   totalProducts: number
//   totalCategories: number
//   totalTransactions: number
//   totalRevenue: number
//   lowStockProducts: number
//   activeStudents: number
//   todayTransactions: number
//   todaySales: number
// }

// export interface WeeklySalesData {
//   day: string
//   sales: number
// }

// export interface ProductSalesData {
//   name: string
//   sales: number
// }

// export interface RecentTransaction {
//   id: string
//   studentName: string
//   rollNumber: string
//   totalAmount: number
//   status: string
//   createdAt: Date
// }

// export interface RecentProduct {
//   id: string
//   name: string
//   stock: number
//   lowStockThreshold: number
//   status: string
// }

// export interface RecentStockUpdate {
//   id: string
//   productName: string
//   type: string
//   quantity: number
//   createdAt: Date
// }

// export interface StudentTransactionReport {
//   student: Student
//   totalSpent: number
//   transactionCount: number
//   transactions: Transaction[]
// }

// export interface TimelineReportData {
//   rollNumber: string
//   name: string
//   standard: string
//   totalSpent: number
//   transactionCount: number
//   lastTransaction?: Date
// }

// export interface AddProduct {
//   name: string
//   category: string
//   price: number
//   stock: number
//   lowStockThreshold: number
//   barcode?: string
//   description?: string
// }


// // export interface User {
// //   id: string
// //   username: string
// //   role: "admin" | "seller" | "accountant"
// //   name: string
// //   createdAt: Date
// // }

// // export interface Student {
// //   id: string
// //   name: string
// //   rollNumber: string
// //   standard: string
// //   year: string
// //   balance: number
// //   status: "active" | "inactive"
// //   createdAt: Date
// // }

// // export interface Category {
// //   id: string
// //   name: string
// //   description?: string
// //   status: "active" | "inactive"
// //   createdAt: Date
// // }

// // export interface Product {
// //   id: string
// //   name: string
// //   description?: string
// //   price: number
// //   stock: number
// //   lowStockThreshold: number
// //   categoryId: string
// //   category?: Category
// //   image: string
// //   sku?: string
// //   barcode?: string
// //   isActive: boolean
// //   hasVariants: boolean
// //   createdAt: Date
// // }

// // export interface SubProduct {
// //   id: string
// //   parentProductId: string
// //   parentProduct?: Product
// //   name: string
// //   size: string
// //   weight?: string
// //   volume?: string
// //   sku?: string
// //   barcode?: string
// //   description?: string
// //   price: number
// //   stock: number
// //   lowStockThreshold: number
// //   status: "active" | "inactive"
// //   createdAt: Date
// // }

// // export interface TransactionItem {
// //   productId?: string
// //   subProductId?: string
// //   name: string
// //   price: number
// //   quantity: number
// //   size?: string
// // }

// // export interface Transaction {
// //   id: string
// //   studentId: string
// //   student?: Student
// //   sellerId: string
// //   seller?: User
// //   items: TransactionItem[]
// //   totalAmount: number
// //   status: "pending" | "completed" | "cancelled"
// //   transactionType: "purchase" | "topup" | "deduction"
// //   performedBy: "seller" | "accountant" | "admin"
// //   reason?: string
// //   createdAt: Date
// // }

// // export interface InventoryLog {
// //   id: string
// //   productId?: string
// //   subProductId?: string
// //   product?: Product
// //   subProduct?: SubProduct
// //   type: "stock_in" | "stock_out" | "adjustment"
// //   quantity: number
// //   previousStock: number
// //   newStock: number
// //   reason: string
// //   performedBy: string
// //   createdAt: Date
// // }

// // export interface DashboardStats {
// //   totalStudents: number
// //   totalProducts: number
// //   totalCategories: number
// //   totalTransactions: number
// //   totalRevenue: number
// //   lowStockProducts: number
// //   activeStudents: number
// //   todayTransactions: number
// // }

// // export interface WeeklySalesData {
// //   day: string
// //   sales: number
// // }

// // export interface ProductSalesData {
// //   name: string
// //   sales: number
// // }

// // export interface RecentTransaction {
// //   id: string
// //   studentName: string
// //   rollNumber: string
// //   totalAmount: number
// //   status: string
// //   createdAt: Date
// // }

// // export interface RecentProduct {
// //   id: string
// //   name: string
// //   stock: number
// //   lowStockThreshold: number
// //   status: string
// // }

// // export interface RecentStockUpdate {
// //   id: string
// //   productName: string
// //   type: string
// //   quantity: number
// //   createdAt: Date
// // }

// // export interface StudentTransactionReport {
// //   student: Student
// //   totalSpent: number
// //   transactionCount: number
// //   transactions: Transaction[]
// // }

// // export interface TimelineReportData {
// //   rollNumber: string
// //   name: string
// //   standard: string
// //   totalSpent: number
// //   transactionCount: number
// //   lastTransaction?: Date
// // }



// // // export interface Student {
// // //   id: string
// // //   name: string
// // //   rollNumber: string
// // //   standard: string
// // //   year: number
// // //   balance: number
// // //   status: "active" | "inactive"
// // //   createdAt: Date
// // // }

// // // export interface Product {
// // //   id: string
// // //   name: string
// // //   category: string
// // //   price: number
// // //   stock: number
// // //   lowStockThreshold: number
// // //   barcode?: string
// // //   description?: string
// // //   isActive: boolean
// // //   createdAt: Date
// // // }

// // // export interface AddProduct {
// // //   name: string
// // //   category: string
// // //   price: number
// // //   stock: number
// // //   lowStockThreshold: number
// // //   barcode?: string
// // //   description?: string
// // // }

// // // export interface EditProduct {
// // //   id: string
// // //   name: string
// // //   categoryId: string
// // //   category: string
// // //   price: number
// // //   stock: number
// // //   lowStockThreshold: number
// // //   barcode?: string
// // //   description?: string
// // //   isActive: boolean
// // //   createdAt: Date
// // // }

// // // export interface Category {
// // //   id: string
// // //   name: string
// // //   description?: string
// // //   isActive: boolean
// // //   createdAt: Date
// // // }

// // // export interface Transaction {
// // //   id: string
// // //   studentId: string
// // //   sellerId: string
// // //   items: Array<{
// // //     productId: string
// // //     quantity: number
// // //     price: number
// // //   }>
// // //   totalAmount: number
// // //   status: "completed" | "failed" | "refunded"
// // //   createdAt: Date
// // // }

// // // export interface CartItem {
// // //   productId: string
// // //   name: string
// // //   price: number
// // //   quantity: number
// // //   stock: number
// // // }
