"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from "react"
import { useAuth } from "./auth-context"
import { checkTelegramLinkStatus } from "@/lib/telegram-link"
import type { TelegramUser } from "@/lib/types"

interface TelegramContextType {
  isLinked: boolean
  telegramUser: TelegramUser | null
  loading: boolean
  refreshStatus: () => Promise<void>
}

const TelegramContext = createContext<TelegramContextType | null>(null)

// Cache TTL: 15 minutes (telegram link status changes rarely)
const CACHE_TTL = 15 * 60 * 1000

export function TelegramProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const [isLinked, setIsLinked] = useState(false)
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const fetchStatus = useCallback(
    async (force = false) => {
      if (!user) {
        setIsLinked(false)
        setTelegramUser(null)
        setLoading(false)
        return
      }

      // Check cache TTL
      const now = Date.now()
      if (!force && lastFetchTime && now - lastFetchTime < CACHE_TTL) {
        // Use cached data
        return
      }

      try {
        setLoading(true)
        const { linked, telegramUser: tUser } = await checkTelegramLinkStatus()
        setIsLinked(linked)
        setTelegramUser(tUser)
        setLastFetchTime(now)
      } catch (error) {
        console.error("Error checking Telegram status:", error)
        setIsLinked(false)
        setTelegramUser(null)
      } finally {
        setLoading(false)
      }
    },
    [user, lastFetchTime]
  )

  // Initial fetch on mount or when user changes
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Force refresh status from database
  const refreshStatus = useCallback(async () => {
    await fetchStatus(true)
  }, [fetchStatus])

  const value: TelegramContextType = {
    isLinked,
    telegramUser,
    loading,
    refreshStatus,
  }

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  )
}

export function useTelegram() {
  const context = useContext(TelegramContext)

  if (!context) {
    throw new Error("useTelegram must be used within a TelegramProvider")
  }

  return context
}
