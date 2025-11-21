"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Plus, Edit, Trash2, Tag } from "lucide-react"
import * as Icons from "lucide-react"
import { LucideIcon } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { deleteCategory } from "@/lib/category-utils"
import { useCategories } from "@/contexts/categories-context"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryFormDialog } from "@/components/category-form-dialog"
import type { Category } from "@/lib/types"
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

export default function TransactionsPage() {
  const t = useTranslations('transactions.categories')
  const tCommon = useTranslations('common')
  const supabase = getSupabaseBrowserClient()

  // Use categories from context (cached, no query on mount)
  const { categories, loading, removeCategory, refreshCategories } = useCategories()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const handleDelete = async () => {
    if (!deletingCategory) return

    const success = await deleteCategory(supabase, deletingCategory.id)

    if (success) {
      // Optimistic update via context
      removeCategory(deletingCategory.id)
    } else {
      console.error("Failed to delete category")
    }

    setDeletingCategory(null)
  }

  const handleDialogSuccess = async () => {
    // Refresh categories list from database
    await refreshCategories()

    // Reset editing state
    setEditingCategory(null)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingCategory(null)
    }
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('manage')}</h2>
            <p className="text-muted-foreground">
              Organize suas transações criando categorias personalizadas
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('add')}
          </Button>
        </div>

        {categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('noCategories')}</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                {t('createFirst')}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('add')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => {
              // Get icon component dynamically
              const IconComponent = category.icon
                ? (Icons[category.icon as keyof typeof Icons] as LucideIcon)
                : Tag

              return (
                <Card key={category.id} className="overflow-hidden hover:shadow-md transition-all">
                  {/* Barra colorida no topo */}
                  <div
                    className="h-2"
                    style={{ backgroundColor: category.color || '#808080' }}
                  />

                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {IconComponent && (
                        <IconComponent
                          className="h-5 w-5"
                          style={{ color: category.color || '#808080' }}
                        />
                      )}
                      <span className="font-semibold">{category.name}</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Categoria personalizada
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category)
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
                        onClick={() => setDeletingCategory(category)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        editingCategory={editingCategory}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
              <br />
              {t('deleteMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  )
}
