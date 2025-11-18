"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface AccountSectionProps {
  email: string
  memberSince: string
}

export function AccountSection({ email, memberSince }: AccountSectionProps) {
  const t = useTranslations("settings.account")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label className="text-muted-foreground">{t("email")}</Label>
          <p className="font-medium">{email}</p>
        </div>
        <div className="grid gap-2">
          <Label className="text-muted-foreground">{t("memberSince")}</Label>
          <p className="font-medium">{memberSince}</p>
        </div>
      </CardContent>
    </Card>
  )
}
