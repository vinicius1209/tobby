import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Recibo } from "@/lib/types"
import {
  formatCurrency,
  formatDate,
  getEstablishmentName,
  getEstablishmentType,
  hasEstablishmentType,
  hasPaymentMethod,
  hasItems,
} from "@/lib/format-utils"
import { Calendar, CreditCard, Store, Package } from "lucide-react"

interface ExpenseCardProps {
  recibo: Recibo
}

export function ExpenseCard({ recibo }: ExpenseCardProps) {
  const formattedDate = formatDate(recibo.data_compra)
  const formattedValue = formatCurrency(recibo.valor_total)
  const establishmentName = getEstablishmentName(recibo)
  const establishmentType = getEstablishmentType(recibo)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Establishment Name */}
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{establishmentName}</h3>
            </div>

            {/* Establishment Type Badge */}
            {hasEstablishmentType(recibo) && (
              <Badge variant="secondary" className="text-xs">
                {establishmentType}
              </Badge>
            )}

            {/* Date and Payment Method */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
              {hasPaymentMethod(recibo) && (
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  <span>{recibo.metodo_pagamento}</span>
                </div>
              )}
            </div>

            {/* Items */}
            {hasItems(recibo) && (
              <div className="flex items-start gap-1">
                <Package className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground line-clamp-2">{recibo.itens_comprados}</p>
              </div>
            )}
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
