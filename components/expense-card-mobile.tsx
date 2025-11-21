"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CategoryBadge } from "@/components/category-badge"
import { formatCurrency, formatDate, getDescription } from "@/lib/format-utils"
import * as Icons from "lucide-react"
import { ArrowUp, ArrowDown, Pencil, Trash2, Receipt } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { Transaction, Category } from "@/lib/types"

interface ExpenseCardMobileProps {
  recibo: Transaction
  categories?: Category[]
  monthPercentage: number
  frequency: number
  onEdit: (recibo: Transaction) => void
  onDelete: (recibo: Transaction) => void
}

export function ExpenseCardMobile({
  recibo,
  categories = [],
  monthPercentage,
  frequency,
  onEdit,
  onDelete,
}: ExpenseCardMobileProps) {
  const tCommon = useTranslations("common")
  const tCard = useTranslations("transactions.card")

  const description = getDescription(recibo, tCommon("notInformed"))
  const formattedDate = formatDate(recibo.transaction_date)
  const formattedValue = formatCurrency(recibo.amount)
  const isDeposit = recibo.transaction_type === "deposit"

  // Get primary category for icon/color
  const primaryCategory = categories[0]
  const categoryIconName = primaryCategory?.icon || "Receipt"
  const categoryColor = primaryCategory?.color || "#808080"

  // Get icon component dynamically
  const IconComponent = categoryIconName
    ? (Icons[categoryIconName as keyof typeof Icons] as any) || Receipt
    : Receipt

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="hover:shadow-md transition-shadow rounded-xl">
        <CardContent className="p-4">
          {/* Row 1: Icon + Description + Value */}
          <div className="flex items-start gap-3 mb-2">
            {/* Category Icon */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <IconComponent
                className="h-5 w-5"
                style={{ color: categoryColor }}
              />
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base truncate leading-tight">
                {description}
              </h4>
            </div>

            {/* Value + Arrow */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {isDeposit ? (
                <ArrowUp className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-600" />
              )}
              <span
                className={cn(
                  "text-lg font-bold tabular-nums",
                  isDeposit ? "text-green-600" : "text-red-600"
                )}
              >
                {isDeposit ? "+" : "-"}
                {formattedValue}
              </span>
            </div>
          </div>

          {/* Row 2: Date + Categories */}
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground flex-wrap">
            <span className="whitespace-nowrap">{formattedDate}</span>
            {categories.length > 0 && (
              <>
                <span>•</span>
                <div className="flex gap-1 flex-wrap">
                  {categories.slice(0, 2).map((cat) => (
                    <CategoryBadge key={cat.id} category={cat} size="sm" />
                  ))}
                  {categories.length > 2 && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      +{categories.length - 2}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Row 3: Metrics + Actions */}
          <div className="flex items-center justify-between">
            {/* Metrics */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="whitespace-nowrap">
                {Math.round(monthPercentage)}% {tCard("ofMonth")}
              </span>
              <span>•</span>
              <span className="whitespace-nowrap">
                {frequency}x {tCard("thisMonth")}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(recibo)
                }}
                aria-label={tCommon("edit")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(recibo)
                }}
                aria-label={tCommon("delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
