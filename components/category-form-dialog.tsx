"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { createCategory, updateCategory } from "@/lib/category-utils"
import type { Category } from "@/lib/types"
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
import { CategoryPicker } from "@/components/category-picker"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCategory?: Category | null
  onSuccess: () => void
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  editingCategory,
  onSuccess,
}: CategoryFormDialogProps) {
  const t = useTranslations('transactions.categories')
  const tCommon = useTranslations('common')
  const supabase = getSupabaseBrowserClient()

  // Form state
  const [name, setName] = useState("")
  const [color, setColor] = useState("#808080")
  const [icon, setIcon] = useState("Tag")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens/closes or editing category changes
  useEffect(() => {
    if (open) {
      if (editingCategory) {
        setName(editingCategory.name)
        setColor(editingCategory.color || "#808080")
        setIcon(editingCategory.icon || "Tag")
      } else {
        setName("")
        setColor("#808080")
        setIcon("Tag")
      }
      setError(null)
    }
  }, [open, editingCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError(t('namePlaceholder'))
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      if (editingCategory) {
        // Update existing category
        const success = await updateCategory(
          supabase,
          editingCategory.id,
          {
            name: name.trim(),
            color,
            icon,
          }
        )

        if (!success) {
          throw new Error("Failed to update category")
        }
      } else {
        // Create new category
        const newCategory = await createCategory(supabase, {
          user_id: user.id,
          name: name.trim(),
          color,
          icon,
        })

        if (!newCategory) {
          throw new Error("Failed to create category")
        }
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error("Error saving category:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? t('edit') : t('add')}
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? 'Edite as informações da categoria'
              : 'Crie uma nova categoria para organizar suas transações'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="categoryName">{t('name')}</Label>
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              autoFocus
            />
          </div>

          {/* Color & Icon Picker */}
          <CategoryPicker
            selectedColor={color}
            selectedIcon={icon}
            onColorChange={setColor}
            onIconChange={setIcon}
            colorLabel={t('color')}
            iconLabel={t('icon')}
          />

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editingCategory ? 'Salvando...' : 'Criando...') : tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
