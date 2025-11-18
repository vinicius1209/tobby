import type { SupabaseClient } from "@supabase/supabase-js"

export interface UserPreferences {
  id: string
  user_id: string
  monthly_budget: number
  created_at: string
  updated_at: string
}

export type TobbyVariant = "happy" | "neutral" | "worried"

export interface BudgetStatus {
  budget: number
  spent: number
  remaining: number
  percentage: number
  variant: TobbyVariant
  isOverBudget: boolean
}

/**
 * Get user's monthly budget preferences
 */
export async function getUserBudget(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("monthly_budget")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("Error fetching user budget:", error)
    return 0
  }

  return data?.monthly_budget || 0
}

/**
 * Set user's monthly budget
 */
export async function setUserBudget(
  supabase: SupabaseClient,
  userId: string,
  budget: number
): Promise<boolean> {
  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        monthly_budget: budget,
      },
      {
        onConflict: "user_id",
      }
    )

  if (error) {
    console.error("Error setting user budget:", error)
    return false
  }

  return true
}

/**
 * Calculate budget status and Tobby's emotional state
 */
export function calculateBudgetStatus(
  spent: number,
  budget: number
): BudgetStatus {
  // If no budget set, default to neutral state
  if (budget === 0) {
    return {
      budget: 0,
      spent,
      remaining: 0,
      percentage: 0,
      variant: "neutral",
      isOverBudget: false,
    }
  }

  const remaining = budget - spent
  const percentage = (spent / budget) * 100
  const isOverBudget = spent > budget

  // Determine Tobby's emotional state based on percentage
  let variant: TobbyVariant
  if (percentage < 80) {
    variant = "happy" // Great job! Under 80% of budget
  } else if (percentage < 100) {
    variant = "neutral" // Getting close to budget limit
  } else {
    variant = "worried" // Over budget!
  }

  return {
    budget,
    spent,
    remaining,
    percentage: Math.min(percentage, 100), // Cap at 100% for display
    variant,
    isOverBudget,
  }
}

/**
 * Get Tobby variant based on budget percentage
 */
export function getBudgetState(percentage: number): TobbyVariant {
  if (percentage < 80) return "happy"
  if (percentage < 100) return "neutral"
  return "worried"
}

/**
 * Format budget status for display
 */
export function formatBudgetStatus(status: BudgetStatus): {
  message: string
  icon: string
  color: string
} {
  if (status.budget === 0) {
    return {
      message: "No budget set",
      icon: "ℹ️",
      color: "text-muted-foreground",
    }
  }

  if (status.isOverBudget) {
    return {
      message: `Over budget by ${Math.abs(status.remaining).toFixed(2)}`,
      icon: "⚠️",
      color: "text-red-600",
    }
  }

  if (status.percentage >= 80) {
    return {
      message: `${status.percentage.toFixed(0)}% of budget used`,
      icon: "⚡",
      color: "text-yellow-600",
    }
  }

  return {
    message: `${status.remaining.toFixed(2)} remaining`,
    icon: "✅",
    color: "text-green-600",
  }
}
