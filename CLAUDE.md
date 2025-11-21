# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tobby is a Next.js expense tracking application that integrates with a Telegram bot for automatic receipt processing. Users can send receipts via Telegram, which are processed and displayed in a web dashboard with analytics, filtering, and subscription features. The app features an interactive mascot (Tobby the dog) whose emotional states reflect the user's spending behavior.

**Tech Stack:**
- Next.js 15.2.4 with App Router
- React 19 + TypeScript
- Supabase for backend, authentication, and database
- Tailwind CSS with Radix UI components (shadcn/ui)
- next-intl for internationalization (English and Portuguese Brazilian)
- Recharts for data visualization
- Framer Motion for animations

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture

### Authentication & Authorization

- **Middleware:** `middleware.ts` handles auth checks using Supabase SSR. Protected routes (`/dashboard/*`) redirect unauthenticated users to `/login`. Authenticated users trying to access `/login` or `/signup` are redirected to `/dashboard`.
- **Supabase Clients:**
  - `lib/supabase/client.ts` - Singleton browser client for client components (`getSupabaseBrowserClient()`)
  - `lib/supabase/server.ts` - Server client for server components/actions (`getSupabaseServerClient()`)
- **Environment Variables:** Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`

### Internationalization (i18n)

- **Configuration:** `i18n.ts` configures locale detection with priority: cookie → browser language → default (pt-br)
- **Supported Locales:** `en` and `pt-br`
- **Translation Files:** `messages/en.json` and `messages/pt-br.json`
- **Usage:** Use `useTranslations()` hook in client components. Messages are provided via `NextIntlClientProvider` in root layout.
- **Font:** Uses Noto Sans font family loaded via next/font/google
- **Important:** Always add translations for both locales when adding new features

### Database Schema

The application uses Supabase with Row Level Security (RLS) enabled on all tables:

**Core Tables:**
- `user_transactions` - Main transactions table (replaces old `recibos_processados`)
  - Fields: user_id, chat_id, description, transaction_date, transaction_type (withdrawal/deposit), amount, original_json
  - Supports soft deletes via `deleted_at` timestamp
- `categories` - User-specific expense categories (name, color, icon)
- `transaction_categories` - Junction table for many-to-many relationship
- `telegram_users` - Links Supabase user_id to Telegram chat_id (one-to-one relationship)
- `user_link_tokens` - Temporary 6-character tokens for linking Telegram accounts (15-minute expiration)
- `user_subscriptions` - Manages user subscription plans (free/premium)
- `premium_features` - Defines available features per subscription tier
- `user_preferences` - Stores user settings like monthly_budget
- `recurring_transactions` - Manages recurring income/expenses with frequency rules

**Migration Scripts:** Located in `supabase/migrations/` directory. Execute via Supabase Dashboard SQL Editor:
1. `refactor_to_transactions.sql` - Core transaction system refactor
2. `add_soft_delete_to_recibos.sql` - Soft delete support
3. `create_recurring_transactions.sql` - Recurring transactions feature
4. Migration files in `scripts/` directory (older, numbered migrations)
5. `005_create_user_preferences.sql` - Budget tracking
6. `006_add_telegram_delete_policy.sql` - Telegram unlinking support

### Budget Tracking System (Critical Architecture)

The budget tracking system uses a **Context Provider pattern** to avoid performance issues:

**Key Components:**
- `contexts/budget-context.tsx` - **BudgetProvider** with 5-minute cache (CACHE_TTL)
  - Centralized budget state management
  - Single query on mount, cached for 5 minutes
  - Provides: `budgetStatus`, `loading`, `refreshBudget()`, `updateMonthlySpent()`
- `lib/budget-utils.ts` - Core utilities
  - `getUserBudget()` - Fetches monthly_budget from user_preferences
  - `setUserBudget()` - Upserts budget (used in Settings page)
  - `calculateBudgetStatus()` - Determines Tobby's emotional state based on spending
- `hooks/use-tobby-state.ts` - Hook that uses context (does NOT query DB directly)

**Tobby's Emotional States:**
- **happy** (< 80% of budget) - Green indicators
- **neutral** (80-100% of budget) - Yellow indicators
- **worried** (> 100% of budget) - Red indicators

**Performance Critical:**
- Never query `user_preferences` directly in components
- Always use `useBudget()` context hook
- Call `refreshBudget()` after updating budget to invalidate cache
- Use `updateMonthlySpent()` for real-time updates without DB queries

### Tobby Mascot System

Tobby is an interactive mascot that appears throughout the app with dynamic animations:

**Components:**
- `components/tobby-logo.tsx` - Main Tobby image component with animations
  - Breathing animation (subtle pulsation)
  - Hover wiggle effect
  - Click animations
  - Easter egg: 3 rapid clicks triggers shake + sparkle effect
  - Takes `variant` prop (happy/neutral/worried) to show emotional state
- `components/tobby-peek.tsx` - Floating Tobby that appears on scroll
  - Appears when scrollY > 200px
  - Shows budget tooltip on hover
  - No pulsing ring (removed for cleaner UX)
- `components/celebration-modal.tsx` - Full-screen celebration with confetti
  - Triggered after successful transaction save/edit
  - Uses react-confetti library

**Where Tobby Appears:**
- Sidebar header - Shows current budget state with progress bar
- Settings page - Preview of budget status
- Floating peek - Appears during dashboard scroll
- Celebration modal - After successful actions

### Telegram Integration Flow

1. User generates a link token via `lib/telegram-link.ts:generateLinkToken()` in the dashboard
2. Token is displayed in `TelegramLinkDialog` component
3. User sends token to Telegram bot
4. Bot validates token and creates `telegram_users` record linking user_id ↔ chat_id
5. Receipts sent to bot are associated with chat_id, which maps to user_id via `telegram_users` table
6. Dashboard queries `user_transactions` filtered by the user's chat_id

**Key Functions:**
- `generateLinkToken()` - Creates 15-minute expiring token
- `checkTelegramLinkStatus()` - Verifies if user has linked Telegram
- `getActiveToken()` - Retrieves current valid token
- `unlinkTelegramAccount()` - Deletes telegram_users record (requires migration 006)

### Settings Page Architecture (Component-Based)

Settings page (`/app/settings/page.tsx`) uses a modular component structure:

**Component Breakdown:**
- `components/settings/budget-settings-section.tsx` - Budget input and visual status
- `components/settings/account-section.tsx` - Email and member since date
- `components/settings/telegram-section.tsx` - Telegram connection status and link/unlink actions

**Layout Pattern:**
- Uses `DashboardShell` wrapper for consistency
- Grid layout: Budget (full width), then Account + Telegram (2 columns)
- Each section is self-contained with own state management

### App Structure

```
app/
├── page.tsx                # Landing page
├── layout.tsx              # Root layout with i18n, BudgetProvider, Toaster
├── login/page.tsx          # Login page
├── signup/page.tsx         # Sign up page
├── settings/page.tsx       # Settings with budget management
├── categories/page.tsx     # Category management
├── recurring-income/page.tsx # Recurring transactions
└── dashboard/
    ├── page.tsx            # Main dashboard with cards/timeline views
    └── premium/page.tsx    # Premium subscription features
```

### Key Components

**Dashboard Components:**
- `ExpenseCardAdvanced` - Transaction card with metrics (Impact, Frequency, Trend)
- `ExpenseListHeader` - Sortable column headers
- `ExpensesTimeline` - Chronological timeline view
- `ExpenseFilters` - Advanced filtering UI (date range, search, categories, payment method)
- `StatsCard` - Displays aggregate metrics

**Dialog Components:**
- `EditExpenseDialog` - Edit transaction details and categories
- `DeleteExpenseDialog` - Confirmation dialog with transaction preview
- `TelegramLinkDialog` - Token generation and status checking

**Layout Components:**
- `DashboardShell` - Wrapper with sidebar and breadcrumbs
- `AppSidebar` - Navigation with Tobby header and budget progress bar
- `Footer` - Footer with links and branding

### Utilities & Helpers

**Format Utilities (`lib/format-utils.ts`):**
- `formatCurrency()` - BRL currency formatting
- `formatDate()` - Localized date formatting
- `calculateMonthPercentage()` - Transaction % of monthly total
- `calculateFrequency()` - Count of similar transactions
- `calculateCategoryTrend()` - **% of total spent in transaction's categories** (NOT month-over-month comparison)
- `getMonthTotal()` - Sum of transactions for a given month/year

**Type Definitions (`lib/types.ts`):**
- `Transaction` (formerly `Recibo`) - Main transaction interface with categories array
- `Category` - Category with name, color, icon
- `TelegramUser` - Telegram linking data
- `UserPreferences` - User settings including monthly_budget

## Important Patterns

### 1. Data Fetching in Dashboard

Always fetch `telegram_users` first to get chat_id, then query `user_transactions` by chat_id. This ensures users only see their own transactions.

```typescript
// 1. Get telegram link
const { data: telegramUser } = await supabase
  .from('telegram_users')
  .select('chat_id')
  .eq('user_id', user.id)
  .single()

// 2. Fetch transactions by chat_id
const { data: transactions } = await supabase
  .from('user_transactions')
  .select('*, categories(*)')
  .eq('chat_id', telegramUser.chat_id)
  .is('deleted_at', null)
```

### 2. Category Relationships

Transactions have many-to-many relationships with categories via `transaction_categories` junction table. Always join with categories when fetching transactions:

```typescript
.select(`
  *,
  categories:transaction_categories(
    category:categories(*)
  )
`)
```

### 3. Supabase Client Selection

- Use `getSupabaseBrowserClient()` in client components with `"use client"` directive
- Use `getSupabaseServerClient()` in server components/actions
- Browser client is a singleton, don't put it in useEffect dependencies

### 4. RLS Pattern

All tables use RLS with policies that filter by `user_id = auth.uid()`. The `user_transactions` table filters by chat_id which is validated against the authenticated user's telegram_users record.

### 5. Transaction Metrics

The dashboard displays three metrics per transaction card:
- **Impact (%)** - `calculateMonthPercentage()` - What % of this month's total is this transaction
- **Frequency (Nx)** - `calculateFrequency()` - How many times similar transactions appear
- **Trend (%)** - `calculateCategoryTrend()` - What % of total spending is in these categories (NOT month-over-month comparison)

### 6. Filtering Pattern

Client-side filtering is applied on already-fetched transactions. Filters include: search term, categories, transaction_type, and date range. Sorting is also client-side.

### 7. Component Organization

Settings sections, dashboard cards, and major features are broken into separate components in `/components/` or `/components/settings/`. This improves maintainability and allows for isolated state management.

### 8. TypeScript Configuration

Build errors are ignored (`ignoreBuildErrors: true` in next.config.mjs) - be aware when making type changes. The codebase uses strict TypeScript but skips type checking during builds for faster iteration.

### 9. Animation Guidelines

- Use Framer Motion for all animations
- Tobby animations should feel playful and responsive
- Avoid distracting pulsing effects (removed from TobbyLogo and TobbyPeek)
- Keep animations subtle and performant

### 10. Translation Workflow

When adding new features:
1. Add English translations to `messages/en.json`
2. Add Portuguese translations to `messages/pt-br.json`
3. Use descriptive keys with nested structure (e.g., `settings.budget.title`)
4. Test both locales before committing
