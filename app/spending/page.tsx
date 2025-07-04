"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert as AlertComponent, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Bell,
  AlertTriangle,
  TrendingUp,
  Plus,
  Eye,
  CreditCard,
  DollarSign,
  Activity,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react"

interface Transaction {
  amount: number
  category: string
  description: string
  date: string
  type: "expense" | "income"
}

export default function SpendingPage() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<any[]>([])
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true)
  const [newTransaction, setNewTransaction] = useState<Transaction>({
    amount: 0,
    category: "Food & Dining",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "expense",
  })
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)

  const categories = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Utilities",
    "Healthcare",
    "Education",
    "Travel",
    "Other",
  ]

  useEffect(() => {
    loadAlerts()
    // Set up periodic alert checking
    const interval = setInterval(loadAlerts, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = async () => {
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
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error("Failed to load alerts:", error)
    } finally {
      setIsLoadingAlerts(false)
    }
  }

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      return
    }

    setIsAddingTransaction(true)
    const token = localStorage.getItem("finpersona_token")

    try {
      const response = await fetch("/api/transactions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          transactions: [newTransaction],
        }),
      })

      if (response.ok) {
        // Reset form
        setNewTransaction({
          amount: 0,
          category: "Food & Dining",
          description: "",
          date: new Date().toISOString().split("T")[0],
          type: "expense",
        })

        // Reload alerts after a short delay to allow anomaly detection to run
        setTimeout(loadAlerts, 2000)

        // Show success message
        const successMessage = `Transaction added: ${newTransaction.type === "income" ? "+" : "-"}₹${newTransaction.amount} for ${newTransaction.description}`
        alert(successMessage)
      }
    } catch (error) {
      console.error("Failed to add transaction:", error)
    } finally {
      setIsAddingTransaction(false)
    }
  }

  const handleAlertAction = async (alertId: string, action: "read" | "dismiss") => {
    const token = localStorage.getItem("finpersona_token")

    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, alertId, action }),
      })

      // Update local state
      setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, [action]: true } : alert)))
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-4 h-4" />
      case "medium":
        return <Bell className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const unreadAlerts = alerts.filter((alert) => !alert.read && !alert.dismissed)
  const recentAlerts = alerts.filter((alert) => !alert.dismissed).slice(0, 5)

  // Sample data for charts
  const weeklySpendingData = [
    { week: "Week 1", amount: 12000, average: 15000 },
    { week: "Week 2", amount: 18000, average: 15000 },
    { week: "Week 3", amount: 45000, average: 15000 }, // Anomaly
    { week: "Week 4", amount: 14000, average: 15000 },
  ]

  const categorySpendingData = [
    { category: "Food & Dining", amount: 25000, color: "#ef4444" },
    { category: "Transportation", amount: 8000, color: "#3b82f6" },
    { category: "Shopping", amount: 15000, color: "#10b981" },
    { category: "Entertainment", amount: 5000, color: "#8b5cf6" },
    { category: "Others", amount: 7000, color: "#6b7280" },
  ]

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Smart Spending Insights</h1>
              <p className="text-gray-600">AI-powered anomaly detection and spending alerts</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <Bell className="w-3 h-3 mr-1" />
                {unreadAlerts.length} New Alerts
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Tabs defaultValue="alerts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="alerts">Smart Alerts</TabsTrigger>
              <TabsTrigger value="analytics">Spending Analytics</TabsTrigger>
              <TabsTrigger value="add-transaction">Add Transaction</TabsTrigger>
            </TabsList>

            <TabsContent value="alerts" className="space-y-6">
              {/* Alert Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Alerts</p>
                        <p className="text-2xl font-bold text-red-600">{unreadAlerts.length}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">This Week's Anomalies</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {alerts.filter((a) => a.severity === "high").length}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Categories Monitored</p>
                        <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Recent Spending Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAlerts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Loading alerts...</span>
                    </div>
                  ) : recentAlerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No spending anomalies detected</p>
                      <p className="text-sm">Your spending patterns look normal!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${
                            alert.read ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {getSeverityIcon(alert.severity)}
                              <div className="flex-1">
                                <p className="font-medium">{alert.message}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm opacity-75">
                                  <span>Amount: ₹{alert.amount?.toLocaleString()}</span>
                                  <span>Normal: {alert.normalRange}</span>
                                  <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!alert.read && (
                                <Button size="sm" variant="ghost" onClick={() => handleAlertAction(alert.id, "read")}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              {!alert.dismissed && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAlertAction(alert.id, "dismiss")}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Spending Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Weekly Spending vs Average
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklySpendingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]} />
                        <Bar dataKey="amount" fill="#f97316" name="Actual Spending" />
                        <Bar dataKey="average" fill="#e5e7eb" name="Average Spending" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Category Spending Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categorySpendingData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="amount"
                            label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categorySpendingData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Amount"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Anomaly Detection Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium">High Risk Alerts</span>
                      <Badge variant="destructive">{alerts.filter((a) => a.severity === "high").length}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium">Medium Risk Alerts</span>
                      <Badge className="bg-yellow-500">{alerts.filter((a) => a.severity === "medium").length}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Low Risk Alerts</span>
                      <Badge variant="secondary">{alerts.filter((a) => a.severity === "low").length}</Badge>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Our AI monitors your spending patterns 24/7 and alerts you to unusual activity within minutes.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="add-transaction" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add New Transaction
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newTransaction.amount || ""}
                        onChange={(e) =>
                          setNewTransaction((prev) => ({ ...prev, amount: Number.parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="Enter amount"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newTransaction.category}
                        onValueChange={(value) => setNewTransaction((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="What did you spend on?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Transaction Type</Label>
                    <div className="flex gap-4">
                      <Button
                        variant={newTransaction.type === "expense" ? "default" : "outline"}
                        onClick={() => setNewTransaction((prev) => ({ ...prev, type: "expense" }))}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Expense
                      </Button>
                      <Button
                        variant={newTransaction.type === "income" ? "default" : "outline"}
                        onClick={() => setNewTransaction((prev) => ({ ...prev, type: "income" }))}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Income
                      </Button>
                    </div>
                  </div>

                  <AlertComponent>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      Our AI will automatically analyze this transaction for spending anomalies and alert you if
                      anything unusual is detected.
                    </AlertDescription>
                  </AlertComponent>

                  <Button
                    onClick={handleAddTransaction}
                    disabled={isAddingTransaction || !newTransaction.amount || !newTransaction.description}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {isAddingTransaction ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Transaction...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Transaction
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
