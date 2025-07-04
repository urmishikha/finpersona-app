import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

interface ScenarioRequest {
  token: string
  scenario: string
  timeframe?: number // months
}

interface FinancialData {
  monthlyIncome: number
  monthlyExpenses: number
  currentSavings: number
  goals: any[]
}

// Fallback AI analysis function when AI SDK is not available
function fallbackAnalyzeScenario(scenario: string, financialData: FinancialData) {
  const lowerScenario = scenario.toLowerCase()

  // Simple pattern matching for common scenarios
  if (lowerScenario.includes("car") && lowerScenario.match(/₹?(\d+)l/)) {
    const amount = Number.parseInt(lowerScenario.match(/(\d+)l/)?.[1] || "0") * 100000
    return {
      scenarioType: "expense",
      impact: {
        oneTimeExpense: amount,
        monthlyIncomeChange: 0,
        monthlyExpenseChange: 0,
        duration: 1,
      },
      description: `Purchasing a car worth ₹${(amount / 100000).toFixed(1)}L`,
      riskLevel: amount > financialData.currentSavings ? "high" : "medium",
      recommendations: [
        "Consider the impact on your emergency fund",
        "Explore financing options to preserve cash flow",
        "Factor in ongoing maintenance and insurance costs",
      ],
    }
  }

  if (lowerScenario.includes("quit") || lowerScenario.includes("job")) {
    const months = Number.parseInt(lowerScenario.match(/(\d+)\s*month/)?.[1] || "6")
    return {
      scenarioType: "income_change",
      impact: {
        oneTimeExpense: 0,
        monthlyIncomeChange: -financialData.monthlyIncome,
        monthlyExpenseChange: 0,
        duration: months,
      },
      description: `Taking a career break for ${months} months`,
      riskLevel: "high",
      recommendations: [
        "Build an emergency fund covering 6-12 months of expenses",
        "Consider part-time or freelance income during the break",
        "Plan for health insurance and other benefits",
      ],
    }
  }

  if (lowerScenario.includes("rent") && lowerScenario.match(/₹?(\d+)/)) {
    const amount = Number.parseInt(lowerScenario.match(/₹?(\d+)/)?.[1] || "0")
    const isReduction = lowerScenario.includes("reduce") || lowerScenario.includes("save")
    return {
      scenarioType: "expense",
      impact: {
        oneTimeExpense: 0,
        monthlyIncomeChange: 0,
        monthlyExpenseChange: isReduction ? -amount : amount,
        duration: 12,
      },
      description: `${isReduction ? "Reducing" : "Increasing"} monthly rent by ₹${amount}`,
      riskLevel: "low",
      recommendations: [
        isReduction ? "Use the savings to boost your emergency fund" : "Ensure the increase fits your budget",
        "Consider the long-term impact on your savings goals",
        "Factor in any moving costs if relocating",
      ],
    }
  }

  // Default analysis for unrecognized scenarios
  return {
    scenarioType: "general",
    impact: {
      oneTimeExpense: 0,
      monthlyIncomeChange: 0,
      monthlyExpenseChange: 0,
      duration: 12,
    },
    description: "Custom financial scenario analysis",
    riskLevel: "medium",
    recommendations: [
      "Review your current budget and savings rate",
      "Consider the long-term impact on your financial goals",
      "Monitor your progress and adjust as needed",
    ],
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, scenario, timeframe = 12 }: ScenarioRequest = await request.json()

    if (!token || !scenario) {
      return NextResponse.json({ error: "Token and scenario are required" }, { status: 400 })
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Get user data
    const user = await usersCollection.findOne({ userId: decoded.userId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Extract financial data from user's onboarding data
    const onboardingData = user.onboardingData || {}
    const financialData: FinancialData = {
      monthlyIncome: Number.parseInt(onboardingData.monthlyIncome) || 50000,
      monthlyExpenses: Number.parseInt(onboardingData.monthlyExpenses) || 35000,
      currentSavings: 200000, // Default current savings
      goals: [
        { name: "Emergency Fund", target: 300000, current: 200000 },
        { name: "House Down Payment", target: 1500000, current: 500000 },
        { name: "Retirement", target: 5000000, current: 180000 },
      ],
    }

    let aiAnalysis

    try {
      // Try to use AI SDK if available
      const { generateText } = await import("ai")
      const { openai } = await import("@ai-sdk/openai")

      const aiPrompt = `
      You are a financial advisor AI. Analyze this financial scenario and provide structured data for simulation.
      
      User's Current Financial Status:
      - Monthly Income: ₹${financialData.monthlyIncome}
      - Monthly Expenses: ₹${financialData.monthlyExpenses}
      - Current Savings: ₹${financialData.currentSavings}
      - Monthly Surplus: ₹${financialData.monthlyIncome - financialData.monthlyExpenses}
      
      Scenario: "${scenario}"
      Timeframe: ${timeframe} months
      
      Please analyze this scenario and respond with a JSON object containing:
      {
        "scenarioType": "expense" | "income_change" | "investment" | "goal",
        "impact": {
          "oneTimeExpense": number (if applicable),
          "monthlyIncomeChange": number (if applicable),
          "monthlyExpenseChange": number (if applicable),
          "duration": number (months the change lasts)
        },
        "description": "Brief description of the scenario",
        "riskLevel": "low" | "medium" | "high",
        "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
      }
      
      Examples:
      - "Buy a car worth ₹10L" → oneTimeExpense: 1000000
      - "Quit job for 6 months" → monthlyIncomeChange: -${financialData.monthlyIncome}, duration: 6
      - "Reduce rent by ₹5000" → monthlyExpenseChange: -5000
      
      Respond only with valid JSON.
      `

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: aiPrompt,
      })

      aiAnalysis = JSON.parse(text)
    } catch (error) {
      console.log("AI SDK not available, using fallback analysis")
      // Use fallback analysis when AI SDK is not available
      aiAnalysis = fallbackAnalyzeScenario(scenario, financialData)
    }

    // Generate simulation data
    const simulation = generateSimulation(financialData, aiAnalysis, timeframe)

    // Save scenario to database
    const scenariosCollection = db.collection("scenarios")
    const scenarioRecord = {
      userId: decoded.userId,
      scenario,
      aiAnalysis,
      simulation,
      timeframe,
      createdAt: new Date(),
    }

    await scenariosCollection.insertOne(scenarioRecord)

    return NextResponse.json({
      success: true,
      analysis: aiAnalysis,
      simulation,
      scenarioId: scenarioRecord._id,
    })
  } catch (error) {
    console.error("Scenario simulation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateSimulation(financialData: FinancialData, analysis: any, timeframe: number) {
  const monthlyData = []
  let currentBalance = financialData.currentSavings
  const monthlyIncome = financialData.monthlyIncome
  const monthlyExpenses = financialData.monthlyExpenses

  for (let month = 0; month <= timeframe; month++) {
    // Apply scenario impacts
    let monthlyIncomeAdjusted = monthlyIncome
    let monthlyExpensesAdjusted = monthlyExpenses

    // Apply income changes
    if (analysis.impact.monthlyIncomeChange && month <= (analysis.impact.duration || timeframe)) {
      monthlyIncomeAdjusted += analysis.impact.monthlyIncomeChange
    }

    // Apply expense changes
    if (analysis.impact.monthlyExpenseChange) {
      monthlyExpensesAdjusted += analysis.impact.monthlyExpenseChange
    }

    // Apply one-time expense in first month
    let oneTimeExpense = 0
    if (month === 1 && analysis.impact.oneTimeExpense) {
      oneTimeExpense = analysis.impact.oneTimeExpense
    }

    // Calculate monthly change
    const monthlyChange = monthlyIncomeAdjusted - monthlyExpensesAdjusted - oneTimeExpense
    currentBalance += monthlyChange

    monthlyData.push({
      month,
      balance: Math.round(currentBalance),
      income: monthlyIncomeAdjusted,
      expenses: monthlyExpensesAdjusted + oneTimeExpense,
      netChange: monthlyChange,
      date: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    })
  }

  // Calculate summary statistics
  const finalBalance = monthlyData[monthlyData.length - 1].balance
  const totalChange = finalBalance - financialData.currentSavings
  const averageMonthlyChange = totalChange / timeframe

  return {
    monthlyData,
    summary: {
      initialBalance: financialData.currentSavings,
      finalBalance,
      totalChange,
      averageMonthlyChange: Math.round(averageMonthlyChange),
      riskLevel: analysis.riskLevel,
      feasible: finalBalance > 0,
    },
  }
}
