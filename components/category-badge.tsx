"use client"

import { Badge } from "@/components/ui/badge"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"
import { LucideIcon } from "lucide-react"

interface CategoryBadgeProps {
  category: Category
  size?: "sm" | "md" | "lg"
  variant?: "solid" | "outline"
  onClick?: () => void
}

export function CategoryBadge({
  category,
  size = "md",
  variant = "solid",
  onClick
}: CategoryBadgeProps) {
  // Get the icon component dynamically
  const IconComponent = category.icon
    ? (Icons[category.icon as keyof typeof Icons] as LucideIcon)
    : Icons.Tag

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-1",
    md: "text-sm px-2 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }

  const backgroundColor = category.color || "#808080"

  // Calculate contrasting text color
  const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }

  const textColor = variant === 'solid' ? getContrastColor(backgroundColor) : backgroundColor

  return (
    <Badge
      className={cn(
        "inline-flex items-center font-medium cursor-pointer transition-all",
        sizeClasses[size],
        onClick && "hover:opacity-80"
      )}
      style={
        variant === 'solid'
          ? {
              backgroundColor,
              color: textColor,
              border: 'none'
            }
          : {
              backgroundColor: 'transparent',
              color: backgroundColor,
              borderColor: backgroundColor,
              borderWidth: '1.5px'
            }
      }
      onClick={onClick}
    >
      {IconComponent && <IconComponent className={iconSizes[size]} />}
      <span className="truncate max-w-[200px]">{category.name}</span>
    </Badge>
  )
}
