"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { formatDateForDB } from "@/lib/format-utils"
import { X, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface ExpenseFiltersProps {
  onFilterChange: (filters: FilterState) => void
  establishmentTypes: string[]
}

export interface FilterState {
  searchTerm: string
  establishmentType: string
  dateFrom: string
  dateTo: string
}

type QuickDateFilter = "thisWeek" | "thisMonth" | "lastMonth" | "last7Days" | "last30Days"

export function ExpenseFilters({ onFilterChange, establishmentTypes }: ExpenseFiltersProps) {
  const t = useTranslations('transactions.filters')
  const tCommon = useTranslations('common')

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    establishmentType: "all",
    dateFrom: "",
    dateTo: "",
  })
  const [dateFromObj, setDateFromObj] = useState<Date | undefined>()
  const [dateToObj, setDateToObj] = useState<Date | undefined>()
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickDateFilter | null>(null)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFromObj(date)
    const dateString = date ? formatDateForDB(date) : ""
    handleFilterChange("dateFrom", dateString)
    setActiveQuickFilter(null)
  }

  const handleDateToChange = (date: Date | undefined) => {
    setDateToObj(date)
    const dateString = date ? formatDateForDB(date) : ""
    handleFilterChange("dateTo", dateString)
    setActiveQuickFilter(null)
  }

  const applyQuickDateFilter = (filterType: QuickDateFilter) => {
    const today = new Date()
    let startDate: Date
    let endDate = new Date(today)

    switch (filterType) {
      case "thisWeek": {
        const dayOfWeek = today.getDay()
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        startDate = new Date(today)
        startDate.setDate(today.getDate() - diff)
        break
      }
      case "thisMonth": {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      }
      case "lastMonth": {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      }
      case "last7Days": {
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        break
      }
      case "last30Days": {
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 30)
        break
      }
      default:
        return
    }

    setDateFromObj(startDate)
    setDateToObj(endDate)
    setActiveQuickFilter(filterType)

    const newFilters = {
      ...filters,
      dateFrom: formatDateForDB(startDate),
      dateTo: formatDateForDB(endDate),
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      searchTerm: "",
      establishmentType: "all",
      dateFrom: "",
      dateTo: "",
    }
    setFilters(clearedFilters)
    setDateFromObj(undefined)
    setDateToObj(undefined)
    setActiveQuickFilter(null)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters =
    filters.searchTerm ||
    filters.establishmentType !== "all" ||
    filters.dateFrom ||
    filters.dateTo

  const quickFilters: { type: QuickDateFilter; label: string }[] = [
    { type: "thisWeek", label: t('quickFilters.thisWeek') },
    { type: "thisMonth", label: t('quickFilters.thisMonth') },
    { type: "lastMonth", label: t('quickFilters.lastMonth') },
    { type: "last7Days", label: t('quickFilters.last7Days') },
    { type: "last30Days", label: t('quickFilters.last30Days') },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header com botão de limpar */}
      {hasActiveFilters && (
        <div className="px-4 pb-4 border-b">
          <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
            <X className="h-4 w-4 mr-2" />
            {t('clearFilters')}
          </Button>
        </div>
      )}

      {/* Content with scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">{tCommon('search')}</Label>
          <Input
            id="search"
            placeholder={t('searchPlaceholder')}
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
          />
        </div>

        {/* Quick Date Filters */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {t('quickFiltersLabel')}
          </Label>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <Button
                key={filter.type}
                variant={activeQuickFilter === filter.type ? "default" : "outline"}
                size="sm"
                onClick={() => applyQuickDateFilter(filter.type)}
                className={cn(
                  "text-xs",
                  activeQuickFilter === filter.type && "shadow-sm"
                )}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Description Filter */}
        <div className="space-y-2">
          <Label htmlFor="type">{t('description')}</Label>
          <Select
            value={filters.establishmentType}
            onValueChange={(v) => handleFilterChange("establishmentType", v)}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder={t('allDescriptions')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allDescriptions')}</SelectItem>
              {establishmentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('dateFrom.label')}</Label>
            <DatePicker
              date={dateFromObj}
              onDateChange={handleDateFromChange}
              placeholder={t('dateFrom.placeholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('dateTo.label')}</Label>
            <DatePicker
              date={dateToObj}
              onDateChange={handleDateToChange}
              placeholder={t('dateTo.placeholder')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
