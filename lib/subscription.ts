import { getSupabaseServerClient } from "./supabase/server"

export interface UserSubscription {
  id: string
  user_id: string
  subscription_status: "free" | "active" | "canceled" | "past_due"
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan_name: string
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase.from("user_subscriptions").select("*").eq("user_id", user.id).single()

  if (error) {
    console.error("[v0] Error fetching subscription:", error)
    return null
  }

  return data as UserSubscription
}

export function isPremiumUser(subscription: UserSubscription | null): boolean {
  if (!subscription) return false
  return subscription.subscription_status === "active" && subscription.plan_name !== "free"
}

export function hasFeatureAccess(subscription: UserSubscription | null, featureKey: string): boolean {
  // Free features available to all
  const freeFeatures = ["basic_dashboard", "receipt_tracking", "basic_filters"]
  if (freeFeatures.includes(featureKey)) return true

  // Premium features require active subscription
  return isPremiumUser(subscription)
}
