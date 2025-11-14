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
import { FileText, Calendar } from "lucide-react"
import { useTranslations } from "next-intl"

interface ExpenseCardCompactProps {
  recibo: Recibo
}

export function ExpenseCardCompact({ recibo }: ExpenseCardCompactProps) {
  const tCommon = useTranslations('common')

  const formattedDate = formatDate(recibo.transaction_date)
  const formattedValue = formatCurrency(recibo.amount)
  const description = getDescription(recibo, tCommon('notInformed'))

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Description */}
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-sm truncate">{description}</h3>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Value in Red */}
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-red-600">{formattedValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
