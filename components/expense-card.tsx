"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Recibo } from "@/lib/types"
import {
  formatCurrency,
  formatDate,
  getDescription,
  hasDescription,
} from "@/lib/format-utils"
import { Calendar, FileText } from "lucide-react"
import { useTranslations } from "next-intl"

interface ExpenseCardProps {
  recibo: Recibo
}

export function ExpenseCard({ recibo }: ExpenseCardProps) {
  const tCommon = useTranslations('common')

  const formattedDate = formatDate(recibo.transaction_date)
  const formattedValue = formatCurrency(recibo.amount)
  const description = getDescription(recibo, tCommon('notInformed'))

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Description */}
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{description}</h3>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Value */}
          <div className="text-right">
            <p className="text-2xl font-bold">{formattedValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
