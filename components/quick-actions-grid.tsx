"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { RefreshCw, BarChart3, Filter } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface QuickActionsGridProps {
  onRecurringIncomeClick: () => void
  onMonthlySummaryClick: () => void
  onFiltersClick: () => void
  className?: string
}

const actions = [
  {
    key: "recurring",
    icon: RefreshCw,
    labelKey: "recurring",
  },
  {
    key: "summary",
    icon: BarChart3,
    labelKey: "summary",
  },
  {
    key: "filters",
    icon: Filter,
    labelKey: "filters",
  },
] as const

export function QuickActionsGrid({
  onRecurringIncomeClick,
  onMonthlySummaryClick,
  onFiltersClick,
  className,
}: QuickActionsGridProps) {
  const t = useTranslations("dashboard.quickActions")

  const handlers = {
    recurring: onRecurringIncomeClick,
    summary: onMonthlySummaryClick,
    filters: onFiltersClick,
  }

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {actions.map((action, index) => {
        const Icon = action.icon
        const handler = handlers[action.key]

        return (
          <motion.div
            key={action.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "h-24 p-0 overflow-hidden cursor-pointer border-2",
                "hover:shadow-lg hover:border-primary/50 transition-all",
                "active:scale-95"
              )}
              onClick={handler}
            >
              <button
                className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                aria-label={t(action.labelKey)}
              >
                <Icon className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="text-xs font-medium leading-tight">
                  {t(action.labelKey)}
                </span>
              </button>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
