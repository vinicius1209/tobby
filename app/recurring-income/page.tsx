"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus, RepeatIcon, Pause, Play, Trash2, Edit } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { RecurringTransaction, FrequencyType } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/format-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RecurringIncomeDialog } from "@/components/recurring-income-dialog"

export default function RecurringIncomePage() {
  const t = useTranslations('recurringIncome')
  const tFreq = useTranslations('recurringIncome.frequency')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<RecurringTransaction | null>(null)
  const [togglingTransaction, setTogglingTransaction] = useState<RecurringTransaction | null>(null)

  useEffect(() => {
    const fetchRecurringTransactions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching recurring transactions:", error)
      } else {
        setRecurringTransactions(data || [])
      }
      setLoading(false)
    }

    fetchRecurringTransactions()
  }, [router, supabase])

  const handleDelete = async () => {
    if (!deletingTransaction) return

    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", deletingTransaction.id)

    if (error) {
      console.error("Error deleting recurring transaction:", error)
      return
    }

    setRecurringTransactions(prev => prev.filter(t => t.id !== deletingTransaction.id))
    setDeletingTransaction(null)
  }

  const handleToggleActive = async () => {
    if (!togglingTransaction) return

    const { error } = await supabase
      .from("recurring_transactions")
      .update({ is_active: !togglingTransaction.is_active })
      .eq("id", togglingTransaction.id)

    if (error) {
      console.error("Error toggling recurring transaction:", error)
      return
    }

    setRecurringTransactions(prev =>
      prev.map(t =>
        t.id === togglingTransaction.id
          ? { ...t, is_active: !t.is_active }
          : t
      )
    )
    setTogglingTransaction(null)
  }

  const handleDialogSuccess = async () => {
    // Refresh the list of recurring transactions
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setRecurringTransactions(data)
    }

    // Reset editing state
    setEditingTransaction(null)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingTransaction(null)
    }
  }

  const getFrequencyLabel = (type: FrequencyType): string => {
    return tFreq(type)
  }

  const getFrequencyDescription = (recurring: RecurringTransaction): string => {
    const config = recurring.frequency_config as any

    const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

    switch (recurring.frequency_type) {
      case 'monthly':
        return `${tFreq('monthly')} - ${tCommon('day')} ${config.day}`
      case 'biweekly':
        return `${tFreq('biweekly')} - ${tCommon('days')} ${config.days.join(', ')}`
      case 'weekly':
        return `${tFreq('weekly')} - ${tCommon(`weekdays.${weekdayKeys[config.weekday]}`)}`
      case 'yearly':
        return `${tFreq('yearly')} - ${tCommon(`months.${monthKeys[config.month - 1]}`)} ${config.day}`
      default:
        return tFreq(recurring.frequency_type)
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell breadcrumb={[{ label: t('title') }]}>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('add')}
          </Button>
        </div>

        {recurringTransactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <RepeatIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('noIncome')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('noIncomeDescription')}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('add')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recurringTransactions.map((recurring) => (
              <Card key={recurring.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{recurring.description}</CardTitle>
                      <CardDescription>
                        {getFrequencyDescription(recurring)}
                      </CardDescription>
                    </div>
                    <Badge variant={recurring.is_active ? "default" : "secondary"}>
                      {recurring.is_active ? t('active') : t('inactive')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Amount */}
                    <div>
                      <p className={`text-2xl font-bold ${
                        recurring.transaction_type === 'deposit'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {recurring.transaction_type === 'deposit' ? '+' : '-'}
                        {formatCurrency(recurring.amount)}
                      </p>
                    </div>

                    {/* Last generated */}
                    {recurring.last_generated_date && (
                      <div className="text-sm text-muted-foreground">
                        {t('lastGenerated')}: {formatDate(recurring.last_generated_date)}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTransaction(recurring)
                          setDialogOpen(true)
                        }}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {tCommon('edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTogglingTransaction(recurring)}
                      >
                        {recurring.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingTransaction(recurring)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={(open) => !open && setDeletingTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Active Dialog */}
      <AlertDialog open={!!togglingTransaction} onOpenChange={(open) => !open && setTogglingTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {togglingTransaction?.is_active ? t('status.pauseTitle') : t('status.activateTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {togglingTransaction?.is_active ? t('status.pauseMessage') : t('status.activateMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('status.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive}>
              {togglingTransaction?.is_active ? t('status.pause') : t('status.activate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Dialog */}
      <RecurringIncomeDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        editingTransaction={editingTransaction}
        onSuccess={handleDialogSuccess}
      />
    </DashboardShell>
  )
}
