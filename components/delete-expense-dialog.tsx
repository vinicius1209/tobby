"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import type { Recibo } from "@/lib/types"
import { formatCurrency, formatDate, getDescription } from "@/lib/format-utils"
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
import { Loader2, Trash2 } from "lucide-react"

interface DeleteExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recibo: Recibo
  onConfirm: () => Promise<void>
}

export function DeleteExpenseDialog({
  open,
  onOpenChange,
  recibo,
  onConfirm,
}: DeleteExpenseDialogProps) {
  const t = useTranslations('transactions.deleteDialog')
  const tCommon = useTranslations('common')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting expense:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const description = getDescription(recibo, tCommon('notInformed'))
  const formattedDate = formatDate(recibo.transaction_date)
  const formattedAmount = formatCurrency(recibo.amount)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('message')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Transaction details */}
        <div className="space-y-2 py-4 border-y">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t('descriptionLabel')}
            </span>
            <span className="font-medium">{description}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t('dateLabel')}
            </span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t('amountLabel')}
            </span>
            <span className="font-semibold text-red-600">{formattedAmount}</span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('deleting')}
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('confirm')}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
