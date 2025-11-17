"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import type { Recibo, Category } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getTransactionCategories, assignCategories } from "@/lib/category-utils"
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
import { DatePicker } from "@/components/date-picker"
import { CategorySelector } from "@/components/category-selector"
import { Loader2 } from "lucide-react"

interface EditExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recibo: Recibo
  onSave: (updates: Partial<Recibo>, categories: Category[]) => Promise<void>
}

export function EditExpenseDialog({
  open,
  onOpenChange,
  recibo,
  onSave,
}: EditExpenseDialogProps) {
  const t = useTranslations('transactions.editDialog')
  const tCat = useTranslations('transactions.categories')
  const supabase = getSupabaseBrowserClient()
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [description, setDescription] = useState(recibo.description || "")
  const [date, setDate] = useState<Date | undefined>(
    recibo.transaction_date ? new Date(recibo.transaction_date) : undefined
  )
  const [amount, setAmount] = useState(recibo.amount.toString())
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])

  // Reset form when dialog opens with new recibo
  useEffect(() => {
    if (open) {
      setDescription(recibo.description || "")
      setDate(recibo.transaction_date ? new Date(recibo.transaction_date) : undefined)
      setAmount(recibo.amount.toString())
      setErrors({})

      // Load categories for this transaction
      const loadCategories = async () => {
        const categories = await getTransactionCategories(supabase, recibo.id)
        setSelectedCategories(categories)
      }

      loadCategories()
    }
  }, [open, recibo, supabase])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!description.trim()) {
      newErrors.description = t('required')
    }

    if (!date) {
      newErrors.date = t('required')
    }

    const numValue = parseFloat(amount)
    if (!amount || isNaN(numValue) || numValue <= 0) {
      newErrors.amount = t('invalidValue')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      const updates: Partial<Recibo> = {
        description: description.trim(),
        transaction_date: date!.toISOString().split('T')[0],
        amount: parseFloat(amount),
      }

      // Save categories first
      const categoryIds = selectedCategories.map(c => c.id)
      await assignCategories(supabase, recibo.id, categoryIds)

      // Then call onSave with updates AND categories
      await onSave(updates, selectedCategories)

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving expense:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Allow only numbers and one decimal point
    if (input === "" || /^\d*\.?\d*$/.test(input)) {
      setAmount(input)
      // Clear error when user starts typing
      if (errors.amount) {
        setErrors({ ...errors, amount: "" })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription className="sr-only">
            Edit transaction details including establishment, date, and value
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t('description')}
            </Label>
            <Input
              id="description"
              placeholder={t('descriptionPlaceholder')}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) {
                  setErrors({ ...errors, description: "" })
                }
              }}
              disabled={isSaving}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>{t('transactionDate')}</Label>
            <DatePicker
              date={date}
              onDateChange={(newDate) => {
                setDate(newDate)
                if (errors.date) {
                  setErrors({ ...errors, date: "" })
                }
              }}
              disabled={isSaving}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {t('amount')}
            </Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder={t('amountPlaceholder')}
              value={amount}
              onChange={handleAmountChange}
              disabled={isSaving}
              className={errors.amount ? "border-red-500" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <CategorySelector
              selectedCategories={selectedCategories}
              onSelectionChange={setSelectedCategories}
              label={tCat('select')}
              placeholder={tCat('select')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
