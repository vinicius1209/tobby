"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { ExpenseCard } from "@/components/expense-card"
import { StatsCard } from "@/components/stats-card"
import { ExpenseFilters, type FilterState } from "@/components/expense-filters"
import { TelegramLinkDialog } from "@/components/telegram-link-dialog"
import { Footer } from "@/components/footer"
import type { Recibo } from "@/lib/types"
import { formatCurrency, getUniqueValues } from "@/lib/format-utils"
import { Receipt, TrendingUp, Calendar, CreditCard, BarChart3, Link2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card } from "@/components/ui/card"

export default function DashboardPage() {
  const [receipts, setReceipts] = useState<Recibo[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<Recibo[]>([])
  const [loading, setLoading] = useState(true)
  const [isLinked, setIsLinked] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchReceipts = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // First, get the user's telegram chat_id
      const { data: telegramUser, error: telegramError } = await supabase
        .from("telegram_users")
        .select("chat_id")
        .eq("user_id", user.id)
        .maybeSingle()

      // If user hasn't linked their Telegram account yet, show empty state
      if (!telegramUser) {
        setIsLinked(false)
        setReceipts([])
        setFilteredReceipts([])
        setLoading(false)
        return
      }

      setIsLinked(true)

      // Handle unexpected errors (not "no rows found")
      if (telegramError) {
        console.error("[v0] Error fetching telegram user:", telegramError)
        setReceipts([])
        setFilteredReceipts([])
        setLoading(false)
        return
      }

      // Now fetch receipts filtered by the user's chat_id
      const { data, error } = await supabase
        .from("recibos_processados")
        .select("*")
        .eq("chat_id", telegramUser.chat_id)
        .order("data_compra", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching receipts:", error)
      } else {
        setReceipts((data as Recibo[]) || [])
        setFilteredReceipts((data as Recibo[]) || [])
      }
      setLoading(false)
    }

    fetchReceipts()
  }, [router, supabase])

  const handleFilterChange = (filters: FilterState) => {
    let filtered = [...receipts]

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.nome_estabelecimento?.toLowerCase().includes(term) ||
          r.itens_comprados?.toLowerCase().includes(term) ||
          r.tipo_estabelecimento?.toLowerCase().includes(term),
      )
    }

    // Establishment type filter
    if (filters.establishmentType && filters.establishmentType !== "all") {
      filtered = filtered.filter((r) => r.tipo_estabelecimento === filters.establishmentType)
    }

    // Payment method filter
    if (filters.paymentMethod && filters.paymentMethod !== "all") {
      filtered = filtered.filter((r) => r.metodo_pagamento === filters.paymentMethod)
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter((r) => new Date(r.data_compra) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter((r) => new Date(r.data_compra) <= new Date(filters.dateTo))
    }

    setFilteredReceipts(filtered)
  }

  // Calculate stats from filtered receipts
  const totalSpent = filteredReceipts.reduce((sum, r) => sum + Number(r.valor_total), 0)
  const totalReceipts = filteredReceipts.length
  const avgSpent = totalReceipts > 0 ? totalSpent / totalReceipts : 0

  // Get current month receipts
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyReceipts = filteredReceipts.filter((r) => {
    const date = new Date(r.data_compra)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  const monthlySpent = monthlyReceipts.reduce((sum, r) => sum + Number(r.valor_total), 0)

  // Get unique establishment types and payment methods for filters
  const establishmentTypes = getUniqueValues(receipts.map((r) => r.tipo_estabelecimento))
  const paymentMethods = getUniqueValues(receipts.map((r) => r.metodo_pagamento))

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Dashboard</h2>
              <p className="text-muted-foreground mt-1">Let Tobby help you manage your finances</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Spent"
              value={formatCurrency(totalSpent)}
              description="Filtered results"
              icon={TrendingUp}
            />
            <StatsCard
              title="This Month"
              value={formatCurrency(monthlySpent)}
              description={`${monthlyReceipts.length} receipts`}
              icon={Calendar}
            />
            <StatsCard
              title="Total Receipts"
              value={totalReceipts.toString()}
              description="Filtered results"
              icon={Receipt}
            />
            <StatsCard
              title="Average Expense"
              value={formatCurrency(avgSpent)}
              description="Per receipt"
              icon={CreditCard}
            />
          </div>

          {/* Filters */}
          <ExpenseFilters
            onFilterChange={handleFilterChange}
            establishmentTypes={establishmentTypes}
            paymentMethods={paymentMethods}
          />

          {/* Telegram Integration Info */}
          {!isLinked && (
            <Alert>
              <Link2 className="h-4 w-4" />
              <AlertTitle>Connect your Telegram account</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-3">
                  Link your Telegram account to automatically track expenses from receipt photos sent to our bot.
                </p>
                <Button onClick={() => setShowLinkDialog(true)} size="sm">
                  <Link2 className="mr-2 h-4 w-4" />
                  Link Telegram Account
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isLinked && receipts.length === 0 && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                No expenses found. Start sending receipt photos to your Telegram bot to automatically track your
                expenses here!
              </AlertDescription>
            </Alert>
          )}

          {/* Recent Expenses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                Recent Expenses{" "}
                {filteredReceipts.length !== receipts.length && `(${filteredReceipts.length} of ${receipts.length})`}
              </h3>
            </div>
            {filteredReceipts.length > 0 ? (
              <div className="grid gap-4">
                {filteredReceipts.map((recibo) => (
                  <ExpenseCard key={recibo.id} recibo={recibo} />
                ))}
              </div>
            ) : receipts.length > 0 ? (
              <Card className="p-8 text-center">
                <InfoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No expenses match your filters</p>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No expenses to display</p>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Telegram Link Dialog */}
      <TelegramLinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        onLinkSuccess={() => {
          // Reload receipts after successful link
          window.location.reload()
        }}
      />

      <Footer />
    </div>
  )
}
