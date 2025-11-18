"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useBudget } from "@/contexts/budget-context"
import { setUserBudget } from "@/lib/budget-utils"
import { formatCurrency } from "@/lib/format-utils"
import { TobbyLogo } from "@/components/tobby-logo"
import { Loader2, Info } from "lucide-react"

export function BudgetSettingsSection() {
  const t = useTranslations("settings")
  const tTobby = useTranslations("tobby")
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()
  const { budgetStatus, refreshBudget, loading: budgetLoading } = useBudget()

  const [budgetInput, setBudgetInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Initialize budget input when budgetStatus loads
  useEffect(() => {
    if (budgetStatus.budget > 0) {
      setBudgetInput(budgetStatus.budget.toFixed(2))
    }
  }, [budgetStatus.budget])

  const handleSaveBudget = async () => {
    setError("")

    // Validate input
    const budgetValue = parseFloat(budgetInput)
    if (isNaN(budgetValue) || budgetValue < 0) {
      setError(t("error"))
      return
    }

    setIsSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Save budget to database
      const success = await setUserBudget(supabase, user.id, budgetValue)

      if (success) {
        // Refresh budget context to update sidebar
        await refreshBudget()

        toast({
          title: t("success"),
          description: tTobby("feedback.saved"),
        })
      } else {
        throw new Error("Failed to save budget")
      }
    } catch (error) {
      console.error("Error saving budget:", error)
      setError(t("error"))
      toast({
        title: tTobby("feedback.error"),
        description: t("error"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("budget.title")}</CardTitle>
        <CardDescription>{t("budget.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Budget Status */}
        {!budgetLoading && budgetStatus.budget > 0 && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start gap-4">
              <TobbyLogo
                size={64}
                variant={budgetStatus.variant}
                animated={true}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("budget.current")}
                  </span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(budgetStatus.budget)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {tTobby("budget.currentSpent")}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(budgetStatus.spent)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        budgetStatus.percentage > 100
                          ? "bg-red-500"
                          : budgetStatus.percentage > 80
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(budgetStatus.percentage, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {budgetStatus.percentage.toFixed(0)}% {tTobby("budget.percentage")}
                    </span>
                    <span
                      className={`font-semibold ${
                        budgetStatus.isOverBudget
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {budgetStatus.remaining >= 0
                        ? formatCurrency(budgetStatus.remaining)
                        : `-${formatCurrency(Math.abs(budgetStatus.remaining))}`}{" "}
                      {tTobby("budget.remaining")}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  {tTobby(`states.${budgetStatus.variant}`)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Budget Input Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget">{t("budget.label")}</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              placeholder={t("budget.placeholder")}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              disabled={isSaving}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              {t("budget.helpText")}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSaveBudget}
            disabled={isSaving || !budgetInput}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("budget.saving")}
              </>
            ) : (
              t("budget.saveButton")
            )}
          </Button>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {budgetStatus.budget === 0
              ? tTobby("budget.setBudgetPrompt")
              : t("budget.helpText")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
