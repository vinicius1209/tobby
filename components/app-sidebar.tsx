"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  Tag,
  RepeatIcon,
  TrendingUp,
  Crown,
  Settings,
  ChevronUp,
  User2,
  LogOut,
} from "lucide-react"
import { TobbyLogo } from "@/components/tobby-logo"
import { useBudget } from "@/contexts/budget-context"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

const menuItems = [
  {
    title: "dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "categories",
    url: "/categories",
    icon: Tag,
  },
  {
    title: "recurringIncome",
    url: "/recurring-income",
    icon: RepeatIcon,
  },
  {
    title: "analytics",
    url: "/analytics",
    icon: TrendingUp,
  },
  {
    title: "premium",
    url: "/premium",
    icon: Crown,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const t = useTranslations('navigation')
  const tBudget = useTranslations('tobby.budget')
  const { state } = useSidebar()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Get budget status from context (no DB queries)
  const { budgetStatus } = useBudget()
  const { variant, percentage, spent, budget } = budgetStatus

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="border-b border-border px-6 py-5">
        <Link href="/dashboard" className="flex flex-col gap-3">
          {/* Logo and Title Row */}
          <div className="flex items-center gap-3">
            <TobbyLogo
              size={state === "expanded" ? 48 : 40}
              variant={variant}
              animated={true}
            />
            {state === "expanded" && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Tobby</span>
                <span className="text-xs text-muted-foreground">
                  {t('tagline') || 'Financial Companion'}
                </span>
              </div>
            )}
          </div>

          {/* Budget Progress Bar - Full Width Below */}
          {state === "expanded" && budget > 0 && (
            <div className="w-full">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{tBudget('percentage')}</span>
                <span className={`font-semibold ${
                  percentage > 100 ? 'text-red-600' :
                  percentage > 80 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    percentage > 100 ? 'bg-red-500' :
                    percentage > 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('menu') || 'Menu'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={state === "collapsed" ? t(item.title) : undefined}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Group */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('settings') || 'Settings'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/settings'}
                  tooltip={state === "collapsed" ? t('settings') : undefined}
                >
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>{t('settings')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - User Menu */}
      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User2 className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  {state === "expanded" && (
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{t('user') || 'User'}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {t('account') || 'Manage account'}
                      </span>
                    </div>
                  )}
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                align="end"
                side="top"
                sideOffset={8}
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? t('loggingOut') || 'Signing out...' : t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
