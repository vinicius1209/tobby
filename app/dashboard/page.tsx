"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { ExpenseCardAdvanced } from "@/components/expense-card-advanced"
import { ExpenseListHeader } from "@/components/expense-list-header"
import { ExpensesTimeline } from "@/components/expenses-timeline"
import { StatsCard } from "@/components/stats-card"
import { ExpenseFilters, type FilterState } from "@/components/expense-filters"
import { TelegramLinkDialog } from "@/components/telegram-link-dialog"
import { EditExpenseDialog } from "@/components/edit-expense-dialog"
import { DeleteExpenseDialog } from "@/components/delete-expense-dialog"
import { TobbyPeek } from "@/components/tobby-peek"
import { useTobbyState } from "@/hooks/use-tobby-state"
import type { Recibo, Category } from "@/lib/types"
import {
  formatCurrency,
  getUniqueValues,
  calculateMonthPercentage,
  calculateFrequency,
  calculateTrend,
  calculateCategoryTrend,
  getMonthTotal,
  parseDateString,
} from "@/lib/format-utils"
import { Receipt, TrendingUp, Calendar, CreditCard, Link2, Filter, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const tViewModes = useTranslations('transactions.viewModes')
  const [receipts, setReceipts] = useState<Recibo[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<Recibo[]>([])
  const [loading, setLoading] = useState(true)
  const [isLinked, setIsLinked] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "impact" | "frequency" | "value" | null>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [editingRecibo, setEditingRecibo] = useState<Recibo | null>(null)
  const [deletingRecibo, setDeletingRecibo] = useState<Recibo | null>(null)
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    searchTerm: "",
    establishmentType: "all",
    dateFrom: "",
    dateTo: "",
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  // Get Tobby's state for floating component
  const { variant, percentage, spent, budget } = useTobbyState(receipts)

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

      // Now fetch transactions filtered by the user's chat_id and not soft-deleted
      // Include categories via JOIN
      const { data, error } = await supabase
        .from("user_transactions")
        .select(`
          *,
          transaction_categories(
            categories(*)
          )
        `)
        .eq("chat_id", telegramUser.chat_id)
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching receipts:", error)
      } else {
        // Transform data to include categories array
        const receiptsWithCategories = (data || []).map((transaction: any) => ({
          ...transaction,
          categories: transaction.transaction_categories
            ?.map((tc: any) => tc.categories)
            .filter(Boolean) || []
        }))

        setReceipts(receiptsWithCategories as Recibo[])
        setFilteredReceipts(receiptsWithCategories as Recibo[])
      }
      setLoading(false)
    }

    fetchReceipts()
  }, [router, supabase])

  const handleFilterChange = (filters: FilterState) => {
    // Save current filters for refresh functionality
    setCurrentFilters(filters)

    let filtered = [...receipts]

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.description?.toLowerCase().includes(term),
      )
    }

    // Description filter (was: establishment type filter)
    if (filters.establishmentType && filters.establishmentType !== "all") {
      filtered = filtered.filter((r) => r.description === filters.establishmentType)
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter((r) => parseDateString(r.transaction_date) >= parseDateString(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter((r) => parseDateString(r.transaction_date) <= parseDateString(filters.dateTo))
    }

    setFilteredReceipts(filtered)
  }

  const handleSort = (field: "date" | "impact" | "frequency" | "value") => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to descending
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const handleRefreshReceipts = async () => {
    setIsRefreshing(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Get the user's telegram chat_id
      const { data: telegramUser } = await supabase
        .from("telegram_users")
        .select("chat_id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!telegramUser) {
        setIsLinked(false)
        setReceipts([])
        setFilteredReceipts([])
        setIsRefreshing(false)
        return
      }

      // Fetch transactions with categories
      const { data, error } = await supabase
        .from("user_transactions")
        .select(`
          *,
          transaction_categories(
            categories(*)
          )
        `)
        .eq("chat_id", telegramUser.chat_id)
        .is("deleted_at", null)
        .order("transaction_date", { ascending: false })

      if (error) {
        console.error("Error refreshing receipts:", error)
      } else {
        // Transform data to include categories array
        const receiptsWithCategories = (data || []).map((transaction: any) => ({
          ...transaction,
          categories: transaction.transaction_categories
            ?.map((tc: any) => tc.categories)
            .filter(Boolean) || []
        }))

        setReceipts(receiptsWithCategories as Recibo[])

        // Reapply current filters
        handleFilterChange(currentFilters)
      }
    } catch (error) {
      console.error("Failed to refresh receipts:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleEditRecibo = (recibo: Recibo) => {
    setEditingRecibo(recibo)
  }

  const handleDeleteRecibo = (recibo: Recibo) => {
    setDeletingRecibo(recibo)
  }

  const handleSaveEdit = async (updates: Partial<Recibo>, categories: Category[]) => {
    if (!editingRecibo) return

    // Optimistic update - update local state immediately with categories
    const updatedRecibo = { ...editingRecibo, ...updates, categories }
    setReceipts((prev) =>
      prev.map((r) => (r.id === editingRecibo.id ? updatedRecibo : r))
    )
    setFilteredReceipts((prev) =>
      prev.map((r) => (r.id === editingRecibo.id ? updatedRecibo : r))
    )

    try {
      // Update in database
      const { error } = await supabase
        .from("user_transactions")
        .update(updates)
        .eq("id", editingRecibo.id)

      if (error) {
        console.error("Error updating expense:", error)
        // Revert on error
        setReceipts((prev) =>
          prev.map((r) => (r.id === editingRecibo.id ? editingRecibo : r))
        )
        setFilteredReceipts((prev) =>
          prev.map((r) => (r.id === editingRecibo.id ? editingRecibo : r))
        )
        throw error
      }
    } catch (error) {
      console.error("Failed to update expense:", error)
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingRecibo) return

    // Optimistic update - remove from local state immediately
    setReceipts((prev) => prev.filter((r) => r.id !== deletingRecibo.id))
    setFilteredReceipts((prev) => prev.filter((r) => r.id !== deletingRecibo.id))

    try {
      // Soft delete in database
      const { error } = await supabase
        .from("user_transactions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", deletingRecibo.id)

      if (error) {
        console.error("Error deleting expense:", error)
        // Revert on error - add back to state
        setReceipts((prev) => [...prev, deletingRecibo])
        setFilteredReceipts((prev) => [...prev, deletingRecibo])
        throw error
      }
    } catch (error) {
      console.error("Failed to delete expense:", error)
      throw error
    }
  }

  // Apply sorting to filtered receipts
  const sortedReceipts = [...filteredReceipts].sort((a, b) => {
    if (!sortBy) return 0

    let aValue: number
    let bValue: number

    switch (sortBy) {
      case "date": {
        aValue = parseDateString(a.transaction_date).getTime()
        bValue = parseDateString(b.transaction_date).getTime()
        break
      }
      case "impact": {
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthTotal = getMonthTotal(filteredReceipts, currentMonth, currentYear)
        aValue = calculateMonthPercentage(a, monthTotal)
        bValue = calculateMonthPercentage(b, monthTotal)
        break
      }
      case "frequency": {
        aValue = calculateFrequency(a, filteredReceipts)
        bValue = calculateFrequency(b, filteredReceipts)
        break
      }
      case "value": {
        aValue = a.amount
        bValue = b.amount
        break
      }
      default:
        return 0
    }

    return sortOrder === "asc" ? aValue - bValue : bValue - aValue
  })

  // Calculate stats from filtered receipts
  const totalSpent = filteredReceipts.reduce((sum, r) => sum + Number(r.amount), 0)
  const totalReceipts = filteredReceipts.length
  const avgSpent = totalReceipts > 0 ? totalSpent / totalReceipts : 0

  // Get current month receipts
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyReceipts = filteredReceipts.filter((r) => {
    const date = parseDateString(r.transaction_date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  const monthlySpent = monthlyReceipts.reduce((sum, r) => sum + Number(r.amount), 0)

  // Get unique descriptions for filters (was: establishment types)
  const establishmentTypes = getUniqueValues(receipts.map((r) => r.description))

  // Get current month total for percentage calculations
  const currentMonthTotal = getMonthTotal(filteredReceipts, currentMonth, currentYear)

  if (loading) {
    return (
      <DashboardShell breadcrumb={[{ label: t('title') }]}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell breadcrumb={[{ label: t('title') }]}>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold">{t('title')}</h2>
            <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title={t('stats.totalSpent')}
              value={formatCurrency(totalSpent)}
              description={t('stats.filteredResults')}
              icon={TrendingUp}
            />
            <StatsCard
              title={t('stats.thisMonth')}
              value={formatCurrency(monthlySpent)}
              description={`${monthlyReceipts.length} ${t('stats.transactions')}`}
              icon={Calendar}
            />
            <StatsCard
              title={t('stats.totalTransactions')}
              value={totalReceipts.toString()}
              description={t('stats.filteredResults')}
              icon={Receipt}
            />
            <StatsCard
              title={t('stats.avgTransaction')}
              value={formatCurrency(avgSpent)}
              description={t('stats.perTransaction')}
              icon={CreditCard}
            />
          </div>

          {/* Telegram Integration Info */}
          {!isLinked && (
            <Alert>
              <Link2 className="h-4 w-4" />
              <AlertTitle>{t('telegram.connectTitle')}</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-3">
                  {t('telegram.connectDescription')}
                </p>
                <Button onClick={() => setShowLinkDialog(true)} size="sm">
                  <Link2 className="mr-2 h-4 w-4" />
                  {t('telegram.linkAccount')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isLinked && receipts.length === 0 && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                {t('telegram.noExpenses')}
              </AlertDescription>
            </Alert>
          )}

          {/* Recent Expenses with Tabs */}
          <div className="space-y-4">
            {filteredReceipts.length > 0 ? (
              <Tabs defaultValue="cards" className="w-full">
                {/* Header with title, tabs, and filter button */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {t('recentExpenses')}{" "}
                    {filteredReceipts.length !== receipts.length && (
                      <span className="text-muted-foreground text-sm font-normal">
                        ({filteredReceipts.length} {tCommon('of')} {receipts.length})
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3">
                    <TabsList className="grid w-64 grid-cols-2">
                      <TabsTrigger value="cards">{tViewModes('cards')}</TabsTrigger>
                      <TabsTrigger value="timeline">{tViewModes('timeline')}</TabsTrigger>
                    </TabsList>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRefreshReceipts}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-full sm:max-w-md p-0">
                        <SheetHeader className="px-4 pt-6 pb-4 border-b">
                          <SheetTitle>{tCommon('filters')}</SheetTitle>
                        </SheetHeader>
                        <ExpenseFilters
                          onFilterChange={handleFilterChange}
                          establishmentTypes={establishmentTypes}
                        />
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                {/* Card container with rounded corners */}
                <Card className="rounded-2xl border-2 overflow-hidden">
                  <TabsContent value="cards" className="m-0">
                    <ScrollArea className="h-[600px]">
                      <ExpenseListHeader
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                      <div>
                        {sortedReceipts.map((recibo, index) => {
                          const monthPercentage = calculateMonthPercentage(recibo, currentMonthTotal)
                          const frequency = calculateFrequency(recibo, filteredReceipts)
                          const trend = calculateCategoryTrend(recibo, filteredReceipts)

                          return (
                            <ExpenseCardAdvanced
                              key={recibo.id}
                              recibo={recibo}
                              categories={recibo.categories || []}
                              monthPercentage={monthPercentage}
                              frequency={frequency}
                              trend={trend}
                              index={index}
                              onEdit={handleEditRecibo}
                              onDelete={handleDeleteRecibo}
                            />
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="timeline" className="m-0 p-6">
                    <ScrollArea className="h-[600px] pr-4">
                      <ExpensesTimeline receipts={sortedReceipts} />
                    </ScrollArea>
                  </TabsContent>
                </Card>
              </Tabs>
            ) : receipts.length > 0 ? (
              <>
                <h3 className="text-xl font-semibold">{t('recentExpenses')}</h3>
                <Card className="p-8 text-center rounded-2xl">
                  <InfoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('noTransactionsMatchFilters')}</p>
                </Card>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold">{t('recentExpenses')}</h3>
                <Card className="p-8 text-center rounded-2xl">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('noTransactionsToDisplay')}</p>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Telegram Link Dialog */}
      <TelegramLinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        onLinkSuccess={() => {
          // Reload receipts after successful link
          window.location.reload()
        }}
      />

      {/* Edit Expense Dialog */}
      {editingRecibo && (
        <EditExpenseDialog
          open={!!editingRecibo}
          onOpenChange={(open) => !open && setEditingRecibo(null)}
          recibo={editingRecibo}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Expense Dialog */}
      {deletingRecibo && (
        <DeleteExpenseDialog
          open={!!deletingRecibo}
          onOpenChange={(open) => !open && setDeletingRecibo(null)}
          recibo={deletingRecibo}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Tobby Floating Peek */}
      <TobbyPeek
        variant={variant}
        budgetPercentage={percentage}
        spent={spent}
        budget={budget}
      />
    </DashboardShell>
  )
}
