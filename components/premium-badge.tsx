import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"

export function PremiumBadge() {
  return (
    <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
      <Crown className="h-3 w-3 mr-1" />
      Premium
    </Badge>
  )
}
