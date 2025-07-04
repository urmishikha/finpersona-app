"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { ArrowRight, User, Target, DollarSign, TrendingUp } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function OnboardingPage() {
  const { completeOnboarding } = useAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    occupation: "",
    monthlyIncome: "",
    monthlyExpenses: "",
    savingsGoal: "",
    riskTolerance: "",
    financialGoals: "",
  })
  const router = useRouter()
  const [error, setError] = useState("")

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Save onboarding data to database
      const success = await completeOnboarding(formData)
      if (success) {
        router.push("/dashboard")
      } else {
        setError("Failed to complete onboarding. Please try again.")
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-orange-500 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-gray-900">Tell us about yourself</h2>
              <p className="text-gray-600">{"Let's start building your financial twin"}</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="Enter your age"
                />
              </div>
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange("occupation", e.target.value)}
                  placeholder="What do you do for work?"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <DollarSign className="w-12 h-12 text-orange-500 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-gray-900">Your Financial Snapshot</h2>
              <p className="text-gray-600">Help us understand your current financial situation</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="income">Monthly Income (₹)</Label>
                <Input
                  id="income"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
                  placeholder="Enter your monthly income"
                />
              </div>
              <div>
                <Label htmlFor="expenses">Monthly Expenses (₹)</Label>
                <Input
                  id="expenses"
                  type="number"
                  value={formData.monthlyExpenses}
                  onChange={(e) => handleInputChange("monthlyExpenses", e.target.value)}
                  placeholder="Enter your monthly expenses"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Target className="w-12 h-12 text-orange-500 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-gray-900">Your Financial Goals</h2>
              <p className="text-gray-600">{"What are you working towards?"}</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="savingsGoal">Savings Goal (₹)</Label>
                <Input
                  id="savingsGoal"
                  type="number"
                  value={formData.savingsGoal}
                  onChange={(e) => handleInputChange("savingsGoal", e.target.value)}
                  placeholder="How much do you want to save?"
                />
              </div>
              <div>
                <Label htmlFor="goals">Financial Goals</Label>
                <Textarea
                  id="goals"
                  value={formData.financialGoals}
                  onChange={(e) => handleInputChange("financialGoals", e.target.value)}
                  placeholder="Describe your financial goals (e.g., buy a house, retire early, travel)"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <TrendingUp className="w-12 h-12 text-orange-500 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-gray-900">Risk Assessment</h2>
              <p className="text-gray-600">{"Let's understand your investment personality"}</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="risk">Risk Tolerance</Label>
                <Select
                  value={formData.riskTolerance}
                  onValueChange={(value) => handleInputChange("riskTolerance", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your risk tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative - I prefer safe investments</SelectItem>
                    <SelectItem value="moderate">Moderate - I can handle some risk for better returns</SelectItem>
                    <SelectItem value="aggressive">
                      Aggressive - I'm comfortable with high risk for high returns
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-orange-600">FinPersona Setup</CardTitle>
                <span className="text-sm text-gray-500">
                  Step {step} of {totalSteps}
                </span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStep()}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                Previous
              </Button>
              <Button onClick={handleNext} className="bg-orange-500 hover:bg-orange-600">
                {step === totalSteps ? "Complete Setup" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
