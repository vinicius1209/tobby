"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FrequencySelector } from "@/components/frequency-selector"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import type { RecurringTransaction, FrequencyType, FrequencyConfig } from "@/lib/types"

interface RecurringIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTransaction?: RecurringTransaction | null
  onSuccess: () => void
}

export function RecurringIncomeDialog({
  open,
  onOpenChange,
  editingTransaction,
  onSuccess,
}: RecurringIncomeDialogProps) {
  const t = useTranslations('recurringIncome.form')
  const tCommon = useTranslations('common')
  const tFilters = useTranslations('transactions.filters')
  const supabase = getSupabaseBrowserClient()

  // Form state
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [transactionType, setTransactionType] = useState<'withdrawal' | 'deposit'>('deposit')
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('monthly')
  const [frequencyConfig, setFrequencyConfig] = useState<FrequencyConfig>({ day: 1 })
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState<{
    description?: string
    amount?: string
    frequencyType?: string
    frequencyConfig?: string
  }>({})

  // Reset form when dialog opens/closes or editing transaction changes
  useEffect(() => {
    if (open) {
      if (editingTransaction) {
        // Populate form with existing transaction data
        setDescription(editingTransaction.description)
        setAmount(editingTransaction.amount.toString())
        setTransactionType(editingTransaction.transaction_type)
        setFrequencyType(editingTransaction.frequency_type)
        setFrequencyConfig(editingTransaction.frequency_config)
        setStartDate(new Date(editingTransaction.start_date))
        setEndDate(editingTransaction.end_date ? new Date(editingTransaction.end_date) : undefined)
      } else {
        // Reset to defaults for new transaction
        setDescription("")
        setAmount("")
        setTransactionType('deposit')
        setFrequencyType('monthly')
        setFrequencyConfig({ day: 1 })
        setStartDate(new Date())
        setEndDate(undefined)
      }
      setErrors({})
    }
  }, [open, editingTransaction])

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!description.trim()) {
      newErrors.description = t('required')
    }

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = t('invalidAmount')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      const transactionData = {
        user_id: user.id,
        description: description.trim(),
        amount: parseFloat(amount),
        transaction_type: transactionType,
        frequency_type: frequencyType,
        frequency_config: frequencyConfig,
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      }

      if (editingTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from("recurring_transactions")
          .update(transactionData)
          .eq("id", editingTransaction.id)

        if (error) throw error
      } else {
        // Insert new transaction
        const { error } = await supabase
          .from("recurring_transactions")
          .insert([transactionData])

        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving recurring transaction:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? t('edit') : t('add')}
          </DialogTitle>
          <DialogDescription>
            {editingTransaction
              ? 'Edite as informações da fonte de renda recorrente'
              : 'Adicione uma nova fonte de renda recorrente'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('amountPlaceholder')}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="transactionType">{t('type')}</Label>
            <Select
              value={transactionType}
              onValueChange={(value) => setTransactionType(value as 'withdrawal' | 'deposit')}
            >
              <SelectTrigger id="transactionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">{tFilters('deposit')}</SelectItem>
                <SelectItem value="withdrawal">{tFilters('withdrawal')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Frequency Configuration */}
          <FrequencySelector
            frequencyType={frequencyType}
            frequencyConfig={frequencyConfig}
            onFrequencyTypeChange={setFrequencyType}
            onFrequencyConfigChange={setFrequencyConfig}
            errors={{
              frequencyType: errors.frequencyType,
              frequencyConfig: errors.frequencyConfig,
            }}
          />

          {/* Start Date */}
          <div className="space-y-2">
            <Label>{t('startDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : <span>{tCommon('pickDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date (Optional) */}
          <div className="space-y-2">
            <Label>{t('endDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : <span>{t('endDatePlaceholder')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {endDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEndDate(undefined)}
                className="w-full"
              >
                Limpar data final
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
