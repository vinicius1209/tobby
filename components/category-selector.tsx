"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useCategories } from "@/contexts/categories-context"
import type { Category } from "@/lib/types"
import { CategoryBadge } from "@/components/category-badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategorySelectorProps {
  selectedCategories: Category[]
  onSelectionChange: (categories: Category[]) => void
  label?: string
  placeholder?: string
}

export function CategorySelector({
  selectedCategories,
  onSelectionChange,
  label,
  placeholder = "Selecionar categorias"
}: CategorySelectorProps) {
  const t = useTranslations('transactions.categories')

  // Use categories from context (cached, no query on every render)
  const { categories: allCategories, loading } = useCategories()

  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter categories by search term
  const filteredCategories = allCategories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleCategory = (category: Category) => {
    const isSelected = selectedCategories.some((c) => c.id === category.id)

    if (isSelected) {
      onSelectionChange(selectedCategories.filter((c) => c.id !== category.id))
    } else {
      onSelectionChange([...selectedCategories, category])
    }
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 py-2"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedCategories.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selectedCategories.map((category) => (
                  <CategoryBadge
                    key={category.id}
                    category={category}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCategory(category)
                    }}
                  />
                ))
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-[200px]">
            <div className="p-2">
              {loading ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Carregando...
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {searchTerm ? "Nenhuma categoria encontrada" : t('noCategories')}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCategories.map((category) => {
                    const isSelected = selectedCategories.some(
                      (c) => c.id === category.id
                    )

                    return (
                      <div
                        key={category.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent",
                          isSelected && "bg-accent"
                        )}
                        onClick={() => toggleCategory(category)}
                      >
                        <Checkbox checked={isSelected} />
                        <CategoryBadge category={category} size="sm" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {selectedCategories.length > 0 && (
            <div className="p-2 border-t flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {selectedCategories.length} selecionada(s)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
