"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-utils"
import { useTranslations } from "next-intl"
import type { TobbyVariant } from "@/lib/budget-utils"
import { cn } from "@/lib/utils"

interface BudgetBalanceCardProps {
  budget: number
  spent: number
  remaining: number
  percentage: number
  variant: TobbyVariant
  className?: string
}

const variantConfig = {
  happy: {
    color: "text-green-600",
    progressColor: "bg-green-500",
    bgGradient: "from-green-50 to-background",
    message: "keepGoing",
  },
  neutral: {
    color: "text-yellow-600",
    progressColor: "bg-yellow-500",
    bgGradient: "from-yellow-50 to-background",
    message: "payAttention",
  },
  worried: {
    color: "text-red-600",
    progressColor: "bg-red-500",
    bgGradient: "from-red-50 to-background",
    message: "beCareful",
  },
}

export function BudgetBalanceCard({
  budget,
  spent,
  remaining,
  percentage,
  variant,
  className,
}: BudgetBalanceCardProps) {
  const t = useTranslations("dashboard.balance")
  const tTobby = useTranslations("tobby.messages")

  const config = variantConfig[variant]
  const tobbyMessage = tTobby(config.message)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(className)}
    >
      <Card
        className={cn(
          "border-2 overflow-hidden",
          "bg-gradient-to-br",
          config.bgGradient
        )}
      >
        <CardContent className="p-6 space-y-4">
          {/* Label */}
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
              {budget > 0 ? t("available") : t("monthlySpent")}
            </p>
          </div>

          {/* Main Balance - LARGE */}
          <div>
            <motion.p
              className={cn(
                "text-5xl md:text-6xl font-bold tracking-tight",
                config.color
              )}
              key={remaining}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formatCurrency(budget > 0 ? remaining : spent)}
            </motion.p>
          </div>

          {/* Progress Bar - Only if budget is set */}
          {budget > 0 && (
            <>
              <div className="space-y-2">
                <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", config.progressColor)}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Budget Details */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatCurrency(spent)} {t("of")} {formatCurrency(budget)}
                </span>
                <span className={cn("font-semibold tabular-nums", config.color)}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </>
          )}

          {/* Tobby Message */}
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="text-base">🐶</span>
              <span>{tobbyMessage}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
