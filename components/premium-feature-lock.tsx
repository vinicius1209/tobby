import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import Link from "next/link"
import { PremiumBadge } from "./premium-badge"

interface PremiumFeatureLockProps {
  featureName: string
  description: string
}

export function PremiumFeatureLock({ featureName, description }: PremiumFeatureLockProps) {
  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            {featureName}
          </CardTitle>
          <PremiumBadge />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/dashboard/premium">Upgrade to Premium</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
