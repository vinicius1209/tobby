"use client"

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

type SortField = "date" | "impact" | "frequency" | "value"

interface ExpenseListHeaderProps {
  sortBy: SortField | null
  sortOrder: "asc" | "desc"
  onSort: (field: SortField) => void
}

export function ExpenseListHeader({ sortBy, sortOrder, onSort }: ExpenseListHeaderProps) {
  const t = useTranslations('transactions.listHeader')
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    )
  }

  return (
    <div
      className="grid items-center gap-4 px-6 pb-4 mx-4 my-4 rounded-md"
      style={{
        gridTemplateColumns: "1fr 130px 100px 100px 110px 140px 80px",
      }}
    >
      {/* Coluna 1: Description */}
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {t('description')}
      </div>

      {/* Coluna 2: Data (clicável) */}
      <button
        onClick={() => onSort("date")}
        className={cn(
          "flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors",
          sortBy === "date" && "text-foreground"
        )}
      >
        {t('date')}
        <SortIcon field="date" />
      </button>

      {/* Coluna 3: Impacto (clicável) */}
      <button
        onClick={() => onSort("impact")}
        className={cn(
          "flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors",
          sortBy === "impact" && "text-foreground"
        )}
      >
        {t('impact')}
        <SortIcon field="impact" />
      </button>

      {/* Coluna 4: Frequência (clicável) */}
      <button
        onClick={() => onSort("frequency")}
        className={cn(
          "flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors",
          sortBy === "frequency" && "text-foreground"
        )}
      >
        {t('frequency')}
        <SortIcon field="frequency" />
      </button>

      {/* Coluna 5: Tendência (não ordenável) */}
      <div className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wide">
        {t('trend')}
      </div>

      {/* Coluna 6: Amount (clicável) */}
      <button
        onClick={() => onSort("value")}
        className={cn(
          "flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors",
          sortBy === "value" && "text-foreground"
        )}
      >
        {t('amount')}
        <SortIcon field="value" />
      </button>

      {/* Coluna 7: Ações (não ordenável) */}
      <div className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wide">
        {/* Empty header for actions column */}
      </div>
    </div>
  )
}
