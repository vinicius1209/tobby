"use client"

import { useTranslations } from "next-intl"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { FrequencyType, FrequencyConfig } from "@/lib/types"

interface FrequencySelectorProps {
  frequencyType: FrequencyType
  frequencyConfig: FrequencyConfig
  onFrequencyTypeChange: (type: FrequencyType) => void
  onFrequencyConfigChange: (config: FrequencyConfig) => void
  errors?: {
    frequencyType?: string
    frequencyConfig?: string
  }
}

export function FrequencySelector({
  frequencyType,
  frequencyConfig,
  onFrequencyTypeChange,
  onFrequencyConfigChange,
  errors,
}: FrequencySelectorProps) {
  const t = useTranslations('recurringIncome.form')
  const tFreq = useTranslations('recurringIncome.frequency')
  const tCommon = useTranslations('common')

  const WEEKDAYS = [
    { value: 0, key: 'sunday' },
    { value: 1, key: 'monday' },
    { value: 2, key: 'tuesday' },
    { value: 3, key: 'wednesday' },
    { value: 4, key: 'thursday' },
    { value: 5, key: 'friday' },
    { value: 6, key: 'saturday' },
  ]

  const MONTHS = [
    { value: 1, key: 'january' },
    { value: 2, key: 'february' },
    { value: 3, key: 'march' },
    { value: 4, key: 'april' },
    { value: 5, key: 'may' },
    { value: 6, key: 'june' },
    { value: 7, key: 'july' },
    { value: 8, key: 'august' },
    { value: 9, key: 'september' },
    { value: 10, key: 'october' },
    { value: 11, key: 'november' },
    { value: 12, key: 'december' },
  ]

  const handleTypeChange = (type: FrequencyType) => {
    onFrequencyTypeChange(type)

    // Set default config based on type
    switch (type) {
      case 'monthly':
        onFrequencyConfigChange({ day: 1 })
        break
      case 'biweekly':
        onFrequencyConfigChange({ days: [1, 15] })
        break
      case 'weekly':
        onFrequencyConfigChange({ weekday: 1 })
        break
      case 'yearly':
        onFrequencyConfigChange({ month: 1, day: 1 })
        break
    }
  }

  const updateConfig = (updates: Partial<FrequencyConfig>) => {
    onFrequencyConfigChange({ ...frequencyConfig, ...updates } as FrequencyConfig)
  }

  return (
    <div className="space-y-4">
      {/* Frequency Type */}
      <div className="space-y-2">
        <Label htmlFor="frequencyType">{t('frequencyType')}</Label>
        <Select value={frequencyType} onValueChange={handleTypeChange}>
          <SelectTrigger id="frequencyType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">{tFreq('monthly')}</SelectItem>
            <SelectItem value="biweekly">{tFreq('biweekly')}</SelectItem>
            <SelectItem value="weekly">{tFreq('weekly')}</SelectItem>
            <SelectItem value="yearly">{tFreq('yearly')}</SelectItem>
          </SelectContent>
        </Select>
        {errors?.frequencyType && (
          <p className="text-sm text-red-500">{errors.frequencyType}</p>
        )}
      </div>

      {/* Frequency-specific configs */}
      {frequencyType === 'monthly' && (
        <div className="space-y-2">
          <Label htmlFor="dayOfMonth">{t('dayOfMonth')}</Label>
          <Input
            id="dayOfMonth"
            type="number"
            min="1"
            max="31"
            value={(frequencyConfig as { day: number }).day || 1}
            onChange={(e) => updateConfig({ day: parseInt(e.target.value) })}
            placeholder={t('dayOfMonthPlaceholder')}
          />
        </div>
      )}

      {frequencyType === 'biweekly' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstDay">{t('dayOfMonthFirst')}</Label>
            <Input
              id="firstDay"
              type="number"
              min="1"
              max="31"
              value={(frequencyConfig as { days: number[] }).days?.[0] || 1}
              onChange={(e) => {
                const days = (frequencyConfig as { days: number[] }).days || [1, 15]
                updateConfig({ days: [parseInt(e.target.value), days[1]] })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondDay">{t('dayOfMonthSecond')}</Label>
            <Input
              id="secondDay"
              type="number"
              min="1"
              max="31"
              value={(frequencyConfig as { days: number[] }).days?.[1] || 15}
              onChange={(e) => {
                const days = (frequencyConfig as { days: number[] }).days || [1, 15]
                updateConfig({ days: [days[0], parseInt(e.target.value)] })
              }}
            />
          </div>
        </div>
      )}

      {frequencyType === 'weekly' && (
        <div className="space-y-2">
          <Label htmlFor="weekday">{t('dayOfWeek')}</Label>
          <Select
            value={String((frequencyConfig as { weekday: number }).weekday ?? 1)}
            onValueChange={(value) => updateConfig({ weekday: parseInt(value) })}
          >
            <SelectTrigger id="weekday">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((day) => (
                <SelectItem key={day.value} value={String(day.value)}>
                  {tCommon(`weekdays.${day.key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {frequencyType === 'yearly' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="month">{t('month')}</Label>
            <Select
              value={String((frequencyConfig as { month: number; day: number }).month || 1)}
              onValueChange={(value) => updateConfig({ month: parseInt(value) })}
            >
              <SelectTrigger id="month">
                <SelectValue placeholder={t('monthPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={String(month.value)}>
                    {tCommon(`months.${month.key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearlyDay">{t('dayOfMonth')}</Label>
            <Input
              id="yearlyDay"
              type="number"
              min="1"
              max="31"
              value={(frequencyConfig as { month: number; day: number }).day || 1}
              onChange={(e) => updateConfig({ day: parseInt(e.target.value) })}
              placeholder={t('dayOfMonthPlaceholder')}
            />
          </div>
        </div>
      )}

      {errors?.frequencyConfig && (
        <p className="text-sm text-red-500">{errors.frequencyConfig}</p>
      )}
    </div>
  )
}
