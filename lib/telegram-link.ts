import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { UserLinkToken, TelegramUser } from "@/lib/types"

/**
 * Generates a random 6-character alphanumeric token
 */
function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excluding similar looking characters
  let token = ""
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Creates a new link token for the current user
 * Token expires in 15 minutes
 */
export async function generateLinkToken(): Promise<{
  token: string | null
  error: string | null
}> {
  const supabase = getSupabaseBrowserClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { token: null, error: "User not authenticated" }
  }

  // Generate a unique token
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15 minutes expiration

  // Insert token into database
  const { error: insertError } = await supabase.from("user_link_tokens").insert({
    user_id: user.id,
    token: token,
    expires_at: expiresAt.toISOString(),
  })

  if (insertError) {
    console.error("Error creating link token:", insertError)
    return { token: null, error: "Failed to generate token" }
  }

  return { token, error: null }
}

/**
 * Checks if the user has successfully linked their Telegram account
 * Returns the telegram user data if linked, null otherwise
 */
export async function checkTelegramLinkStatus(): Promise<{
  linked: boolean
  telegramUser: TelegramUser | null
  error: string | null
}> {
  const supabase = getSupabaseBrowserClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { linked: false, telegramUser: null, error: "User not authenticated" }
  }

  // Check if user has a telegram_users record
  const { data: telegramUser, error: telegramError } = await supabase
    .from("telegram_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (telegramError) {
    console.error("Error checking telegram link:", telegramError)
    return { linked: false, telegramUser: null, error: "Failed to check link status" }
  }

  return {
    linked: !!telegramUser,
    telegramUser: telegramUser as TelegramUser | null,
    error: null,
  }
}

/**
 * Gets the most recent active token for the current user
 */
export async function getActiveToken(): Promise<{
  token: UserLinkToken | null
  error: string | null
}> {
  const supabase = getSupabaseBrowserClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { token: null, error: "User not authenticated" }
  }

  // Get the most recent unused and non-expired token
  const { data: token, error: tokenError } = await supabase
    .from("user_link_tokens")
    .select("*")
    .eq("user_id", user.id)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (tokenError) {
    console.error("Error fetching token:", tokenError)
    return { token: null, error: "Failed to fetch token" }
  }

  return { token: token as UserLinkToken | null, error: null }
}
