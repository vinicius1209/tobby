import type { Category, TransactionCategory } from "./types"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Get all categories for a specific user
 */
export async function getUserCategories(
  supabase: SupabaseClient,
  userId: string
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching user categories:", error)
    return []
  }

  return data as Category[]
}

/**
 * Get categories for a specific transaction
 */
export async function getTransactionCategories(
  supabase: SupabaseClient,
  transactionId: string
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("transaction_categories")
    .select(`
      category_id,
      categories (
        id,
        user_id,
        name,
        color,
        icon,
        created_at
      )
    `)
    .eq("transaction_id", transactionId)

  if (error) {
    console.error("Error fetching transaction categories:", error)
    return []
  }

  // Extract categories from the joined query
  return data
    .map((item: any) => item.categories)
    .filter(Boolean) as Category[]
}

/**
 * Create a new category for a user
 */
export async function createCategory(
  supabase: SupabaseClient,
  category: {
    user_id: string
    name: string
    color?: string
    icon?: string
  }
): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: category.user_id,
      name: category.name.trim(),
      color: category.color || "#808080",
      icon: category.icon || "Tag",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating category:", error)
    return null
  }

  return data as Category
}

/**
 * Update an existing category
 */
export async function updateCategory(
  supabase: SupabaseClient,
  categoryId: string,
  updates: {
    name?: string
    color?: string
    icon?: string
  }
): Promise<boolean> {
  const { error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", categoryId)

  if (error) {
    console.error("Error updating category:", error)
    return false
  }

  return true
}

/**
 * Delete a category (will also delete all transaction_categories relationships due to CASCADE)
 */
export async function deleteCategory(
  supabase: SupabaseClient,
  categoryId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)

  if (error) {
    console.error("Error deleting category:", error)
    return false
  }

  return true
}

/**
 * Assign categories to a transaction (replaces all existing category assignments)
 */
export async function assignCategories(
  supabase: SupabaseClient,
  transactionId: string,
  categoryIds: string[]
): Promise<boolean> {
  // First, remove all existing category assignments for this transaction
  const { error: deleteError } = await supabase
    .from("transaction_categories")
    .delete()
    .eq("transaction_id", transactionId)

  if (deleteError) {
    console.error("Error removing old category assignments:", deleteError)
    return false
  }

  // If no categories to assign, we're done
  if (categoryIds.length === 0) {
    return true
  }

  // Insert new category assignments
  const assignments = categoryIds.map((categoryId) => ({
    transaction_id: transactionId,
    category_id: categoryId,
  }))

  const { error: insertError } = await supabase
    .from("transaction_categories")
    .insert(assignments)

  if (insertError) {
    console.error("Error assigning categories:", insertError)
    return false
  }

  return true
}

/**
 * Add categories to a transaction (keeps existing ones)
 */
export async function addCategories(
  supabase: SupabaseClient,
  transactionId: string,
  categoryIds: string[]
): Promise<boolean> {
  if (categoryIds.length === 0) return true

  const assignments = categoryIds.map((categoryId) => ({
    transaction_id: transactionId,
    category_id: categoryId,
  }))

  const { error } = await supabase
    .from("transaction_categories")
    .insert(assignments)
    .select()

  if (error) {
    console.error("Error adding categories:", error)
    return false
  }

  return true
}

/**
 * Remove specific categories from a transaction
 */
export async function removeCategories(
  supabase: SupabaseClient,
  transactionId: string,
  categoryIds: string[]
): Promise<boolean> {
  if (categoryIds.length === 0) return true

  const { error } = await supabase
    .from("transaction_categories")
    .delete()
    .eq("transaction_id", transactionId)
    .in("category_id", categoryIds)

  if (error) {
    console.error("Error removing categories:", error)
    return false
  }

  return true
}

/**
 * Check if a category name already exists for a user
 */
export async function categoryExists(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  excludeCategoryId?: string
): Promise<boolean> {
  let query = supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name.trim())

  if (excludeCategoryId) {
    query = query.neq("id", excludeCategoryId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error checking category existence:", error)
    return false
  }

  return data && data.length > 0
}

/**
 * Get suggested categories based on transaction description
 * (Simple implementation - can be enhanced with ML/fuzzy matching)
 */
export function getSuggestedCategories(
  description: string,
  userCategories: Category[]
): Category[] {
  const desc = description.toLowerCase().trim()
  if (!desc) return []

  // Simple fuzzy matching - find categories whose names contain parts of the description
  // or vice versa
  return userCategories.filter((category) => {
    const catName = category.name.toLowerCase().trim()
    return (
      desc.includes(catName) ||
      catName.includes(desc) ||
      // Check for word overlaps
      desc.split(/\s+/).some((word) => catName.includes(word)) ||
      catName.split(/\s+/).some((word) => desc.includes(word))
    )
  }).slice(0, 3) // Return max 3 suggestions
}

/**
 * Get most used categories for a user
 */
export async function getMostUsedCategories(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 5
): Promise<Array<Category & { usage_count: number }>> {
  const { data, error } = await supabase
    .from("transaction_categories")
    .select(`
      category_id,
      categories!inner (
        id,
        user_id,
        name,
        color,
        icon,
        created_at
      )
    `)
    .eq("categories.user_id", userId)

  if (error) {
    console.error("Error fetching most used categories:", error)
    return []
  }

  // Count usage per category
  const usageMap = new Map<string, { category: any; count: number }>()

  data.forEach((item: any) => {
    const category = item.categories
    if (category) {
      const existing = usageMap.get(category.id)
      if (existing) {
        existing.count++
      } else {
        usageMap.set(category.id, { category, count: 1 })
      }
    }
  })

  // Sort by usage count and return top N
  return Array.from(usageMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item) => ({
      ...(item.category as Category),
      usage_count: item.count,
    }))
}

/**
 * Color presets for categories
 */
export const CATEGORY_COLOR_PRESETS = [
  { name: "Gray", value: "#808080" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Lime", value: "#84CC16" },
  { name: "Green", value: "#22C55E" },
  { name: "Emerald", value: "#10B981" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Sky", value: "#0EA5E9" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Fuchsia", value: "#D946EF" },
  { name: "Pink", value: "#EC4899" },
  { name: "Rose", value: "#F43F5E" },
]

/**
 * Icon presets for categories
 */
export const CATEGORY_ICON_PRESETS = [
  "Store",
  "ShoppingCart",
  "Coffee",
  "Utensils",
  "Home",
  "Car",
  "Bus",
  "Plane",
  "Heart",
  "Briefcase",
  "GraduationCap",
  "Dumbbell",
  "Music",
  "GameController",
  "Gift",
  "Package",
  "CreditCard",
  "Wallet",
  "PiggyBank",
  "TrendingUp",
]
