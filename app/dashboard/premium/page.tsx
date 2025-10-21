import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getUserSubscription, isPremiumUser } from "@/lib/subscription"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function PremiumPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const subscription = await getUserSubscription()
  const isPremium = isPremiumUser(subscription)

  const premiumFeatures = [
    {
      name: "Advanced Analytics",
      description: "Deep insights into your spending patterns with custom reports and trends",
    },
    {
      name: "Export Data",
      description: "Export your expense data to CSV or PDF for accounting and tax purposes",
    },
    {
      name: "Budget Alerts",
      description: "Set spending limits and receive real-time alerts when you approach them",
    },
    {
      name: "Unlimited Receipts",
      description: "Process unlimited receipts per month without restrictions",
    },
    {
      name: "Priority Support",
      description: "Get priority customer support with faster response times",
    },
    {
      name: "Custom Categories",
      description: "Create and manage custom expense categories for better organization",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-8 w-8 text-amber-500" />
              <h2 className="text-4xl font-bold">Upgrade to Premium</h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Unlock powerful features to take control of your finances
            </p>
          </div>

          {isPremium && (
            <Alert className="max-w-2xl mx-auto">
              <Crown className="h-4 w-4" />
              <AlertDescription>You are currently on the Premium plan. Thank you for your support!</AlertDescription>
            </Alert>
          )}

          {/* Pricing Card */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-primary">
              <CardHeader className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <CardTitle className="text-2xl">Premium Plan</CardTitle>
                  <Badge
                    variant="default"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
                  >
                    Most Popular
                  </Badge>
                </div>
                <div>
                  <span className="text-5xl font-bold">R$ 29,90</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription>Everything you need to master your expenses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {premiumFeatures.map((feature) => (
                    <div key={feature.name} className="flex gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{feature.name}</p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {!isPremium && (
                  <Button className="w-full" size="lg" disabled>
                    <Crown className="mr-2 h-4 w-4" />
                    Stripe Integration Coming Soon
                  </Button>
                )}

                {isPremium && (
                  <Button className="w-full bg-transparent" size="lg" variant="outline" disabled>
                    Current Plan
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Cancel anytime. No questions asked. Your data stays with you.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-6">Compare Plans</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Free Plan</CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Basic expense tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Up to 50 receipts/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Basic analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Standard support</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Premium Plan</CardTitle>
                      <CardDescription>For serious expense tracking</CardDescription>
                    </div>
                    <Crown className="h-6 w-6 text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Everything in Free, plus:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Unlimited receipts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Advanced analytics & reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Data export (CSV/PDF)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Budget alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Priority support</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
