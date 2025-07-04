"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, Clock, Lightbulb, History, Loader2 } from "lucide-react"

interface SimulationResult {
  analysis: {
    scenarioType: string
    description: string
    riskLevel: "low" | "medium" | "high"
    recommendations: string[]
  }
  simulation: {
    monthlyData: Array<{
      month: number
      balance: number
      income: number
      expenses: number
      netChange: number
      date: string
    }>
    summary: {
      initialBalance: number
      finalBalance: number
      totalChange: number
      averageMonthlyChange: number
      riskLevel: string
      feasible: boolean
    }
  }
}

interface ScenarioHistory {
  id: string
  scenario: string
  riskLevel: string
  feasible: boolean
  totalChange: number
  createdAt: string
}

export default function ScenariosPage() {
  const { user } = useAuth()
  const [scenario, setScenario] = useState("")
  const [timeframe, setTimeframe] = useState("12")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<ScenarioHistory[]>([])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const token = localStorage.getItem("finpersona_token")
    if (!token) return

    try {
      const response = await fetch("/api/scenarios/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data.scenarios)
      }
    } catch (error) {
      console.error("Failed to load history:", error)
    }
  }

  const handleSimulate = async () => {
    if (!scenario.trim()) {
      setError("Please enter a scenario to simulate")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    const token = localStorage.getItem("finpersona_token")

    try {
      const response = await fetch("/api/scenarios/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          scenario: scenario.trim(),
          timeframe: Number.parseInt(timeframe),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        loadHistory() // Refresh history
      } else {
        setError(data.error || "Failed to simulate scenario")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const exampleScenarios = [
    "What if I buy a car worth ₹10L next month?",
    "What if I quit my job for 6 months?",
    "What if I reduce my rent by ₹5000 per month?",
    "What if I invest ₹20,000 monthly in SIP?",
    "What if I take a vacation costing ₹2L?",
  ]

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Scenario Simulator</h1>
              <p className="text-gray-600">Explore "what if" scenarios with AI-powered predictions</p>
            </div>
            <Calculator className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Tabs defaultValue="simulator" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simulator">Scenario Simulator</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="simulator" className="space-y-6">
              {/* Scenario Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Ask Your Financial Question
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scenario">What if scenario</Label>
                    <Input
                      id="scenario"
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      placeholder="e.g., What if I buy a car worth ₹10L next month?"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeframe">Simulation timeframe (months)</Label>
                    <Input
                      id="timeframe"
                      type="number"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      min="1"
                      max="60"
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleSimulate}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      "Simulate Scenario"
                    )}
                  </Button>

                  {/* Example scenarios */}
                  <div className="space-y-2">
                    <Label>Try these examples:</Label>
                    <div className="flex flex-wrap gap-2">
                      {exampleScenarios.map((example, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setScenario(example)}
                          disabled={isLoading}
                          className="text-xs"
                        >
                          {example}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {result && (
                <div className="space-y-6">
                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {result.simulation.summary.feasible ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        Scenario Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Badge className={getRiskColor(result.analysis.riskLevel)}>
                          {result.analysis.riskLevel.toUpperCase()} RISK
                        </Badge>
                        <Badge variant={result.simulation.summary.feasible ? "default" : "destructive"}>
                          {result.simulation.summary.feasible ? "FEASIBLE" : "HIGH RISK"}
                        </Badge>
                      </div>

                      <p className="text-gray-700">{result.analysis.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Initial Balance</p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(result.simulation.summary.initialBalance)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Final Balance</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(result.simulation.summary.finalBalance)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Change</p>
                          <p
                            className={`text-xl font-bold ${
                              result.simulation.summary.totalChange >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {result.simulation.summary.totalChange >= 0 ? "+" : ""}
                            {formatCurrency(result.simulation.summary.totalChange)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Financial Timeline Projection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={result.simulation.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" label={{ value: "Months", position: "insideBottom", offset: -5 }} />
                            <YAxis
                              tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                              label={{ value: "Balance", angle: -90, position: "insideLeft" }}
                            />
                            <Tooltip
                              formatter={(value: number) => [formatCurrency(value), "Balance"]}
                              labelFormatter={(month) => `Month ${month}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="balance"
                              stroke="#f97316"
                              strokeWidth={3}
                              dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="w-5 h-5" />
                        Monthly Income vs Expenses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={result.simulation.monthlyData.slice(0, 12)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="income" fill="#10b981" name="Income" />
                            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.analysis.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-blue-900">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Scenario History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No scenarios simulated yet</p>
                      <p className="text-sm">Try running your first scenario simulation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.scenario}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={getRiskColor(item.riskLevel)} size="sm">
                                  {item.riskLevel}
                                </Badge>
                                <Badge variant={item.feasible ? "default" : "destructive"} size="sm">
                                  {item.feasible ? "Feasible" : "High Risk"}
                                </Badge>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${item.totalChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {item.totalChange >= 0 ? "+" : ""}
                                {formatCurrency(item.totalChange)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
