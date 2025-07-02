import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"
import { Student } from "@/lib/models/student"
import { Product } from "@/lib/models/product"
import { InventoryLog } from "@/lib/models/inventory-log"
import { createTransactionSchema } from "@/lib/validations/transaction"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const dateRange = searchParams.get("dateRange") || "all"

    // Build query
    const query: any = {}

    // Status filter
    if (status !== "all") {
      query.status = status
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()
      const startDate = new Date()

      switch (dateRange) {
        case "today":
          console.log("today", startDate);
          
          startDate.setHours(0, 0, 0, 0)
          query.createdAt = { $gte: startDate }
          // startDate.setHours(0, 0, 0, 0) // Start of today (00:00:00)
          // const endOfToday = new Date()
          // endOfToday.setHours(23, 59, 59, 999) // End of today (23:59:59)
          // query.createdAt = { $gte: startDate, $lte: endOfToday }
          break
        case "week":
          startDate.setDate(now.getDate() - 7)
          query.createdAt = { $gte: startDate, $lte: now }
          break
        case "month":
          startDate.setMonth(now.getMonth() - 1)
          query.createdAt = { $gte: startDate, $lte: now }
          break
      }
    }

    // Use correct field name from Transaction model
    let transactions = await Transaction.find(query)
      .populate("studentId", "name rollNumber")
      .sort({ createdAt: -1 })
      .limit(100)

    // Search filter (applied after population)
    if (search) {
      transactions = transactions.filter((transaction) => {
        const studentName = transaction.studentId?.name?.toLowerCase() || ""
        const rollNumber = transaction.studentId?.rollNumber?.toLowerCase() || ""
        const transactionId = transaction._id.toString().toLowerCase()
        const searchLower = search.toLowerCase()

        return (
          studentName.includes(searchLower) || rollNumber.includes(searchLower) || transactionId.includes(searchLower)
        )
      })
    }

    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction._id.toString(),
      studentId: transaction.studentId._id.toString(),
      sellerId: transaction.sellerId.toString(),
      items: JSON.stringify(transaction.items),
      totalAmount: transaction.totalAmount,
      status: transaction.status,
      createdAt: transaction.createdAt,
      student: {
        name: transaction.studentId.name,
        rollNumber: transaction.studentId.rollNumber,
      },
    }))

    return NextResponse.json(formattedTransactions)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ message: "Failed to fetch transactions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { studentId, items } = createTransactionSchema.parse(body)

    // Find student by ID or roll number
    let student = await Student.findById(studentId)
    if (!student) {
      student = await Student.findOne({ rollNumber: studentId })
    }

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 })
    }

    // Calculate total amount and verify stock
    let totalAmount = 0
    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product) {
        return NextResponse.json({ message: `Product ${item.productId} not found` }, { status: 404 })
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ message: `Insufficient stock for ${product.name}` }, { status: 400 })
      }
      totalAmount += item.quantity * item.price
    }

    // Check student balance
    if (student.balance < totalAmount) {
      return NextResponse.json({ message: "Insufficient balance" }, { status: 400 })
    }

    // Create transaction with proper field names
    const transaction = new Transaction({
      studentId: student._id,
      sellerId: "000000000000000000000001", // Default seller ID
      items,
      totalAmount,
      status: "completed",
    })
    await transaction.save()

    // Update student balance
    student.balance -= totalAmount
    await student.save()

    // Update product stocks and create inventory logs
    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (product) {
        const previousStock = product.stock
        const newStock = previousStock - item.quantity

        product.stock = newStock
        await product.save()

        // Create inventory log
        const inventoryLog = new InventoryLog({
          productId: product._id,
          action: "sale",
          quantityChange: -item.quantity,
          previousStock,
          newStock,
          reason: `Sale - Transaction #${transaction._id}`,
          userId: "000000000000000000000001",
        })
        await inventoryLog.save()
      }
    }

    return NextResponse.json(
      {
        id: transaction._id.toString(),
        studentId: transaction.studentId.toString(),
        sellerId: transaction.sellerId.toString(),
        items: transaction.items,
        totalAmount: transaction.totalAmount,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ message: "Failed to process transaction" }, { status: 500 })
  }
}

// import { type NextRequest, NextResponse } from "next/server"
// import dbConnect from "@/lib/mongodb"
// import { Transaction } from "@/lib/models/transaction"
// import { Student } from "@/lib/models/student"
// import { Product } from "@/lib/models/product"
// import { InventoryLog } from "@/lib/models/inventory-log"
// import { createTransactionSchema } from "@/lib/validations/transaction"

// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect()

//     const { searchParams } = new URL(request.url)
//     const studentId = searchParams.get("studentId")
//     const startDate = searchParams.get("startDate")
//     const endDate = searchParams.get("endDate")

//     let query: any = {}

//     if (studentId) {
//       query = { studentId }
//     } else if (startDate && endDate) {
//       query = {
//         createdAt: {
//           $gte: new Date(startDate),
//           $lte: new Date(endDate),
//         },
//       }
//     }

//     const transactions = await Transaction.find(query).populate("studentId", "name rollNumber").sort({ createdAt: -1 })

//     return NextResponse.json(
//       transactions.map((transaction) => ({
//         id: transaction._id.toString(),
//         studentId: transaction.studentId._id.toString(),
//         sellerId: transaction.sellerId.toString(),
//         items: JSON.stringify(transaction.items),
//         totalAmount: transaction.totalAmount,
//         status: transaction.status,
//         createdAt: transaction.createdAt,
//         student: {
//           name: transaction.studentId.name,
//           rollNumber: transaction.studentId.rollNumber,
//         },
//       })),
//     )
//   } catch (error) {
//     console.error("Error fetching transactions:", error)
//     return NextResponse.json({ message: "Failed to fetch transactions" }, { status: 500 })
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     await dbConnect()

//     const body = await request.json()
//     const { studentId, items } = createTransactionSchema.parse(body)

//     console.log("Creating transaction for student:", studentId, "with items:", items);
    

//     // Find student by ID or roll number
//     let student = await Student.findById(studentId)
//     if (!student) {
//       student = await Student.findOne({ rollNumber: studentId })
//     }

//     if (!student) {
//       return NextResponse.json({ message: "Student not found" }, { status: 404 })
//     }

//     console.log("Found student:", student.name, "with balance:", student.balance);
    

//     // Calculate total amount and verify stock
//     let totalAmount = 0
//     for (const item of items) {
//       const product = await Product.findById(item.productId)
//       console.log("1");
//       if (!product) {
//         return NextResponse.json({ message: `Product ${item.productId} not found` }, { status: 404 })
//       }
//       if (product.stock < item.quantity) {
//         return NextResponse.json({ message: `Insufficient stock for ${product.name}` }, { status: 400 })
//       }
//       totalAmount += item.quantity * item.price
//     }

//     // Check student balance
//     if (student.balance < totalAmount) {
//       return NextResponse.json({ message: "Insufficient balance" }, { status: 400 })
//     }
    
//     console.log("2");
    
//     // Create transaction
//     const transaction = new Transaction({
//       studentId: student._id,
//       sellerId: "000000000000000000000001", // Default seller ID
//       items,
//       totalAmount,
//       status: "completed",
//     })
//     await transaction.save()

//     console.log("updating student balance");
//     // Update student balance
//     // student.balance -= totalAmount
//     // console.log("Student balance after transaction:", student.balance);
//     // await student.save()

//     const updatedStudent = await Student.findByIdAndUpdate(
//   student._id,
//   { balance: student.balance - totalAmount },
//   { new: true, runValidators: false }
// );

//     console.log("3");
    
    
//     // Update product stocks and create inventory logs
//     for (const item of items) {
//       const product = await Product.findById(item.productId)
//       if (product) {
//         const previousStock = product.stock
//         const newStock = previousStock - item.quantity
        
//         product.stock = newStock
//         await product.save()

//         // Create inventory log
//         const inventoryLog = new InventoryLog({
//           productId: product._id,
//           action: "sale",
//           quantityChange: -item.quantity,
//           previousStock,
//           newStock,
//           reason: `Sale - Transaction #${transaction._id}`,
//           userId: "000000000000000000000001",
//         })
//         await inventoryLog.save()
//       }
//     }
//     console.log("4");
    
//     return NextResponse.json(
//       {
//         id: transaction._id.toString(),
//         studentId: transaction.studentId.toString(),
//         sellerId: transaction.sellerId.toString(),
//         items: transaction.items,
//         totalAmount: transaction.totalAmount,
//         status: transaction.status,
//         createdAt: transaction.createdAt,
//       },
//       { status: 201 },
//     )
//   } catch (error) {
//     console.error("Error creating transaction:", error)
//     return NextResponse.json({ message: "Failed to process transaction" }, { status: 500 })
//   }
// }


// // import { type NextRequest, NextResponse } from "next/server"
// // import dbConnect from "@/lib/mongodb"
// // import { Transaction } from "@/lib/models/transaction"
// // import { Student } from "@/lib/models/student"
// // import { Product } from "@/lib/models/product"
// // import { InventoryLog } from "@/lib/models/inventory-log"
// // import { createTransactionSchema } from "@/lib/validations/transaction"

// // export async function GET(request: NextRequest) {
// //   try {
// //     await dbConnect()

// //     const { searchParams } = new URL(request.url)
// //     const studentId = searchParams.get("studentId")
// //     const startDate = searchParams.get("startDate")
// //     const endDate = searchParams.get("endDate")

// //     let query = {}

// //     if (studentId) {
// //       query = { studentId }
// //     } else if (startDate && endDate) {
// //       query = {
// //         createdAt: {
// //           $gte: new Date(startDate),
// //           $lte: new Date(endDate),
// //         },
// //       }
// //     }

// //     const transactions = await Transaction.find(query).populate("studentId", "name rollNumber").sort({ createdAt: -1 })

// //     return NextResponse.json(
// //       transactions.map((transaction) => ({
// //         id: transaction._id.toString(),
// //         studentId: transaction.studentId._id.toString(),
// //         sellerId: transaction.sellerId.toString(),
// //         items: transaction.items,
// //         totalAmount: transaction.totalAmount,
// //         status: transaction.status,
// //         createdAt: transaction.createdAt,
// //         student: {
// //           name: transaction.studentId.name,
// //           rollNumber: transaction.studentId.rollNumber,
// //         },
// //       })),
// //     )
// //   } catch (error) {
// //     console.error("Error fetching transactions:", error)
// //     return NextResponse.json({ message: "Failed to fetch transactions" }, { status: 500 })
// //   }
// // }

// // export async function POST(request: NextRequest) {
// //   try {
// //     await dbConnect()

// //     const body = await request.json()
// //     const { studentId, items } = createTransactionSchema.parse(body)

// //     // Find student by ID or roll number
// //     let student = await Student.findById(studentId)
// //     if (!student) {
// //       student = await Student.findOne({ rollNumber: studentId })
// //     }

// //     if (!student) {
// //       return NextResponse.json({ message: "Student not found" }, { status: 404 })
// //     }

// //     // Calculate total amount and verify stock
// //     let totalAmount = 0
// //     for (const item of items) {
// //       const product = await Product.findById(item.productId)
// //       if (!product) {
// //         return NextResponse.json({ message: `Product ${item.productId} not found` }, { status: 404 })
// //       }
// //       if (product.stock < item.quantity) {
// //         return NextResponse.json({ message: `Insufficient stock for ${product.name}` }, { status: 400 })
// //       }
// //       totalAmount += item.quantity * item.price
// //     }

// //     // Check student balance
// //     if (student.balance < totalAmount) {
// //       return NextResponse.json({ message: "Insufficient balance" }, { status: 400 })
// //     }

// //     // Create transaction
// //     const transaction = new Transaction({
// //       studentId: student._id,
// //       sellerId: "000000000000000000000001", // Default seller ID
// //       items,
// //       totalAmount,
// //       status: "completed",
// //     })
// //     await transaction.save()

// //     // Update student balance
// //     student.balance -= totalAmount
// //     await student.save()

// //     // Update product stocks and create inventory logs
// //     for (const item of items) {
// //       const product = await Product.findById(item.productId)
// //       if (product) {
// //         const previousStock = product.stock
// //         const newStock = previousStock - item.quantity

// //         product.stock = newStock
// //         await product.save()

// //         // Create inventory log
// //         const inventoryLog = new InventoryLog({
// //           productId: product._id,
// //           action: "sale",
// //           quantityChange: -item.quantity,
// //           previousStock,
// //           newStock,
// //           reason: `Sale - Transaction #${transaction._id}`,
// //           userId: "000000000000000000000001",
// //         })
// //         await inventoryLog.save()
// //       }
// //     }

// //     return NextResponse.json(
// //       {
// //         id: transaction._id.toString(),
// //         studentId: transaction.studentId.toString(),
// //         sellerId: transaction.sellerId.toString(),
// //         items: transaction.items,
// //         totalAmount: transaction.totalAmount,
// //         status: transaction.status,
// //         createdAt: transaction.createdAt,
// //       },
// //       { status: 201 },
// //     )
// //   } catch (error) {
// //     console.error("Error creating transaction:", error)
// //     return NextResponse.json({ message: "Failed to process transaction" }, { status: 500 })
// //   }
// // }
