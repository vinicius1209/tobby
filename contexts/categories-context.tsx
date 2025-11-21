"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getUserCategories } from "@/lib/category-utils"
import type { Category } from "@/lib/types"

interface CategoriesContextType {
  categories: Category[]
  loading: boolean
  error: string | null
  refreshCategories: () => Promise<void>
  addCategory: (category: Category) => void
  updateCategory: (categoryId: string, updates: Partial<Category>) => void
  removeCategory: (categoryId: string) => void
}

const CategoriesContext = createContext<CategoriesContextType | null>(null)

// Cache TTL: 30 minutes (categories change rarely)
const CACHE_TTL = 30 * 60 * 1000

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const fetchCategories = useCallback(async (force = false) => {
    // Check cache TTL
    const now = Date.now()
    if (!force && lastFetchTime && (now - lastFetchTime) < CACHE_TTL) {
      // Use cached data
      return
    }

    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setCategories([])
        setLoading(false)
        return
      }

      // Fetch categories (single query)
      const userCategories = await getUserCategories(supabase, user.id)

      setCategories(userCategories)
      setLastFetchTime(now)
    } catch (err) {
      console.error("Error fetching categories:", err)
      setError("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }, [supabase, lastFetchTime])

  // Initial fetch on mount
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Force refresh categories from database
  const refreshCategories = useCallback(async () => {
    await fetchCategories(true)
  }, [fetchCategories])

  // Optimistic updates (update local state without query)
  const addCategory = useCallback((category: Category) => {
    setCategories(prev => [...prev, category])
  }, [])

  const updateCategory = useCallback((categoryId: string, updates: Partial<Category>) => {
    setCategories(prev =>
      prev.map(cat => cat.id === categoryId ? { ...cat, ...updates } : cat)
    )
  }, [])

  const removeCategory = useCallback((categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId))
  }, [])

  const value: CategoriesContextType = {
    categories,
    loading,
    error,
    refreshCategories,
    addCategory,
    updateCategory,
    removeCategory,
  }

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoriesContext)

  if (!context) {
    throw new Error("useCategories must be used within a CategoriesProvider")
  }

  return context
}
