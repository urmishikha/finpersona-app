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
    const scenariosCollection = db.collection("scenarios")

    // Get user's scenario history
    const scenarios = await scenariosCollection
      .find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({
      success: true,
      scenarios: scenarios.map((s) => ({
        id: s._id,
        scenario: s.scenario,
        riskLevel: s.aiAnalysis?.riskLevel || "medium",
        feasible: s.simulation?.summary?.feasible || false,
        totalChange: s.simulation?.summary?.totalChange || 0,
        createdAt: s.createdAt,
      })),
    })
  } catch (error) {
    console.error("Scenario history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
