export interface Recibo {
  id: string
  user_id: string
  tipo_estabelecimento: string | null
  nome_estabelecimento: string | null
  cnpj: string | null
  data_compra: string
  valor_total: number
  metodo_pagamento: string | null
  itens_comprados: string | null
  json_original: any
  chat_id: string | null
  criado_em: string
}

export interface MonthlySpending {
  month: string
  total_receipts: number
  total_spent: number
  avg_spent: number
}

export interface SpendingByType {
  tipo_estabelecimento: string
  receipt_count: number
  total_spent: number
}

export interface TelegramUser {
  id: string
  user_id: string
  chat_id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  linked_at: string
  created_at: string
  updated_at: string
}

export interface UserLinkToken {
  id: string
  user_id: string
  token: string
  created_at: string
  expires_at: string
  used_at: string | null
}
