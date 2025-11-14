"use client"

import type { Recibo } from "@/lib/types"
import { formatCurrency, formatDate, getDescription, hasDescription } from "@/lib/format-utils"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"

interface ExpensesTimelineProps {
  receipts: Recibo[]
  limit?: number
}

interface GroupedReceipts {
  date: string
  receipts: Recibo[]
  total: number
}

export function ExpensesTimeline({ receipts, limit = 10 }: ExpensesTimelineProps) {
  const t = useTranslations('transactions.timeline')
  const tCommon = useTranslations('common')

  // Group transactions by creation date (day)
  const groupedByDate = receipts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
    .reduce((acc, receipt) => {
      const dateKey = new Date(receipt.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          receipts: [],
          total: 0,
        }
      }

      acc[dateKey].receipts.push(receipt)
      acc[dateKey].total += Number(receipt.amount)

      return acc
    }, {} as Record<string, GroupedReceipts>)

  const timelineGroups = Object.values(groupedByDate)

  if (timelineGroups.length === 0) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground text-center py-8">
          {t('noTransactions')}
        </p>
      </div>
    )
  }

  return (
    <div className="relative space-y-6">
      {/* Linha vertical da timeline */}
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

      {timelineGroups.map((group, groupIndex) => (
        <div key={group.date} className="relative">
          {/* Data do grupo */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{group.date}</span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {formatCurrency(group.total)}
              </Badge>
            </div>
          </div>

          {/* Transactions in group */}
          <div className="ml-8 space-y-2">
            {group.receipts.map((receipt, index) => {
              const time = new Date(receipt.created_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
              const description = getDescription(receipt, tCommon('notInformed'))

              return (
                <div
                  key={receipt.id}
                  className="rounded-lg bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">{time}</span>
                      </div>
                      <p className="font-medium text-sm truncate">{description}</p>
                    </div>
                    <div className="shrink-0">
                      <p className="font-semibold text-sm">{formatCurrency(receipt.amount)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Grand total */}
      {timelineGroups.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>{t('total', { count: receipts.slice(0, limit).length })}</span>
            </div>
            <p className="font-semibold">
              {formatCurrency(
                receipts.slice(0, limit).reduce((sum, r) => sum + Number(r.amount), 0)
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
