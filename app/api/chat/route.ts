import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

// Fallback chat responses when AI SDK is not available
function generateFallbackResponse(message: string, financialProfile: any) {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("what if") || lowerMessage.includes("if i")) {
    return `I can help analyze that scenario! Based on your current financial situation:

• Monthly Income: ₹${financialProfile.monthlyIncome.toLocaleString()}
• Monthly Expenses: ₹${financialProfile.monthlyExpenses.toLocaleString()}
• Monthly Surplus: ₹${(financialProfile.monthlyIncome - financialProfile.monthlyExpenses).toLocaleString()}

For detailed scenario analysis with visual projections, I recommend using our Scenario Simulator. It can provide timeline charts and detailed impact analysis for your specific situation.

Would you like me to help with any other financial questions?`
  }

  if (lowerMessage.includes("invest") || lowerMessage.includes("portfolio")) {
    return `Based on your ${financialProfile.riskTolerance} risk tolerance, here are some investment suggestions:

• **SIP in Equity Mutual Funds**: Start with ₹5,000-10,000 monthly
• **Balanced Funds**: Good mix of equity and debt for moderate risk
• **ELSS Funds**: Tax-saving investments with 3-year lock-in

With your current surplus of ₹${(financialProfile.monthlyIncome - financialProfile.monthlyExpenses).toLocaleString()}/month, you could comfortably invest ₹8,000-12,000 monthly while maintaining your savings goals.

Would you like specific fund recommendations?`
  }

  if (lowerMessage.includes("save") || lowerMessage.includes("savings")) {
    return `Great question about savings! Here's your current situation:

• **Current Savings Rate**: ₹${(financialProfile.monthlyIncome - financialProfile.monthlyExpenses).toLocaleString()}/month
• **Savings Goal**: ₹${financialProfile.savingsGoal.toLocaleString()}
• **Time to Goal**: ~${Math.ceil(financialProfile.savingsGoal / (financialProfile.monthlyIncome - financialProfile.monthlyExpenses))} months at current rate

**Optimization Tips**:
1. Automate your savings on salary day
2. Review and reduce discretionary expenses
3. Consider high-yield savings accounts or FDs

Would you like me to suggest specific ways to increase your savings rate?`
  }

  // Default response
  return `I'm here to help with your financial questions! Based on your profile:

• Monthly Income: ₹${financialProfile.monthlyIncome.toLocaleString()}
• Monthly Surplus: ₹${(financialProfile.monthlyIncome - financialProfile.monthlyExpenses).toLocaleString()}
• Risk Tolerance: ${financialProfile.riskTolerance}

I can help you with:
• Investment advice based on your risk profile
• Savings optimization strategies
• "What if" scenario analysis
• Budget planning and expense management

What specific area would you like to explore?`
}

export async function POST(request: NextRequest) {
  try {
    const { token, message, conversationHistory } = await request.json()

    if (!token || !message) {
      return NextResponse.json({ error: "Token and message are required" }, { status: 400 })
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
    const financialProfile = {
      name: user.name,
      monthlyIncome: Number.parseInt(onboardingData.monthlyIncome) || 50000,
      monthlyExpenses: Number.parseInt(onboardingData.monthlyExpenses) || 35000,
      savingsGoal: Number.parseInt(onboardingData.savingsGoal) || 500000,
      riskTolerance: onboardingData.riskTolerance || "moderate",
      financialGoals: onboardingData.financialGoals || "Building wealth and financial security",
      currentSavings: 200000, // This would come from actual financial data
      age: Number.parseInt(onboardingData.age) || 28,
      occupation: onboardingData.occupation || "Professional",
    }

    // Check if this is a scenario question
    const isScenarioQuestion =
      message.toLowerCase().includes("what if") ||
      message.toLowerCase().includes("if i") ||
      message.toLowerCase().includes("suppose")

    let aiResponse

    try {
      // Try to use AI SDK if available
      const { generateText } = await import("ai")
      const { openai } = await import("@ai-sdk/openai")

      if (isScenarioQuestion) {
        // Handle scenario questions
        const scenarioPrompt = `
        You are ${financialProfile.name}'s AI Financial Twin. You have deep knowledge of their financial situation and goals.

        User's Financial Profile:
        - Monthly Income: ₹${financialProfile.monthlyIncome.toLocaleString()}
        - Monthly Expenses: ₹${financialProfile.monthlyExpenses.toLocaleString()}
        - Monthly Surplus: ₹${(financialProfile.monthlyIncome - financialProfile.monthlyExpenses).toLocaleString()}
        - Current Savings: ₹${financialProfile.currentSavings.toLocaleString()}
        - Savings Goal: ₹${financialProfile.savingsGoal.toLocaleString()}
        - Risk Tolerance: ${financialProfile.riskTolerance}
        - Age: ${financialProfile.age}
        - Occupation: ${financialProfile.occupation}
        - Financial Goals: ${financialProfile.financialGoals}

        Recent conversation:
        ${conversationHistory
          .slice(-3)
          .map((msg: any) => `${msg.type}: ${msg.message}`)
          .join("\n")}

        User's scenario question: "${message}"

        Provide a detailed financial analysis of this scenario. Include:
        1. Immediate financial impact
        2. Long-term implications
        3. Specific recommendations
        4. Alternative approaches
        5. Risk assessment

        If this seems like a complex scenario that needs detailed simulation, suggest they use the Scenario Simulator for visual projections.

        Keep your response conversational, personalized, and actionable. Use Indian Rupee (₹) formatting.
        `

        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt: scenarioPrompt,
        })

        aiResponse = text
      } else {
        // Handle general financial questions
        const generalPrompt = `
        You are ${financialProfile.name}'s AI Financial Twin. You have deep knowledge of their financial situation and goals.

        User's Financial Profile:
        - Monthly Income: ₹${financialProfile.monthlyIncome.toLocaleString()}
        - Monthly Expenses: ₹${financialProfile.monthlyExpenses.toLocaleString()}
        - Monthly Surplus: ₹${(financialProfile.monthlyIncome - financialProfile.monthlyExpenses).toLocaleString()}
        - Current Savings: ₹${financialProfile.currentSavings.toLocaleString()}
        - Savings Goal: ₹${financialProfile.savingsGoal.toLocaleString()}
        - Risk Tolerance: ${financialProfile.riskTolerance}
        - Age: ${financialProfile.age}
        - Occupation: ${financialProfile.occupation}
        - Financial Goals: ${financialProfile.financialGoals}

        Recent conversation:
        ${conversationHistory
          .slice(-3)
          .map((msg: any) => `${msg.type}: ${msg.message}`)
          .join("\n")}

        User's question: "${message}"

        Provide personalized financial advice based on their profile. Be specific, actionable, and use their actual financial numbers. 
        
        If they're asking about investments and their risk tolerance is moderate, suggest balanced portfolios.
        If they're asking about savings, reference their current savings rate and goals.
        If they're asking about expenses, analyze their spending patterns.

        Keep responses conversational and under 150 words. Use Indian Rupee (₹) formatting.
        `

        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt: generalPrompt,
        })

        aiResponse = text
      }
    } catch (error) {
      console.log("AI SDK not available, using fallback responses")
      // Use fallback response when AI SDK is not available
      aiResponse = generateFallbackResponse(message, financialProfile)
    }

    // Save conversation to database
    const conversationsCollection = db.collection("conversations")
    await conversationsCollection.insertOne({
      userId: decoded.userId,
      message,
      response: aiResponse,
      timestamp: new Date(),
      isScenario: isScenarioQuestion,
    })

    return NextResponse.json({
      success: true,
      response: aiResponse,
      isScenario: isScenarioQuestion,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
