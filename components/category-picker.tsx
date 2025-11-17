"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CATEGORY_COLOR_PRESETS, CATEGORY_ICON_PRESETS } from "@/lib/category-utils"
import * as Icons from "lucide-react"
import { LucideIcon, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CategoryPickerProps {
  selectedColor?: string
  selectedIcon?: string
  onColorChange: (color: string) => void
  onIconChange: (icon: string) => void
  colorLabel?: string
  iconLabel?: string
}

export function CategoryPicker({
  selectedColor = "#808080",
  selectedIcon = "Tag",
  onColorChange,
  onIconChange,
  colorLabel = "Cor",
  iconLabel = "Ícone"
}: CategoryPickerProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="color" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="color">{colorLabel}</TabsTrigger>
          <TabsTrigger value="icon">{iconLabel}</TabsTrigger>
        </TabsList>

        {/* Color Picker Tab */}
        <TabsContent value="color" className="space-y-3">
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onColorChange(preset.value)}
                className={cn(
                  "h-10 w-10 rounded-md border-2 transition-all hover:scale-110 relative",
                  selectedColor === preset.value
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-gray-300 hover:border-gray-400"
                )}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
              >
                {selectedColor === preset.value && (
                  <Check className="h-5 w-5 text-white absolute inset-0 m-auto drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Cor selecionada: <span className="font-semibold">{CATEGORY_COLOR_PRESETS.find(p => p.value === selectedColor)?.name || "Personalizada"}</span>
          </div>
        </TabsContent>

        {/* Icon Picker Tab */}
        <TabsContent value="icon" className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {CATEGORY_ICON_PRESETS.map((iconName) => {
              const IconComponent = Icons[iconName as keyof typeof Icons] as LucideIcon

              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => onIconChange(iconName)}
                  className={cn(
                    "h-12 w-12 rounded-md border-2 transition-all hover:scale-110 flex items-center justify-center",
                    selectedIcon === iconName
                      ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  )}
                  title={iconName}
                >
                  {IconComponent && <IconComponent className="h-6 w-6" />}
                </button>
              )
            })}
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Ícone selecionado: <span className="font-semibold">{selectedIcon}</span>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <div className="border-t pt-4">
        <Label className="text-sm mb-2 block">Preview</Label>
        <div
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-medium"
          style={{
            backgroundColor: selectedColor,
            color: getContrastColor(selectedColor)
          }}
        >
          {(() => {
            const IconComponent = Icons[selectedIcon as keyof typeof Icons] as LucideIcon
            return IconComponent && <IconComponent className="h-4 w-4" />
          })()}
          <span>Exemplo de Categoria</span>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate contrasting text color
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
