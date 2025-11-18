"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { DashboardShell } from "@/components/dashboard-shell"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { BudgetSettingsSection } from "@/components/settings/budget-settings-section"
import { AccountSection } from "@/components/settings/account-section"
import { TelegramSection } from "@/components/settings/telegram-section"

export default function SettingsPage() {
  const t = useTranslations("settings")
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [userEmail, setUserEmail] = useState("")
  const [memberSince, setMemberSince] = useState("")

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUserEmail(user.email || "")
      setMemberSince(
        new Date(user.created_at).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      )
    }

    fetchUserInfo()
  }, [router, supabase])

  return (
    <DashboardShell breadcrumb={[{ label: t("title") }]}>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Budget Settings - Full width */}
          <div className="md:col-span-2">
            <BudgetSettingsSection />
          </div>

          {/* Account Info */}
          <AccountSection email={userEmail} memberSince={memberSince} />

          {/* Telegram Integration */}
          <TelegramSection />
        </div>
      </div>
    </DashboardShell>
  )
}
