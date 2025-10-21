"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Copy, Loader2, RefreshCw } from "lucide-react"
import { generateLinkToken, checkTelegramLinkStatus } from "@/lib/telegram-link"

interface TelegramLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLinkSuccess?: () => void
}

export function TelegramLinkDialog({ open, onOpenChange, onLinkSuccess }: TelegramLinkDialogProps) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linked, setLinked] = useState(false)

  // Generate token when dialog opens
  useEffect(() => {
    if (open && !token) {
      handleGenerateToken()
    }
  }, [open])

  const handleGenerateToken = async () => {
    setLoading(true)
    setError(null)

    const { token: newToken, error: tokenError } = await generateLinkToken()

    if (tokenError || !newToken) {
      setError(tokenError || "Failed to generate token")
    } else {
      setToken(newToken)
    }

    setLoading(false)
  }

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCheckStatus = async () => {
    setChecking(true)
    setError(null)

    const { linked: isLinked, error: checkError } = await checkTelegramLinkStatus()

    if (checkError) {
      setError(checkError)
    } else if (isLinked) {
      setLinked(true)
      // Wait a bit to show success message
      setTimeout(() => {
        onOpenChange(false)
        onLinkSuccess?.()
      }, 1500)
    } else {
      setError("Not linked yet. Please send the token to the Telegram bot.")
    }

    setChecking(false)
  }

  const handleClose = () => {
    setToken(null)
    setError(null)
    setLinked(false)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Telegram Account</DialogTitle>
          <DialogDescription>
            Connect your Telegram account to automatically track your expenses from receipt photos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && !linked && token && (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Your link token (expires in 15 minutes):</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border bg-muted px-4 py-3 font-mono text-2xl font-bold tracking-wider">
                    {token}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyToken}
                    className="shrink-0"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Copy the token above</li>
                    <li>Open your Telegram bot</li>
                    <li>Send the command: <code className="font-mono bg-muted px-1 py-0.5 rounded">/link TOKEN</code></li>
                    <li>Click "Check Link Status" below</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={handleCheckStatus} disabled={checking} className="flex-1">
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Link Status
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {linked && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully linked! Your Telegram account is now connected.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
