import type { Transaction } from "./types"

// For backward compatibility during migration
type Recibo = Transaction

/**
 * Check if a value is null, undefined, empty string, or the string "null"
 */
function isNullish(value: string | null | undefined): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "null" ||
    value === "undefined" ||
    value.trim() === ""
  )
}

/**
 * Format currency values to BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

/**
 * Parse YYYY-MM-DD string to Date object in local timezone
 * Avoids UTC conversion issues when creating Date from string
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Format date to Brazilian Portuguese
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }

  // Parse string dates without UTC conversion
  const dateObj = typeof date === 'string' ? parseDateString(date) : date
  return dateObj.toLocaleDateString("pt-BR", options || defaultOptions)
}

/**
 * Convert Date object to YYYY-MM-DD string for database storage
 * Uses local timezone to avoid date shifts when converting to UTC
 */
export function formatDateForDB(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Safely get transaction description with fallback
 * Renamed from: getEstablishmentType
 */
export function getDescription(transaction: Transaction, fallback: string = "Outros"): string {
  if (!isNullish(transaction.description)) {
    return capitalizeWords(transaction.description!.trim())
  }
  return fallback
}

/**
 * Check if transaction description is available
 * Renamed from: hasEstablishmentType
 */
export function hasDescription(transaction: Transaction): boolean {
  return !isNullish(transaction.description)
}

/**
 * Get transaction type label (translated)
 */
export function getTransactionTypeLabel(type: 'withdrawal' | 'deposit', locale: string = 'pt-BR'): string {
  const labels = {
    'pt-BR': {
      withdrawal: 'Retirada',
      deposit: 'Depósito'
    },
    'en': {
      withdrawal: 'Withdrawal',
      deposit: 'Deposit'
    }
  }

  return labels[locale as keyof typeof labels]?.[type] || type
}

/**
 * Check if transaction is a deposit (income)
 */
export function isDeposit(transaction: Transaction): boolean {
  return transaction.transaction_type === 'deposit'
}

/**
 * Check if transaction is a withdrawal (expense)
 */
export function isWithdrawal(transaction: Transaction): boolean {
  return transaction.transaction_type === 'withdrawal'
}

/**
 * Format transaction type for display with icon/color
 */
export function formatTransactionType(transaction: Transaction): {
  label: string
  color: string
  icon: string
} {
  return isDeposit(transaction)
    ? { label: 'Depósito', color: 'text-green-600', icon: 'ArrowDownCircle' }
    : { label: 'Retirada', color: 'text-red-600', icon: 'ArrowUpCircle' }
}

/**
 * Get unique values from array, filtering out null/empty values and string "null"
 * Capitalizes string values for consistency
 */
export function getUniqueValues<T>(arr: (T | null | undefined)[]): T[] {
  return Array.from(
    new Set(
      arr
        .filter((item): item is T => {
          if (item === null || item === undefined) return false
          if (typeof item === 'string') {
            return !isNullish(item)
          }
          return true
        })
        .map(item => typeof item === 'string' ? capitalizeWords(item.trim()) : item)
    )
  ) as T[]
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Calculate transaction metrics for advanced cards
 */

/**
 * Calculate the percentage this transaction represents of the total month amount
 * Updated to use: amount (was valor_total)
 */
export function calculateMonthPercentage(transaction: Transaction, monthTotal: number): number {
  if (monthTotal === 0) return 0
  return (transaction.amount / monthTotal) * 100
}

/**
 * Calculate frequency of similar transactions (same description)
 * Updated to use: description (was tipo_estabelecimento)
 */
export function calculateFrequency(transaction: Transaction, allTransactions: Transaction[]): number {
  const desc = transaction.description?.toLowerCase().trim()
  if (!desc) return 1

  return allTransactions.filter(
    (t) => t.description?.toLowerCase().trim() === desc
  ).length
}

/**
 * Calculate trend (% change from previous month for same description)
 * Updated to use: transaction_date (was data_compra), description (was tipo_estabelecimento), amount (was valor_total)
 */
export function calculateTrend(transaction: Transaction, allTransactions: Transaction[]): number {
  const currentDate = parseDateString(transaction.transaction_date)
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const desc = transaction.description?.toLowerCase().trim()

  if (!desc) return 0

  // Get previous month
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

  // Calculate total for current month (same description)
  const currentMonthTotal = allTransactions
    .filter((t) => {
      const date = parseDateString(t.transaction_date)
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        t.description?.toLowerCase().trim() === desc
      )
    })
    .reduce((sum, t) => sum + t.amount, 0)

  // Calculate total for previous month (same description)
  const previousMonthTotal = allTransactions
    .filter((t) => {
      const date = parseDateString(t.transaction_date)
      return (
        date.getMonth() === previousMonth &&
        date.getFullYear() === previousYear &&
        t.description?.toLowerCase().trim() === desc
      )
    })
    .reduce((sum, t) => sum + t.amount, 0)

  if (previousMonthTotal === 0) return 0

  // Calculate percentage change
  return ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
}

/**
 * Calculate category trend - percentage of total spent in transaction's categories
 * Shows what % of the total budget was spent on transactions with the same categories
 */
export function calculateCategoryTrend(transaction: Transaction, allTransactions: Transaction[]): number {
  // Get categories of current transaction
  const transactionCategories = transaction.categories || []

  // If no categories, return 0
  if (transactionCategories.length === 0) return 0

  // Get category IDs for comparison
  const categoryIds = transactionCategories.map(cat => cat.id)

  // Calculate total of all transactions
  const totalAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0)

  if (totalAmount === 0) return 0

  // Calculate total for transactions with at least one matching category
  const categoryTotal = allTransactions
    .filter((t) => {
      const tCategoryIds = (t.categories || []).map(cat => cat.id)
      // Check if there's at least one matching category
      return tCategoryIds.some(id => categoryIds.includes(id))
    })
    .reduce((sum, t) => sum + t.amount, 0)

  // Return percentage of total
  return (categoryTotal / totalAmount) * 100
}

/**
 * Get month total amount from transactions
 * Updated to use: transaction_date (was data_compra), amount (was valor_total)
 */
export function getMonthTotal(transactions: Transaction[], month: number, year: number): number {
  return transactions
    .filter((t) => {
      const date = parseDateString(t.transaction_date)
      return date.getMonth() === month && date.getFullYear() === year
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

// ============================================================================
// BACKWARD COMPATIBILITY FUNCTIONS (will be removed after migration)
// ============================================================================

/**
 * @deprecated Use getDescription instead. This is kept for backward compatibility.
 */
export function getEstablishmentType(recibo: Recibo, fallback: string = "Outros"): string {
  return getDescription(recibo, fallback)
}

/**
 * @deprecated Use hasDescription instead. This is kept for backward compatibility.
 */
export function hasEstablishmentType(recibo: Recibo): boolean {
  return hasDescription(recibo)
}

/**
 * @deprecated Field nome_estabelecimento was removed. Use description instead.
 */
export function getEstablishmentName(recibo: Recibo, fallback: string = "Não Informado"): string {
  console.warn('getEstablishmentName is deprecated. Use transaction.description instead.')
  return getDescription(recibo, fallback)
}

/**
 * @deprecated Field nome_estabelecimento was removed.
 */
export function hasEstablishmentName(recibo: Recibo): boolean {
  console.warn('hasEstablishmentName is deprecated. Use hasDescription instead.')
  return hasDescription(recibo)
}
