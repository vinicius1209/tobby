import type { Recibo } from "@/lib/types"
import { formatCurrency, formatDate, getEstablishmentName, getEstablishmentType, hasEstablishmentType } from "@/lib/format-utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, TrendingUp } from "lucide-react"

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
  // Agrupar recibos por data de criação (dia)
  const groupedByDate = receipts
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    .slice(0, limit)
    .reduce((acc, receipt) => {
      const dateKey = new Date(receipt.criado_em).toLocaleDateString("pt-BR", {
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
      acc[dateKey].total += Number(receipt.valor_total)

      return acc
    }, {} as Record<string, GroupedReceipts>)

  const timelineGroups = Object.values(groupedByDate)

  if (timelineGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Gastos</CardTitle>
          <CardDescription>Histórico cronológico dos seus gastos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum gasto registrado ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline de Gastos</CardTitle>
        <CardDescription>Últimos {limit} gastos registrados</CardDescription>
      </CardHeader>
      <CardContent>
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

              {/* Recibos do grupo */}
              <div className="ml-8 space-y-2">
                {group.receipts.map((receipt, index) => {
                  const time = new Date(receipt.criado_em).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  const establishmentName = getEstablishmentName(receipt)
                  const establishmentType = getEstablishmentType(receipt)

                  return (
                    <div
                      key={receipt.id}
                      className="rounded-lg border border-border bg-card p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">{time}</span>
                            {hasEstablishmentType(receipt) && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                                {establishmentType}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-sm truncate">{establishmentName}</p>
                        </div>
                        <div className="shrink-0">
                          <p className="font-semibold text-sm">{formatCurrency(receipt.valor_total)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Total geral */}
        {timelineGroups.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Total dos últimos {receipts.slice(0, limit).length} gastos</span>
              </div>
              <p className="font-semibold">
                {formatCurrency(
                  receipts.slice(0, limit).reduce((sum, r) => sum + Number(r.valor_total), 0)
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
