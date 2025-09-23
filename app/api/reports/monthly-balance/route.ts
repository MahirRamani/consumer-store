import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Transaction } from "@/lib/models/transaction"
import { Student } from "@/lib/models/student"
import { TransactionAggregationResult } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get("dateRange") || "current"
    const customMonth = searchParams.get("month") // Format: YYYY-MM
    const customYear = searchParams.get("year")

    // Calculate date ranges
    const now = new Date()
    let currentMonth: Date
    let lastMonth: Date
    let currentMonthEnd: Date
    let lastMonthEnd: Date

    if (dateRange === "custom" && customMonth) {
      // Parse custom month (YYYY-MM format)
      const [year, month] = customMonth.split('-').map(Number)
      currentMonth = new Date(year, month - 1, 1) // First day of selected month
      currentMonthEnd = new Date(year, month, 0, 23, 59, 59, 999) // Last day of selected month
      lastMonth = new Date(year, month - 2, 1) // First day of previous month
      lastMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999) // Last day of previous month
    } else {
      // Current month logic
      currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    }

    // Aggregate pipeline for comprehensive student balance report
    const pipeline = [
      {
        $facet: {
          // Get all students with their basic info
          allStudents: [
            {
              $group: {
                _id: null,
                students: { $push: "$$ROOT" }
              }
            }
          ],
          // Get current month transactions
          currentMonthTransactions: [
            {
              $match: {
                createdAt: { $gte: currentMonth, $lte: currentMonthEnd },
                status: "completed"
              }
            },
            {
              $group: {
                _id: "$studentId",
                credited: {
                  $sum: {
                    $cond: [
                      { $eq: ["$transactionType", "topup"] },
                      "$amount",
                      0
                    ]
                  }
                },
                debited: {
                  $sum: {
                    $cond: [
                      { $eq: ["$transactionType", "purchase"] },
                      "$totalAmount",
                      0
                    ]
                  }
                },
                transactionCount: { $sum: 1 }
              }
            }
          ],
          // Get last month end balances (transactions up to last month end)
          lastMonthBalances: [
            {
              $match: {
                createdAt: { $lte: lastMonthEnd },
                status: "completed"
              }
            },
            {
              $group: {
                _id: "$studentId",
                totalCredited: {
                  $sum: {
                    $cond: [
                      { $eq: ["$transactionType", "topup"] },
                      "$amount",
                      0
                    ]
                  }
                },
                totalDebited: {
                  $sum: {
                    $cond: [
                      { $eq: ["$transactionType", "purchase"] },
                      "$totalAmount",
                      0
                    ]
                  }
                }
              }
            },
            {
              $addFields: {
                lastMonthEndBalance: { $subtract: ["$totalCredited", "$totalDebited"] }
              }
            }
          ]
        }
      }
    ]

    // Execute the main aggregation on Transaction collection
    const transactionResults = await Transaction.aggregate(pipeline)
    
    // Get all students data
    const allStudents = await Student.find({}, {
      _id: 1,
      rollNumber: 1,
      name: 1,
      standard: 1,
      medium: 1,
      currentBalance: 1
    }).lean()

    // Process results
    const currentMonthData = new Map()
    const lastMonthData = new Map()

    // Map current month transactions
    if (transactionResults[0]?.currentMonthTransactions) {
      transactionResults[0].currentMonthTransactions.forEach((item: TransactionAggregationResult) => {
        currentMonthData.set(item._id, {
          credited: item.credited || 0,
          debited: item.debited || 0,
          transactionCount: item.transactionCount || 0
        })
      })
    }

    // Map last month balances
    if (transactionResults[0]?.lastMonthBalances) {
      transactionResults[0].lastMonthBalances.forEach((item: TransactionAggregationResult) => {
        lastMonthData.set(item._id, {
          lastMonthEndBalance: item.lastMonthEndBalance || 0
        })
      })
    }

    // Build comprehensive student report
    const studentsReport = allStudents.map((student) => {
      const studentId = student._id?.toString()
      const currentMonthTxn = currentMonthData.get(studentId) || { credited: 0, debited: 0, transactionCount: 0 }
      const lastMonthBalance = lastMonthData.get(studentId)?.lastMonthEndBalance || 0
      const currentBalance = student.currentBalance || 0

      return {
        studentId: student._id,
        rollNumber: student.rollNumber,
        name: student.name,
        standard: student.standard,
        medium: student.medium,
        lastMonthEndBalance: lastMonthBalance,
        currentMonthCredited: currentMonthTxn.credited,
        currentMonthDebited: currentMonthTxn.debited,
        currentMonthNet: currentMonthTxn.credited - currentMonthTxn.debited,
        currentBalance: currentBalance,
        transactionCount: currentMonthTxn.transactionCount,
        balanceChange: currentBalance - lastMonthBalance,
        // Verification: lastMonthBalance + currentMonthNet should equal currentBalance
        balanceVerification: Math.abs((lastMonthBalance + (currentMonthTxn.credited - currentMonthTxn.debited)) - currentBalance) < 0.01
      }
    })

    // Sort by standard, then by roll number
    studentsReport.sort((a, b) => {
      if (a.standard !== b.standard) {
        return a.standard.localeCompare(b.standard, undefined, { numeric: true })
      }
      return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true })
    })

    // Calculate summary statistics
    const summary = {
      totalStudents: studentsReport.length,
      totalLastMonthBalance: studentsReport.reduce((sum, s) => sum + s.lastMonthEndBalance, 0),
      totalCurrentMonthCredited: studentsReport.reduce((sum, s) => sum + s.currentMonthCredited, 0),
      totalCurrentMonthDebited: studentsReport.reduce((sum, s) => sum + s.currentMonthDebited, 0),
      totalCurrentBalance: studentsReport.reduce((sum, s) => sum + s.currentBalance, 0),
      totalTransactions: studentsReport.reduce((sum, s) => sum + s.transactionCount, 0),
      activeStudents: studentsReport.filter(s => s.transactionCount > 0).length,
      dateRange: {
        lastMonth: {
          start: lastMonth.toISOString().split('T')[0],
          end: lastMonthEnd.toISOString().split('T')[0]
        },
        currentMonth: {
          start: currentMonth.toISOString().split('T')[0],
          end: currentMonthEnd.toISOString().split('T')[0]
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      students: studentsReport,
      reportGeneratedAt: new Date().toISOString(),
      reportType: "monthly_balance_report"
    })

  } catch (error) {
    console.error("Error generating monthly balance report:", error)
    return NextResponse.json({ 
      success: false,
      message: "Failed to generate monthly balance report",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}