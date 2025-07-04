import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

interface Transaction {
  amount: number
  category: string
  description: string
  date: string
  type: "expense" | "income"
}

export async function POST(request: NextRequest) {
  try {
    const { token, transactions } = await request.json()

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

    // Add transactions with user ID and timestamp
    const transactionRecords = transactions.map((transaction: Transaction) => ({
      ...transaction,
      userId: decoded.userId,
      createdAt: new Date(),
      processedAt: new Date(),
      anomalyChecked: false,
    }))

    const result = await transactionsCollection.insertMany(transactionRecords)

    // Trigger anomaly detection for new transactions
    await triggerAnomalyDetection(decoded.userId, transactionRecords)

    return NextResponse.json({
      success: true,
      insertedCount: result.insertedCount,
      message: "Transactions added successfully",
    })
  } catch (error) {
    console.error("Add transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function triggerAnomalyDetection(userId: string, newTransactions: any[]) {
  try {
    // Call anomaly detection API
    await fetch(`${process.env.NEXTAUTH_URL}/api/anomaly/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, transactions: newTransactions }),
    })
  } catch (error) {
    console.error("Failed to trigger anomaly detection:", error)
  }
}
