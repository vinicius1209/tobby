import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Recibo } from "@/lib/types"
import { Calendar, CreditCard, Store } from "lucide-react"

interface ExpenseCardProps {
  recibo: Recibo
}

export function ExpenseCard({ recibo }: ExpenseCardProps) {
  const formattedDate = new Date(recibo.data_compra).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(recibo.valor_total)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{recibo.nome_estabelecimento || "Estabelecimento não informado"}</h3>
            </div>
            {recibo.tipo_estabelecimento && (
              <Badge variant="secondary" className="text-xs">
                {recibo.tipo_estabelecimento}
              </Badge>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
              {recibo.metodo_pagamento && (
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  <span>{recibo.metodo_pagamento}</span>
                </div>
              )}
            </div>
            {recibo.itens_comprados && (
              <p className="text-sm text-muted-foreground line-clamp-2">{recibo.itens_comprados}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formattedValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
