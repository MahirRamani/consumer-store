// app/api/dashboard/weekly-sales/route.ts
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"

interface DailySales {
  [key: string]: number
}

interface SalesData {
  date: string
  items: number
  day: string
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(today.getDate() - 7)

    const transactions = await Transaction.find({
      createdAt: { $gte: weekAgo, $lte: today },
      status: "completed",
    })

    // Group by day and calculate total items sold
    const dailySales: DailySales = {}

    // Initialize all days in the week with 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      const dateKey = date.toISOString().split("T")[0]
      dailySales[dateKey] = 0
    }

    // Calculate sales for each day
    transactions.forEach((transaction) => {
      const dateKey = transaction.createdAt.toISOString().split("T")[0]
      
      if (dailySales[dateKey] !== undefined) {
        if (itemId && itemId !== 'all') {
          // Filter by specific item using productId (not id)
          const filteredItems = transaction.items.filter((item: any) => 
            item.productId.toString() === itemId
          )
          const totalItems = filteredItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
          dailySales[dateKey] += totalItems
        } else {
          // All items
          const totalItems = transaction.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
          dailySales[dateKey] += totalItems
        }
      }
    })

    const salesData: SalesData[] = Object.entries(dailySales).map(([date, items]) => ({
      date,
      items,
      day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
    }))

    return NextResponse.json(salesData)
  } catch (error) {
    console.error("Error fetching weekly sales:", error)
    return NextResponse.json({ message: "Failed to fetch weekly sales" }, { status: 500 })
  }
}
// // app/api/dashboard/weekly-sales/route.ts  2
// import { NextResponse } from "next/server"
// import dbConnect from "@/lib/mongodb"
// import { Transaction } from "@/lib/models/transaction"

// export async function GET(request: Request) {
//   try {
//     await dbConnect()

//     const { searchParams } = new URL(request.url)
//     const itemId = searchParams.get('itemId')

//     // Get transactions from the last 7 days
//     const sevenDaysAgo = new Date()
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

//     let matchCondition: any = {
//       status: "completed",
//       createdAt: { $gte: sevenDaysAgo }
//     }

//     // If specific item is requested, filter by productId
//     if (itemId && itemId !== 'all') {
//       matchCondition["items.productId"] = itemId
//     }

//     const transactions = await Transaction.find(matchCondition)

//     // Process transactions to get daily sales data
//     const dailySales: { [key: string]: number } = {}
    
//     // Initialize all 7 days with 0
//     const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
//     const today = new Date()
    
//     for (let i = 6; i >= 0; i--) {
//       const date = new Date(today)
//       date.setDate(date.getDate() - i)
//       const dayName = days[date.getDay()]
//       dailySales[dayName] = 0
//     }

//     // Aggregate sales data
//     transactions.forEach((transaction) => {
//       const transactionDate = new Date(transaction.createdAt)
//       const dayName = days[transactionDate.getDay()]
      
//       if (itemId && itemId !== 'all') {
//         // For specific item, count quantity of that specific product
//         transaction.items.forEach((item: any) => {
//           if (item.productId.toString() === itemId) {
//             dailySales[dayName] += item.quantity
//           }
//         })
//       } else {
//         // For all items, count total quantity of all products
//         transaction.items.forEach((item: any) => {
//           dailySales[dayName] += item.quantity
//         })
//       }
//     })

//     // Convert to array format expected by the chart
//     const salesData = Object.entries(dailySales).map(([day, items]) => ({
//       day,
//       items,
//       date: new Date().toISOString().split('T')[0] // You might want to use actual dates
//     }))

//     return NextResponse.json(salesData)
//   } catch (error) {
//     console.error("Error fetching weekly sales:", error)
//     return NextResponse.json({ message: "Failed to fetch weekly sales" }, { status: 500 })
//   }
// }
// // // app/api/dashboard/weekly-sales/route.ts
// // import { NextResponse } from "next/server"
// // import { NextRequest } from "next/server"
// // import dbConnect from "@/lib/mongodb"
// // import { Transaction } from "@/lib/models/transaction"

// // interface DailySales {
// //   [key: string]: number
// // }

// // interface SalesData {
// //   date: string
// //   items: number
// //   day: string
// // }

// // export async function GET(request: NextRequest) {
// //   try {
// //     await dbConnect()

// //     const { searchParams } = new URL(request.url)
// //     const itemId = searchParams.get("itemId")

// //     const today = new Date()
// //     const weekAgo = new Date()
// //     weekAgo.setDate(today.getDate() - 7)

// //     const transactions = await Transaction.find({
// //       createdAt: { $gte: weekAgo, $lte: today },
// //       status: "completed",
// //     })

// //     // Group by day and calculate total items sold
// //     const dailySales: DailySales = {}

// //     // Initialize all days in the week with 0
// //     for (let i = 6; i >= 0; i--) {
// //       const date = new Date()
// //       date.setDate(today.getDate() - i)
// //       const dateKey = date.toISOString().split("T")[0]
// //       dailySales[dateKey] = 0
// //     }

// //     // Calculate sales for each day
// //     transactions.forEach((transaction) => {
// //       const dateKey = transaction.createdAt.toISOString().split("T")[0]
      
// //       if (dailySales[dateKey] !== undefined) {
// //         if (itemId) {
// //           // Filter by specific item
// //           const filteredItems = transaction.items.filter((item: any) => item.id === itemId)
// //           const totalItems = filteredItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
// //           dailySales[dateKey] += totalItems
// //         } else {
// //           // All items
// //           const totalItems = transaction.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
// //           dailySales[dateKey] += totalItems
// //         }
// //       }
// //     })

// //     const salesData: SalesData[] = Object.entries(dailySales).map(([date, items]) => ({
// //       date,
// //       items,
// //       day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
// //     }))

// //     return NextResponse.json(salesData)
// //   } catch (error) {
// //     console.error("Error fetching weekly sales:", error)
// //     return NextResponse.json({ message: "Failed to fetch weekly sales" }, { status: 500 })
// //   }
// // }


// // // import { NextResponse } from "next/server"
// // // import dbConnect from "@/lib/mongodb"
// // // import { Transaction } from "@/lib/models/transaction"

// // // interface DailySales {
// // //   [key: string]: number
// // // }

// // // interface SalesData {
// // //   date: string
// // //   items: number
// // //   day: string
// // // }

// // // export async function GET() {
// // //   try {
// // //     await dbConnect()

// // //     const today = new Date()
// // //     const weekAgo = new Date()
// // //     weekAgo.setDate(today.getDate() - 7)

// // //     const transactions = await Transaction.find({
// // //       createdAt: { $gte: weekAgo, $lte: today },
// // //       status: "completed",
// // //     })

// // //     // Group by day and calculate total items sold
// // //     const dailySales: DailySales = {}

// // //     // Initialize all days in the week with 0
// // //     for (let i = 6; i >= 0; i--) {
// // //       const date = new Date()
// // //       date.setDate(today.getDate() - i)
// // //       const dateKey = date.toISOString().split("T")[0]
// // //       dailySales[dateKey] = 0
// // //     }

// // //     // Calculate sales for each day
// // //     transactions.forEach((transaction) => {
// // //       const dateKey = transaction.createdAt.toISOString().split("T")[0]
// // //       const totalItems = transaction.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
// // //       if (dailySales[dateKey] !== undefined) {
// // //         dailySales[dateKey] += totalItems
// // //       }
// // //     })

// // //     const salesData: SalesData[] = Object.entries(dailySales).map(([date, items]) => ({
// // //       date,
// // //       items,
// // //       day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
// // //     }))

// // //     return NextResponse.json(salesData)
// // //   } catch (error) {
// // //     console.error("Error fetching weekly sales:", error)
// // //     return NextResponse.json({ message: "Failed to fetch weekly sales" }, { status: 500 })
// // //   }
// // // }
