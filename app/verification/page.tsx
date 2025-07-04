"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"

export default function VerificationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isVerified, setIsVerified] = useState(false)
  const [language, setLanguage] = useState("english")

  useEffect(() => {
    // If user is already onboarded, redirect to dashboard
    if (user?.isOnboarded) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleBegin = () => {
    setIsVerified(true)
    setTimeout(() => {
      router.push("/onboarding")
    }, 1500)
  }

  if (isVerified) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Complete!</h2>
              <p className="text-gray-600">Redirecting to setup...</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-orange-600">{"Let's confirm you are human"}</h1>

              <p className="text-gray-700 text-sm leading-relaxed">
                Complete the security check before continuing. This step verifies that you are not a bot, which helps to
                protect your account and prevent spam.
              </p>
            </div>

            <Button
              onClick={handleBegin}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded"
            >
              Begin {">"}
            </Button>

            <div className="pt-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Español</SelectItem>
                  <SelectItem value="french">Français</SelectItem>
                  <SelectItem value="german">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
