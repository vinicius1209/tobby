"use client"

import { UserNav } from "@/components/user-nav"
import { Crown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="text-3xl">🐕</div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold leading-none">Tobby</h1>
            <span className="text-xs text-muted-foreground hidden sm:block">Your Financial Companion</span>
          </div>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href="/dashboard/premium">
              <Crown className="mr-2 h-4 w-4 text-amber-500" />
              Upgrade
            </Link>
          </Button>
          <UserNav />
        </div>
      </div>
    </header>
  )
}
