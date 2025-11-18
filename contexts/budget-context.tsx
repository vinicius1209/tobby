"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getUserBudget, calculateBudgetStatus, type BudgetStatus } from "@/lib/budget-utils"

interface BudgetContextType {
  budgetStatus: BudgetStatus
  loading: boolean
  refreshBudget: () => Promise<void>
  updateMonthlySpent: (spent: number) => void
}

const BudgetContext = createContext<BudgetContextType | null>(null)

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function BudgetProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient()

  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>({
    budget: 0,
    spent: 0,
    remaining: 0,
    percentage: 0,
    variant: "neutral",
    isOverBudget: false,
  })

  const [loading, setLoading] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const fetchBudgetData = useCallback(async (force = false) => {
    // Check cache TTL
    const now = Date.now()
    if (!force && lastFetchTime && (now - lastFetchTime) < CACHE_TTL) {
      // Use cached data
      return
    }

    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch budget (single query)
      const budget = await getUserBudget(supabase, user.id)

      // Initialize with 0 spent (will be updated via updateMonthlySpent)
      const status = calculateBudgetStatus(0, budget)

      setBudgetStatus(status)
      setLastFetchTime(now)
    } catch (error) {
      console.error("Error fetching budget:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase, lastFetchTime])

  // Initial fetch on mount
  useEffect(() => {
    fetchBudgetData()
  }, [fetchBudgetData])

  // Update monthly spent without re-fetching budget
  const updateMonthlySpent = useCallback((spent: number) => {
    setBudgetStatus(prev => calculateBudgetStatus(spent, prev.budget))
  }, [])

  // Force refresh budget from database
  const refreshBudget = useCallback(async () => {
    await fetchBudgetData(true)
  }, [fetchBudgetData])

  const value: BudgetContextType = {
    budgetStatus,
    loading,
    refreshBudget,
    updateMonthlySpent,
  }

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  )
}

export function useBudget() {
  const context = useContext(BudgetContext)

  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider")
  }

  return context
}
