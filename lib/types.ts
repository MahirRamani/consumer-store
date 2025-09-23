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
  categoryId: string
  category?: Category
  isActive: boolean
  hasVariants: boolean
  variantCount?: number
  variants: SubProduct[]  // ✨ Just the variants array - that's it!
  createdAt: Date
  updatedAt: Date
}

export interface SubProduct {
  product?: Product
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
  barcode?: string
  image?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Student {
  id: string
  rollNumber: string
  name: string
  phone?: string
  standard: string
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
  transactionType: "purchase" | "topup" | "deduction"
  performedBy: "seller" | "accountant" | "admin"
  reason?: string
  createdAt: Date
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
  categoryId: string
  hasVariants: boolean
}

export interface EditProduct {
  name: string
  description?: string
  categoryId: string
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
  barcode?: string
  image?: string
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
  barcode?: string
  image?: string
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

// Shopping cart types
export interface CartItem {
  productId?: string
  subProductId?: string
  name: string
  price: number
  quantity: number
  stock: number
  itemType: "product" | "subProduct"
  image?: string
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

// <----- types for routes ----->

// MongoDB Document types
export interface MongoDocument {
  _id: {
    toString(): string
  }
  createdAt: Date
  updatedAt?: Date
}

// Populated document types
export interface PopulatedProduct extends MongoDocument {
  name: string
  title?: string
}

export interface PopulatedStudent extends MongoDocument {
  name: string
  rollNumber: string
  balance?: number
  standard?: string
}

export interface PopulatedSubProduct extends MongoDocument {
  name: string
  size: string
  price: number
  stock: number
  productId: {
    _id: {
      toString(): string
    }
    name: string
    categoryId: {
      _id: {
        toString(): string
      }
      name: string
    }
  }
}

// Transaction types with populated fields
export interface PopulatedTransaction extends MongoDocument {
  studentId: PopulatedStudent
  sellerId?: string
  items: TransactionItem[]
  totalAmount: number
  status: "completed" | "pending" | "cancelled"
  transactionType: "purchase" | "topup" | "deduction"
  performedBy: "seller" | "accountant" | "admin"
  reason?: string
}

// Query types
export interface DateRangeQuery {
  createdAt?: {
    $gte: Date
    $lte: Date
  }
}

export interface StudentQuery extends DateRangeQuery {
  studentId: string
}

export interface TransactionQuery extends DateRangeQuery {
  status?: string
  studentId?: string
}

// Dashboard specific types
export interface DashboardItem {
  id: string
  name: string
}

export interface DailySalesMap {
  [dateKey: string]: number
}

export interface WeeklySalesResponse {
  date: string
  items: number
  day: string
}

// Student transaction report types
export interface StudentTransactionResponse {
  student: {
    id: string
    name: string
    rollNumber: string
    standard?: string
    balance?: number
  }
  totalSpent: number
  transactionCount: number
  transactions: FormattedTransaction[]
}

export interface FormattedTransaction {
  id: string
  studentId: string
  sellerId?: string
  items: TransactionItem[]
  totalAmount: number
  status: string
  transactionType?: string
  performedBy?: string
  reason?: string
  createdAt: Date
  student: {
    name: string
    rollNumber: string
  }
}


// Inventory Log types
export interface PopulatedInventoryLog extends MongoDocument {
  subProductId: PopulatedSubProduct
  action: "stock_in" | "stock_out" | "adjustment" | "Sale"
  quantityChange: number
  previousStock: number
  newStock: number
  reason?: string
  userId: string
}

export interface FormattedInventoryLog {
  id: string
  subProductId: string
  action: string
  quantityChange: number
  previousStock: number
  newStock: number
  reason?: string
  createdAt: Date
  product: {
    name: string
    size: string
    price: number
    category: string
  }
}

// Product query and response types
export interface ProductQuery {
  isActive?: boolean
  categoryId?: string
  name?: { $regex: string; $options: string }
}

export interface PopulatedProductDocument extends MongoDocument {
  name: string
  description?: string
  categoryId: {
    _id: { toString(): string }
    name: string
  }
  isActive: boolean
  hasVariants: boolean
}
export interface EnhancedProduct {
  id: string
  name: string
  description?: string
  categoryId: string
  category?: string
  isActive: boolean
  hasVariants: boolean
  variantCount: number
  variants: SubProduct[]  // ✨ Just the variants array
  createdAt: Date
  updatedAt: Date
}

// SubProduct types
export interface SubProductQuery {
  isActive?: boolean
  productId?: string
  $or?: Array<{ [key: string]: { $regex: string; $options: string } }>
}

export interface FormattedSubProduct {
  id: string
  productId: string
  parentProduct: {
    id: string
    name: string
    categoryId: string
    category: {
      id: string
      name: string
      description?: string
    }
  }
  name: string
  size: string
  weight?: string
  volume?: string
  barcode?: string
  description?: string
  price: number
  stock: number
  lowStockThreshold: number
  image?: string
  isActive: boolean
  createdAt: Date
}

// Balance report types
export interface MonthlyBalanceStudent {
  studentId: string
  rollNumber: string
  name: string
  standard: string
  medium?: string
  lastMonthEndBalance: number
  currentMonthCredited: number
  currentMonthDebited: number
  currentMonthNet: number
  currentBalance: number
  transactionCount: number
  balanceChange: number
  balanceVerification: boolean
}

export interface MonthlyBalanceSummary {
  totalStudents: number
  totalLastMonthBalance: number
  totalCurrentMonthCredited: number
  totalCurrentMonthDebited: number
  totalCurrentBalance: number
  totalTransactions: number
  activeStudents: number
  dateRange: {
    lastMonth: { start: string; end: string }
    currentMonth: { start: string; end: string }
  }
}

// Transaction aggregation types
export interface TransactionAggregationResult {
  _id: string | null
  credited?: number
  debited?: number
  transactionCount?: number
  totalCredited?: number
  totalDebited?: number
  lastMonthEndBalance?: number
}

export interface StudentDocument {
  _id: string
  rollNumber: string
  name: string
  standard: string
  medium?: string
  currentBalance?: number
}

// Add these types to your existing types file

export interface TransactionWithDetails {
  id: string
  studentId: string
  student?: {
    id: string
    name: string
    rollNumber: string
  }
  items: string // JSON string of TransactionItem[]
  totalAmount: number
  status: "completed" | "pending" | "cancelled"
  createdAt: Date | string
}

export interface InventoryLogWithDetails {
  id: string
  subProductId: string
  action: "restock" | "sale" | "adjustment" | "stock_in" | "stock_out"
  quantityChange: number
  previousStock: number
  newStock: number
  reason?: string
  createdAt: Date | string
  product?: {
    name: string
    size: string
    price: number
    category: string
  }
}

export interface LowStockSubProduct extends SubProduct {
  parentProduct?: {
    id: string
    name: string
    category?: {
      id: string
      name: string
    }
  }
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  startIndex: number
  endIndex: number
}
export interface ApiResponse<T> {
  data: T
  pagination?: PaginationInfo
  success?: boolean
  message?: string
}

export interface QueryError {
  message: string
  status?: number
}

export interface CategoryResponse {
  id: string
  _id?: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductResponse extends Product {
  _id?: string
}

export interface ProductUpdateData {
  name?: string
  description?: string
  categoryId?: string
  hasVariants?: boolean
  isActive?: boolean
}

// API Response types
// export interface ApiResponse<T = unknown> {
//   success: boolean
//   data?: T
//   message?: string
//   error?: string
// }

// export interface PaginatedResponse<T = unknown> {
//   data: T[]
//   pagination: {
//     page: number
//     limit: number
//     total: number
//     totalPages: number
//   }
// }

// // Export types
// export interface ExportOptions {
//   format: "csv" | "excel"
//   includeInactive?: boolean
//   dateRange?: {
//     startDate: Date
//     endDate: Date
//   }
//   filters?: Record<string, unknown>
// }