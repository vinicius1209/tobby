"use client"

import { useTranslations } from "next-intl"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-utils"
import { TrendingUp, TrendingDown, Calendar, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/lib/types"

interface MonthlySummarySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: Transaction[]
  budget: number
}

export function MonthlySummarySheet({
  open,
  onOpenChange,
  transactions,
  budget,
}: MonthlySummarySheetProps) {
  const t = useTranslations("dashboard.monthlySummary")
  const tCommon = useTranslations("common")

  // Filter current month transactions
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.transaction_date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })

  // Calculate totals
  const expenseTransactions = monthTransactions.filter((t) => t.transaction_type === "withdrawal")
  const incomeTransactions = monthTransactions.filter((t) => t.transaction_type === "deposit")

  const expenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const income = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

  // Calculate averages
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const currentDay = now.getDate()
  const avgPerDay = expenses / currentDay

  // Find biggest expense
  const biggestExpense = expenseTransactions.length > 0
    ? expenseTransactions.reduce((max, t) => Number(t.amount) > Number(max.amount) ? t : max)
    : null

  // Calculate category breakdown
  const categoryTotals = new Map<string, number>()
  expenseTransactions.forEach((transaction) => {
    transaction.categories?.forEach((cat) => {
      const current = categoryTotals.get(cat.name) || 0
      categoryTotals.set(cat.name, current + Number(transaction.amount))
    })
  })

  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto px-4">
        <SheetHeader className="pb-6">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Monthly Totals Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Expenses */}
            <Card className="rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("expenses")}</span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {formatCurrency(expenses)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {expenseTransactions.length} {t("transactions")}
                </p>
              </CardContent>
            </Card>

            {/* Income */}
            <Card className="rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("income")}</span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {formatCurrency(income)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {incomeTransactions.length} {t("transactions")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Average per Day */}
            <Card className="rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("avgPerDay")}</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(avgPerDay)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("basedOn")} {currentDay} {t("days")}
                </p>
              </CardContent>
            </Card>

            {/* Biggest Expense */}
            <Card className="rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Receipt className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("biggestExpense")}</span>
                </div>
                {biggestExpense ? (
                  <>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(Number(biggestExpense.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {biggestExpense.description || tCommon("notInformed")}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("noExpenses")}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Categories */}
          {topCategories.length > 0 && (
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">{t("topCategories")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topCategories.map(([name, amount]) => {
                  const percentage = (amount / expenses) * 100
                  return (
                    <div key={name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatCurrency(amount)} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
