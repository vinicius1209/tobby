"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Recibo, Category } from "@/lib/types"
import {
  formatCurrency,
  formatDate,
  getDescription,
  hasDescription,
} from "@/lib/format-utils"
import { FileText, Calendar, ArrowUp, ArrowDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { CategoryBadge } from "@/components/category-badge"
import { cn } from "@/lib/utils"

interface ExpenseCardCompactProps {
  recibo: Recibo
  categories?: Category[]
}

export function ExpenseCardCompact({ recibo, categories = [] }: ExpenseCardCompactProps) {
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

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-1">
                {categories.slice(0, 2).map((category) => (
                  <CategoryBadge key={category.id} category={category} size="sm" />
                ))}
                {categories.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{categories.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Value */}
          <div className="text-right flex-shrink-0 flex items-center gap-1">
            {recibo.transaction_type === 'deposit' ? (
              <ArrowUp className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-600" />
            )}
            <p className={cn(
              "text-lg font-bold",
              recibo.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
            )}>
              {formattedValue}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
