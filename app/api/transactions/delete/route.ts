import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest) {
  try {
    const { token, transactionId } = await request.json()

    if (!token || !transactionId) {
      return NextResponse.json({ error: "Token and transaction ID are required" }, { status: 400 })
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const db = await getDatabase()
    const transactionsCollection = db.collection("transactions")

    // Delete the transaction (only if it belongs to the user)
    const result = await transactionsCollection.deleteOne({
      _id: new ObjectId(transactionId),
      userId: decoded.userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Transaction not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
    })
  } catch (error) {
    console.error("Delete transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
