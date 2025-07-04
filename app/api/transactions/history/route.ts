import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const db = await getDatabase()
    const transactionsCollection = db.collection("transactions")

    // Get all transactions for the user, sorted by date (newest first)
    const transactions = await transactionsCollection.find({ userId: decoded.userId }).sort({ createdAt: -1 }).toArray()

    // Calculate summary statistics
    const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const categoryBreakdown = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {})

    return NextResponse.json({
      success: true,
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
        type: t.type,
        createdAt: t.createdAt,
        anomalyChecked: t.anomalyChecked || false,
      })),
      summary: {
        totalTransactions: transactions.length,
        totalExpenses,
        totalIncome,
        netAmount: totalIncome - totalExpenses,
        categoryBreakdown,
      },
    })
  } catch (error) {
    console.error("Get transaction history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
