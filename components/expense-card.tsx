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
import { Calendar, FileText, ArrowUp, ArrowDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { CategoryBadge } from "@/components/category-badge"
import { cn } from "@/lib/utils"

interface ExpenseCardProps {
  recibo: Recibo
  categories?: Category[]
}

export function ExpenseCard({ recibo, categories = [] }: ExpenseCardProps) {
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

            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {categories.slice(0, 3).map((category) => (
                  <CategoryBadge key={category.id} category={category} size="sm" />
                ))}
                {categories.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{categories.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Value */}
          <div className="text-right flex items-center gap-1">
            {recibo.transaction_type === 'deposit' ? (
              <ArrowUp className="h-5 w-5 text-green-600" />
            ) : (
              <ArrowDown className="h-5 w-5 text-red-600" />
            )}
            <p className={cn(
              "text-2xl font-bold",
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
