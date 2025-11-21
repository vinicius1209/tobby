"use client"

import type { Recibo, Category } from "@/lib/types"
import {
  formatCurrency,
  formatDate,
  getDescription,
} from "@/lib/format-utils"
import { TrendingDown, TrendingUp, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CategoryBadge } from "@/components/category-badge"
import { cn } from "@/lib/utils"

interface ExpenseCardAdvancedProps {
  recibo: Recibo
  categories?: Category[] // Categories for this transaction
  monthPercentage: number // Percentual deste gasto no mês total
  frequency: number // Quantas vezes este tipo de despesa apareceu
  trend: number // Percentual do total gasto nas categorias desta transação
  index: number // Índice da linha para rotação de cores
  onEdit: (recibo: Recibo) => void
  onDelete: (recibo: Recibo) => void
}

export function ExpenseCardAdvanced({
  recibo,
  categories = [],
  monthPercentage,
  frequency,
  trend,
  index,
  onEdit,
  onDelete,
}: ExpenseCardAdvancedProps) {
  const tCommon = useTranslations('common')
  const tCard = useTranslations('transactions.card')
  const tActions = useTranslations('transactions.actions')

  const formattedDate = formatDate(recibo.transaction_date)
  const formattedValue = formatCurrency(recibo.amount)
  const description = getDescription(recibo, tCommon('notInformed'))

  // Determina a cor do badge de peso no mês
  const getImpactColor = (percentage: number) => {
    if (percentage >= 50) return "bg-red-500"
    if (percentage >= 25) return "bg-yellow-500"
    return "bg-green-500"
  }

  const impactColor = getImpactColor(monthPercentage)
  const isEven = index % 2 === 0

  return (
    <div
      className={cn(
        "grid items-center gap-4 px-6 py-4 mx-4 my-4 rounded-md transition-all hover:bg-muted/30",
        isEven && "bg-muted/50"
      )}
      style={{
        minHeight: "80px",
        gridTemplateColumns: "1fr 130px 100px 100px 110px 140px 80px",
      }}
    >
      {/* Coluna 1: Description + Categories */}
      <div className="min-w-0 space-y-1">
        <h4 className="font-semibold text-base truncate">{description}</h4>
        {categories.length > 0 && (
          <div className="flex gap-1 flex-wrap">
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
      </div>

      {/* Coluna 2: Data (130px) */}
      <div className="flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>

      {/* Coluna 3: Badge Impacto no mês (100px) */}
      <div className="flex flex-col items-center justify-center">
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-sm",
            impactColor
          )}
        >
          {Math.round(monthPercentage)}%
        </div>
      </div>

      {/* Coluna 4: Badge Frequência (100px) */}
      <div className="flex flex-col items-center justify-center">
        <Badge variant="secondary" className="text-sm font-semibold px-3 py-1.5 min-w-[50px] justify-center">
          {frequency}x
        </Badge>
      </div>

      {/* Coluna 5: Badge Tendência (110px) - % do total gasto nas categorias */}
      <div className="flex flex-col items-center justify-center">
        {trend !== 0 ? (
          <>
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-semibold min-w-[70px] justify-center",
                "bg-primary/10 text-primary"
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{Math.round(trend)}%</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">% categoria</span>
          </>
        ) : (
          <div className="h-14 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">—</span>
          </div>
        )}
      </div>

      {/* Coluna 6: Valor (140px) */}
      <div className="flex items-center justify-end gap-1">
        {recibo.transaction_type === 'deposit' ? (
          <ArrowUp className="h-5 w-5 text-green-600" />
        ) : (
          <ArrowDown className="h-5 w-5 text-red-600" />
        )}
        <p className={cn(
          "text-xl font-bold tabular-nums",
          recibo.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
        )}>
          {formattedValue}
        </p>
      </div>

      {/* Coluna 7: Ações (80px) */}
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(recibo)}
          title={tActions('edit')}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(recibo)}
          title={tActions('delete')}
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
