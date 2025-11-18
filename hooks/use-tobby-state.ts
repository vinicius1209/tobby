"use client"

import { useEffect } from "react"
import { useBudget } from "@/contexts/budget-context"
import { getMonthTotal } from "@/lib/format-utils"
import type { Transaction } from "@/lib/types"

/**
 * Hook to get Tobby's state based on current month spending
 *
 * Now optimized to:
 * - Use BudgetContext (single query per session)
 * - Calculate spending locally from transactions
 * - No database queries on every render
 * - Auto-updates when transactions change
 */
export function useTobbyState(transactions: Transaction[] = []) {
  const { budgetStatus, updateMonthlySpent, loading } = useBudget()

  useEffect(() => {
    // Calculate current month spending locally (no DB query)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const spent = getMonthTotal(transactions, currentMonth, currentYear)

    // Update context with new spent value
    // This recalculates variant, percentage, etc. without re-fetching budget
    updateMonthlySpent(spent)
  }, [transactions, updateMonthlySpent])

  return {
    ...budgetStatus,
    loading,
  }
}
