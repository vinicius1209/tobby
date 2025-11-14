// Transaction represents a financial transaction (withdrawal or deposit)
export interface Transaction {
  id: string
  user_id: string
  chat_id: string | null
  description: string | null           // Renamed from: tipo_estabelecimento
  transaction_date: string             // Renamed from: data_compra
  transaction_type: 'withdrawal' | 'deposit'  // New field
  amount: number                       // Renamed from: valor_total
  original_json: any                   // Renamed from: json_original
  created_at: string                   // Renamed from: criado_em
  deleted_at?: string | null
}

// For backward compatibility during migration (will be removed later)
export type Recibo = Transaction

// Category represents a user-defined category for organizing transactions
export interface Category {
  id: string
  user_id: string
  name: string
  color: string | null
  icon: string | null
  created_at: string
}

// TransactionCategory represents the many-to-many relationship
export interface TransactionCategory {
  transaction_id: string
  category_id: string
}

// Extended transaction with categories populated
export interface TransactionWithCategories extends Transaction {
  categories?: Category[]
}

// Monthly transaction summary (renamed from MonthlySpending)
export interface MonthlyTransactionSummary {
  month: string
  transaction_type?: 'withdrawal' | 'deposit'
  total_transactions: number           // Renamed from: total_receipts
  total_amount: number                 // Renamed from: total_spent
  avg_amount: number                   // Renamed from: avg_spent
}

// For backward compatibility during migration (will be removed later)
export type MonthlySpending = MonthlyTransactionSummary

// Transaction summary by description (renamed from SpendingByType)
export interface TransactionByDescription {
  description: string                  // Renamed from: tipo_estabelecimento
  transaction_type?: 'withdrawal' | 'deposit'
  transaction_count: number            // Renamed from: receipt_count
  total_amount: number                 // Renamed from: total_spent
}

// For backward compatibility during migration (will be removed later)
export type SpendingByType = TransactionByDescription

// TelegramUser interface remains unchanged
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

// UserLinkToken interface remains unchanged
export interface UserLinkToken {
  id: string
  user_id: string
  token: string
  created_at: string
  expires_at: string
  used_at: string | null
}
