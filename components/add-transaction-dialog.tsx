"use client"

import { useState } from "react"
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
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTelegram } from "@/contexts/telegram-context"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionType: "withdrawal" | "deposit"
  onSuccess?: () => void
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  transactionType,
  onSuccess,
}: AddTransactionDialogProps) {
  const t = useTranslations("dashboard.addTransaction")
  const tCommon = useTranslations("common")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = useState(false)
  const supabase = getSupabaseBrowserClient()
  const { user } = useAuth()
  const { chatId } = useTelegram()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !amount || !user || !chatId) return

    setSaving(true)

    try {
      const { error } = await supabase.from("user_transactions").insert({
        chat_id: chatId,
        description,
        amount: parseFloat(amount),
        transaction_date: date,
        transaction_type: transactionType,
        original_json: {},
      })

      if (error) throw error

      // Reset form
      setDescription("")
      setAmount("")
      setDate(new Date().toISOString().split("T")[0])

      // Close dialog and trigger success callback
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error creating transaction:", error)
    } finally {
      setSaving(false)
    }
  }

  const isExpense = transactionType === "withdrawal"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isExpense ? t("addExpense") : t("addIncome")}
          </DialogTitle>
          <DialogDescription>
            {isExpense ? t("addExpenseDescription") : t("addIncomeDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Input
                id="description"
                placeholder={t("descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">{t("amount")}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">{t("date")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isExpense ? t("addExpense") : t("addIncome")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
