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
    const alertsCollection = db.collection("alerts")

    // Get user's alerts (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const alerts = await alertsCollection
      .find({
        userId: decoded.userId,
        createdAt: { $gte: thirtyDaysAgo },
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      alerts: alerts.map((alert) => ({
        id: alert._id,
        type: alert.type,
        category: alert.category,
        message: alert.message,
        severity: alert.severity,
        amount: alert.amount,
        normalRange: alert.normalRange,
        createdAt: alert.createdAt,
        read: alert.read,
        dismissed: alert.dismissed,
      })),
    })
  } catch (error) {
    console.error("Get alerts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { token, alertId, action } = await request.json()

    if (!token || !alertId || !action) {
      return NextResponse.json({ error: "Token, alertId, and action are required" }, { status: 400 })
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const db = await getDatabase()
    const alertsCollection = db.collection("alerts")

    const updateData: any = {}
    if (action === "read") {
      updateData.read = true
    } else if (action === "dismiss") {
      updateData.dismissed = true
    }

    await alertsCollection.updateOne({ _id: alertId, userId: decoded.userId }, { $set: updateData })

    return NextResponse.json({
      success: true,
      message: `Alert ${action}ed successfully`,
    })
  } catch (error) {
    console.error("Update alert error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
