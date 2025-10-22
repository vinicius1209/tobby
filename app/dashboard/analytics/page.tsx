import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { SpendingChart } from "@/components/spending-chart"
import { Footer } from "@/components/footer"
import type { Recibo } from "@/lib/types"
import { formatCurrency, getEstablishmentType, getPaymentMethod } from "@/lib/format-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function AnalyticsPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // First, get the user's telegram chat_id
  const { data: telegramUser } = await supabase
    .from("telegram_users")
    .select("chat_id")
    .eq("user_id", user.id)
    .maybeSingle()

  // Fetch receipts filtered by the user's chat_id
  // If user hasn't linked Telegram, fetch with empty chat_id (returns no results)
  const { data: recibos } = await supabase
    .from("recibos_processados")
    .select("*")
    .eq("chat_id", telegramUser?.chat_id || "")
    .order("data_compra", { ascending: false })

  const receipts = (recibos as Recibo[]) || []

  // Calculate spending by establishment type
  const spendingByType = receipts.reduce(
    (acc, r) => {
      const type = getEstablishmentType(r)
      acc[type] = (acc[type] || 0) + Number(r.valor_total)
      return acc
    },
    {} as Record<string, number>,
  )

  const typeChartData = Object.entries(spendingByType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Calculate spending by payment method
  const spendingByPayment = receipts.reduce(
    (acc, r) => {
      const method = getPaymentMethod(r)
      acc[method] = (acc[method] || 0) + Number(r.valor_total)
      return acc
    },
    {} as Record<string, number>,
  )

  const paymentChartData = Object.entries(spendingByPayment)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Calculate monthly spending (last 6 months)
  const monthlySpending: Record<string, number> = {}
  receipts.forEach((r) => {
    const date = new Date(r.data_compra)
    const monthKey = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + Number(r.valor_total)
  })

  const monthlyChartData = Object.entries(monthlySpending)
    .map(([name, value]) => ({ name, value }))
    .slice(0, 6)
    .reverse()

  // Top spending categories
  const topCategories = typeChartData.slice(0, 3)

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

          <div>
            <h2 className="text-3xl font-bold">Analytics</h2>
            <p className="text-muted-foreground mt-1">Detailed insights into your spending patterns</p>
          </div>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Spending Categories</CardTitle>
              <CardDescription>Your highest expense categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategories.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="text-lg font-bold">{formatCurrency(category.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SpendingChart
              data={typeChartData}
              title="Spending by Category"
              description="Total spent per establishment type"
            />
            <SpendingChart
              data={paymentChartData}
              title="Spending by Payment Method"
              description="Total spent per payment method"
            />
          </div>

          <SpendingChart
            data={monthlyChartData}
            title="Monthly Spending Trend"
            description="Your spending over the last 6 months"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
