"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/hooks/use-toast"
import { checkTelegramLinkStatus, unlinkTelegramAccount } from "@/lib/telegram-link"
import { TelegramLinkDialog } from "@/components/telegram-link-dialog"
import type { TelegramUser } from "@/lib/types"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export function TelegramSection() {
  const t = useTranslations("settings.telegram")
  const { toast } = useToast()

  const [isLinked, setIsLinked] = useState(false)
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  // Check Telegram link status on mount
  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const { linked, telegramUser: user } = await checkTelegramLinkStatus()
      setIsLinked(linked)
      setTelegramUser(user)
    } catch (error) {
      console.error("Error checking Telegram status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlink = async () => {
    setIsUnlinking(true)
    try {
      const { success, error } = await unlinkTelegramAccount()

      if (success) {
        setIsLinked(false)
        setTelegramUser(null)
        setShowUnlinkDialog(false)

        toast({
          title: t("unlinkSuccess"),
          description: t("status"),
        })
      } else {
        throw new Error(error || "Failed to unlink")
      }
    } catch (error) {
      console.error("Error unlinking Telegram:", error)
      toast({
        title: t("unlinkError"),
        variant: "destructive",
      })
    } finally {
      setIsUnlinking(false)
    }
  }

  const handleLinkSuccess = () => {
    // Refresh status after successful link
    checkStatus()
    setShowLinkDialog(false)
  }

  const getDisplayName = () => {
    if (!telegramUser) return ""
    if (telegramUser.username) return `@${telegramUser.username}`
    return [telegramUser.first_name, telegramUser.last_name]
      .filter(Boolean)
      .join(" ") || "Telegram User"
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Status Display */}
              <div className="grid gap-2">
                <Label className="text-muted-foreground">{t("status")}</Label>
                <div className="flex items-center gap-2">
                  {isLinked ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <Badge variant="default" className="bg-green-600">
                        {t("connected")}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <Badge variant="secondary">{t("notConnected")}</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Account Info (if linked) */}
              {isLinked && telegramUser && (
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">{t("account")}</Label>
                  <p className="font-medium">{getDisplayName()}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {isLinked ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowUnlinkDialog(true)}
                    disabled={isUnlinking}
                  >
                    {isUnlinking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("unlinkButton")}
                      </>
                    ) : (
                      t("unlinkButton")
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => setShowLinkDialog(true)}>
                    {t("linkAccount")}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unlinkButton")}</AlertDialogTitle>
            <AlertDialogDescription>{t("unlinkConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlinking}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlink}
              disabled={isUnlinking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnlinking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("unlinkButton")}
                </>
              ) : (
                t("unlinkButton")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link Dialog */}
      <TelegramLinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        onLinkSuccess={handleLinkSuccess}
      />
    </>
  )
}
