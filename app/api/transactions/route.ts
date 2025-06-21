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
    const studentId = searchParams.get("studentId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let query: any = {}

    if (studentId) {
      query = { studentId }
    } else if (startDate && endDate) {
      query = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }
    }

    const transactions = await Transaction.find(query).populate("studentId", "name rollNumber").sort({ createdAt: -1 })

    return NextResponse.json(
      transactions.map((transaction) => ({
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
      })),
    )
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

    console.log("Creating transaction for student:", studentId, "with items:", items);
    

    // Find student by ID or roll number
    let student = await Student.findById(studentId)
    if (!student) {
      student = await Student.findOne({ rollNumber: studentId })
    }

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 })
    }

    console.log("Found student:", student.name, "with balance:", student.balance);
    

    // Calculate total amount and verify stock
    let totalAmount = 0
    for (const item of items) {
      const product = await Product.findById(item.productId)
      console.log("1");
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
    
    console.log("2");
    
    // Create transaction
    const transaction = new Transaction({
      studentId: student._id,
      sellerId: "000000000000000000000001", // Default seller ID
      items,
      totalAmount,
      status: "completed",
    })
    await transaction.save()

    console.log("updating student balance");
    // Update student balance
    // student.balance -= totalAmount
    // console.log("Student balance after transaction:", student.balance);
    // await student.save()

    const updatedStudent = await Student.findByIdAndUpdate(
  student._id,
  { balance: student.balance - totalAmount },
  { new: true, runValidators: false }
);

    console.log("3");
    
    
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
    console.log("4");
    
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

//     let query = {}

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
//         items: transaction.items,
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

//     // Find student by ID or roll number
//     let student = await Student.findById(studentId)
//     if (!student) {
//       student = await Student.findOne({ rollNumber: studentId })
//     }

//     if (!student) {
//       return NextResponse.json({ message: "Student not found" }, { status: 404 })
//     }

//     // Calculate total amount and verify stock
//     let totalAmount = 0
//     for (const item of items) {
//       const product = await Product.findById(item.productId)
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

//     // Create transaction
//     const transaction = new Transaction({
//       studentId: student._id,
//       sellerId: "000000000000000000000001", // Default seller ID
//       items,
//       totalAmount,
//       status: "completed",
//     })
//     await transaction.save()

//     // Update student balance
//     student.balance -= totalAmount
//     await student.save()

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
