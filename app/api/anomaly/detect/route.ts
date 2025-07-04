import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

interface SpendingPattern {
  category: string
  weeklyAverage: number
  monthlyAverage: number
  standardDeviation: number
  lastWeekSpend: number
  currentWeekSpend: number
}

export async function POST(request: NextRequest) {
  try {
    const { userId, transactions } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const transactionsCollection = db.collection("transactions")
    const alertsCollection = db.collection("alerts")

    // Get historical transactions for the user (last 3 months)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const historicalTransactions = await transactionsCollection
      .find({
        userId,
        createdAt: { $gte: threeMonthsAgo },
        type: "expense",
      })
      .toArray()

    // Analyze spending patterns by category
    const spendingPatterns = analyzeSpendingPatterns(historicalTransactions)

    // Detect anomalies in new transactions
    const anomalies = detectAnomalies(transactions || [], spendingPatterns)

    // Save alerts for detected anomalies
    if (anomalies.length > 0) {
      const alertRecords = anomalies.map((anomaly) => ({
        userId,
        type: "spending_anomaly",
        category: anomaly.category,
        message: anomaly.message,
        severity: anomaly.severity,
        amount: anomaly.amount,
        normalRange: anomaly.normalRange,
        createdAt: new Date(),
        read: false,
        dismissed: false,
      }))

      await alertsCollection.insertMany(alertRecords)
    }

    // Mark transactions as processed
    if (transactions && transactions.length > 0) {
      const transactionIds = transactions.map((t: any) => t._id).filter(Boolean)
      if (transactionIds.length > 0) {
        await transactionsCollection.updateMany(
          { _id: { $in: transactionIds } },
          { $set: { anomalyChecked: true, processedAt: new Date() } },
        )
      }
    }

    return NextResponse.json({
      success: true,
      anomaliesDetected: anomalies.length,
      patterns: spendingPatterns,
      anomalies,
    })
  } catch (error) {
    console.error("Anomaly detection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function analyzeSpendingPatterns(transactions: any[]): Record<string, SpendingPattern> {
  const patterns: Record<string, SpendingPattern> = {}

  // Group transactions by category
  const categoryGroups = transactions.reduce((groups, transaction) => {
    const category = transaction.category || "Other"
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(transaction)
    return groups
  }, {})

  // Calculate patterns for each category
  Object.entries(categoryGroups).forEach(([category, categoryTransactions]: [string, any[]]) => {
    const amounts = categoryTransactions.map((t) => t.amount)
    const weeklyAmounts = getWeeklySpending(categoryTransactions)
    const monthlyAmounts = getMonthlySpending(categoryTransactions)

    const weeklyAverage = weeklyAmounts.length > 0 ? weeklyAmounts.reduce((a, b) => a + b, 0) / weeklyAmounts.length : 0
    const monthlyAverage =
      monthlyAmounts.length > 0 ? monthlyAmounts.reduce((a, b) => a + b, 0) / monthlyAmounts.length : 0

    // Calculate standard deviation
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length
    const standardDeviation = Math.sqrt(variance)

    // Get recent spending
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const currentWeekSpend = categoryTransactions
      .filter((t) => new Date(t.createdAt) >= oneWeekAgo)
      .reduce((sum, t) => sum + t.amount, 0)

    const lastWeekSpend = categoryTransactions
      .filter((t) => new Date(t.createdAt) >= twoWeeksAgo && new Date(t.createdAt) < oneWeekAgo)
      .reduce((sum, t) => sum + t.amount, 0)

    patterns[category] = {
      category,
      weeklyAverage,
      monthlyAverage,
      standardDeviation,
      lastWeekSpend,
      currentWeekSpend,
    }
  })

  return patterns
}

function getWeeklySpending(transactions: any[]): number[] {
  const weeklySpending: Record<string, number> = {}

  transactions.forEach((transaction) => {
    const date = new Date(transaction.createdAt)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split("T")[0]

    if (!weeklySpending[weekKey]) {
      weeklySpending[weekKey] = 0
    }
    weeklySpending[weekKey] += transaction.amount
  })

  return Object.values(weeklySpending)
}

function getMonthlySpending(transactions: any[]): number[] {
  const monthlySpending: Record<string, number> = {}

  transactions.forEach((transaction) => {
    const date = new Date(transaction.createdAt)
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`

    if (!monthlySpending[monthKey]) {
      monthlySpending[monthKey] = 0
    }
    monthlySpending[monthKey] += transaction.amount
  })

  return Object.values(monthlySpending)
}

function detectAnomalies(newTransactions: any[], patterns: Record<string, SpendingPattern>) {
  const anomalies: any[] = []

  // Check for spending anomalies by category
  Object.entries(patterns).forEach(([category, pattern]) => {
    const { weeklyAverage, standardDeviation, currentWeekSpend } = pattern

    // Detect if current week spending is significantly higher than average
    const threshold = weeklyAverage + 2 * standardDeviation // 2 standard deviations
    const multiplier = currentWeekSpend / (weeklyAverage || 1)

    if (currentWeekSpend > threshold && multiplier >= 2) {
      let severity: "low" | "medium" | "high" = "medium"
      let message = ""

      if (multiplier >= 4) {
        severity = "high"
        message = `🚨 You spent ${multiplier.toFixed(1)}x more on ${category} this week (₹${currentWeekSpend.toLocaleString()}) compared to your average (₹${weeklyAverage.toLocaleString()}). What happened?`
      } else if (multiplier >= 3) {
        severity = "high"
        message = `⚠️ Unusual ${category} spending detected! You spent ${multiplier.toFixed(1)}x more than usual this week.`
      } else {
        severity = "medium"
        message = `📊 Your ${category} spending is ${multiplier.toFixed(1)}x higher than normal this week. Consider reviewing your budget.`
      }

      anomalies.push({
        category,
        amount: currentWeekSpend,
        normalRange: `₹${(weeklyAverage - standardDeviation).toFixed(0)} - ₹${(weeklyAverage + standardDeviation).toFixed(0)}`,
        multiplier: multiplier.toFixed(1),
        severity,
        message,
        type: "spending_spike",
      })
    }

    // Detect unusual single transactions
    newTransactions
      .filter((t) => t.category === category && t.type === "expense")
      .forEach((transaction) => {
        const transactionThreshold = weeklyAverage * 0.5 // 50% of weekly average in single transaction
        if (transaction.amount > transactionThreshold && transaction.amount > 1000) {
          anomalies.push({
            category,
            amount: transaction.amount,
            normalRange: `Usually under ₹${transactionThreshold.toFixed(0)}`,
            severity: "medium",
            message: `💳 Large ${category} transaction detected: ₹${transaction.amount.toLocaleString()} for "${transaction.description}". This is unusually high for you.`,
            type: "large_transaction",
            transaction: transaction.description,
          })
        }
      })
  })

  return anomalies
}
