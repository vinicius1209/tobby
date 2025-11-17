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

// For backward compatibility during migration (will be removed later)
// Updated to use TransactionWithCategories to include categories support
export type Recibo = TransactionWithCategories

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

// ============================================================================
// RECURRING TRANSACTIONS TYPES
// ============================================================================

// Frequency types for recurring transactions
export type FrequencyType = 'monthly' | 'biweekly' | 'weekly' | 'yearly'

// Configuration for different frequency types
export interface MonthlyFrequencyConfig {
  day: number // Day of month (1-31)
}

export interface BiweeklyFrequencyConfig {
  days: [number, number] // Two days of month (e.g., [1, 15])
}

export interface WeeklyFrequencyConfig {
  weekday: number // Day of week (0=Sunday, 6=Saturday)
}

export interface YearlyFrequencyConfig {
  month: number // Month (1-12)
  day: number // Day of month (1-31)
}

// Union type for all frequency configs
export type FrequencyConfig =
  | MonthlyFrequencyConfig
  | BiweeklyFrequencyConfig
  | WeeklyFrequencyConfig
  | YearlyFrequencyConfig

// Recurring transaction rule
export interface RecurringTransaction {
  id: string
  user_id: string
  description: string
  amount: number
  transaction_type: 'withdrawal' | 'deposit'
  frequency_type: FrequencyType
  frequency_config: FrequencyConfig
  start_date: string // ISO date string
  end_date?: string | null // ISO date string or null for no end
  is_active: boolean
  last_generated_date?: string | null // ISO date string
  created_at: string
  updated_at: string
}

// Log of generated transactions
export interface TransactionGenerationLog {
  id: string
  recurring_transaction_id: string
  generated_transaction_id: string
  generated_for_date: string // ISO date string
  generated_at: string
}

// Extended recurring transaction with generation logs
export interface RecurringTransactionWithLogs extends RecurringTransaction {
  generation_logs?: TransactionGenerationLog[]
}
