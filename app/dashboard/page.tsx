"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  TrendingUp,
  Target,
  MessageCircle,
  PieChart,
  BarChart3,
  Wallet,
  CreditCard,
  Send,
  Bot,
  User,
  Calculator,
  ArrowRight,
  Loader2,
  ExternalLink,
  Bell,
  AlertTriangle,
  History,
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [chatMessage, setChatMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [transactionCount, setTransactionCount] = useState(0)
  const [chatHistory, setChatHistory] = useState([
    {
      type: "bot",
      message: `Hi ${user?.name || "there"}! I'm your AI Financial Twin. I've analyzed your financial profile and I'm ready to help you achieve your goals. 

You can ask me:
• General financial questions
• "What if" scenarios (like "What if I buy a car worth ₹10L?")
• Investment advice based on your risk tolerance
• Savings optimization tips

What would you like to know?`,
    },
  ])

  useEffect(() => {
    loadUnreadAlerts()
    loadTransactionCount()
  }, [])

  const loadUnreadAlerts = async () => {
    const token = localStorage.getItem("finpersona_token")
    if (!token) return

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const data = await response.json()
        const unread = data.alerts.filter((alert: any) => !alert.read && !alert.dismissed).length
        setUnreadAlerts(unread)
      }
    } catch (error) {
      console.error("Failed to load alerts:", error)
    }
  }

  const loadTransactionCount = async () => {
    const token = localStorage.getItem("finpersona_token")
    if (!token) return

    try {
      const response = await fetch("/api/transactions/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const data = await response.json()
        setTransactionCount(data.transactions.length)
      }
    } catch (error) {
      console.error("Failed to load transaction count:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isTyping) return

    const userMessage = chatMessage.trim()
    setChatMessage("")
    setIsTyping(true)

    // Add user message to chat
    const newChatHistory = [...chatHistory, { type: "user", message: userMessage }]
    setChatHistory(newChatHistory)

    const token = localStorage.getItem("finpersona_token")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          message: userMessage,
          conversationHistory: newChatHistory,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setChatHistory((prev) => [
          ...prev,
          {
            type: "bot",
            message: data.response,
            isScenario: data.isScenario,
          },
        ])

        // If it's a scenario question, suggest using the simulator
        if (data.isScenario) {
          setTimeout(() => {
            setChatHistory((prev) => [
              ...prev,
              {
                type: "bot",
                message:
                  "💡 For detailed visual projections and timeline analysis of this scenario, try our AI Scenario Simulator!",
                showSimulatorLink: true,
              },
            ])
          }, 1000)
        }
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            type: "bot",
            message: "I'm having trouble processing your request right now. Please try again in a moment.",
          },
        ])
      }
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          type: "bot",
          message: "I'm experiencing some technical difficulties. Please try again later.",
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const suggestedQuestions = [
    "What if I buy a car worth ₹10L?",
    "How can I optimize my savings?",
    "What investment options suit my risk tolerance?",
    "What if I quit my job for 6 months?",
    "Should I invest in SIP or lump sum?",
  ]

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
              <p className="text-gray-600">Your AI-powered financial twin</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/transactions">
                <Button variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">
                  <History className="w-4 h-4 mr-2" />
                  Transaction History
                  {transactionCount > 0 && <Badge className="ml-2 bg-blue-600 text-white">{transactionCount}</Badge>}
                </Button>
              </Link>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Financial Health: Good
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-2">AI Scenario Simulator</h2>
                    <p className="text-orange-100 mb-4">
                      Ask "what if" questions and get AI-powered financial predictions.
                    </p>
                    <Link href="/scenarios">
                      <Button variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
                        <Calculator className="w-4 h-4 mr-2" />
                        Try Simulator
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                  <Calculator className="w-16 h-16 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Smart Spend Alerts</h2>
                    <p className="text-red-100 mb-4">AI-powered anomaly detection for your spending patterns.</p>
                    <Link href="/spending">
                      <Button variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
                        <Bell className="w-4 h-4 mr-2" />
                        View Alerts
                        {unreadAlerts > 0 && <Badge className="ml-2 bg-red-600 text-white">{unreadAlerts}</Badge>}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                  <AlertTriangle className="w-16 h-16 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Transaction History</h2>
                    <p className="text-blue-100 mb-4">Complete record of all your financial transactions.</p>
                    <Link href="/transactions">
                      <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                        <History className="w-4 h-4 mr-2" />
                        View History
                        {transactionCount > 0 && (
                          <Badge className="ml-2 bg-blue-600 text-white">{transactionCount}</Badge>
                        )}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                  <History className="w-16 h-16 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Net Worth</p>
                    <p className="text-2xl font-bold text-gray-900">₹4.2L</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-xs text-green-600 mt-1">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Savings</p>
                    <p className="text-2xl font-bold text-gray-900">₹25K</p>
                  </div>
                  <Wallet className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-xs text-blue-600 mt-1">Goal: ₹30K</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">₹45K</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-orange-500" />
                </div>
                <p className="text-xs text-orange-600 mt-1">5% above budget</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{transactionCount}</p>
                  </div>
                  <History className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-xs text-purple-600 mt-1">Total recorded</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Goals Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Financial Goals Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Emergency Fund</span>
                    <span className="text-sm text-gray-600">₹2L / ₹3L</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">House Down Payment</span>
                    <span className="text-sm text-gray-600">₹5L / ₹15L</span>
                  </div>
                  <Progress value={33} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Retirement Fund</span>
                    <span className="text-sm text-gray-600">₹1.8L / ₹50L</span>
                  </div>
                  <Progress value={4} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Enhanced AI Financial Twin Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat with Your AI Financial Twin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-80 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg">
                    {chatHistory.map((chat, index) => (
                      <div
                        key={index}
                        className={`flex gap-2 ${chat.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-2 max-w-[85%] ${chat.type === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              chat.type === "user" ? "bg-orange-500" : "bg-blue-500"
                            }`}
                          >
                            {chat.type === "user" ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-lg ${
                              chat.type === "user" ? "bg-orange-500 text-white" : "bg-white border border-gray-200"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                            {chat.showSimulatorLink && (
                              <Link href="/scenarios" className="inline-block mt-2">
                                <Button size="sm" variant="outline" className="text-xs bg-transparent">
                                  <Calculator className="w-3 h-3 mr-1" />
                                  Open Scenario Simulator
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-2 justify-start">
                        <div className="flex gap-2 max-w-[85%]">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="p-3 rounded-lg bg-white border border-gray-200">
                            <div className="flex items-center gap-1">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm text-gray-500">Analyzing your question...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggested Questions */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Try asking:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestedQuestions.slice(0, 3).map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setChatMessage(question)}
                          disabled={isTyping}
                          className="text-xs h-6 px-2"
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Ask about your finances or try 'What if...' scenarios"
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      disabled={isTyping}
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="icon"
                      className="bg-orange-500 hover:bg-orange-600"
                      disabled={isTyping || !chatMessage.trim()}
                    >
                      {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spending Categories & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Spending Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { category: "Food & Dining", amount: "₹12,000", percentage: 27, color: "bg-red-500" },
                    { category: "Transportation", amount: "₹8,000", percentage: 18, color: "bg-blue-500" },
                    { category: "Shopping", amount: "₹6,500", percentage: 14, color: "bg-green-500" },
                    { category: "Entertainment", amount: "₹5,000", percentage: 11, color: "bg-purple-500" },
                    { category: "Utilities", amount: "₹4,500", percentage: 10, color: "bg-yellow-500" },
                    { category: "Others", amount: "₹9,000", percentage: 20, color: "bg-gray-500" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.amount}</p>
                        <p className="text-xs text-gray-500">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  AI Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-medium text-blue-900">Savings Opportunity</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      You could save ₹3,000/month by reducing dining out expenses by 25%.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-medium text-green-900">Investment Suggestion</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Consider investing ₹5,000 more monthly in SIP for better long-term growth.
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <h4 className="font-medium text-red-900">Spending Alert</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {unreadAlerts > 0
                        ? `${unreadAlerts} spending anomalies detected this week.`
                        : "No unusual spending patterns detected."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
