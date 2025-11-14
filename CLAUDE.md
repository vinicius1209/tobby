# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tobby is a Next.js expense tracking application that integrates with a Telegram bot for automatic receipt processing. Users can send receipts via Telegram, which are processed and displayed in a web dashboard with analytics, filtering, and subscription features.

**Tech Stack:**
- Next.js 15.2.4 with App Router
- React 19 + TypeScript
- Supabase for backend, authentication, and database
- Tailwind CSS with Radix UI components
- next-intl for internationalization (English and Portuguese Brazilian)
- Recharts for data visualization

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
  - `lib/supabase/client.ts` - Singleton browser client for client components
  - `lib/supabase/server.ts` - Server client for server components/actions
- **Environment Variables:** Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`

### Internationalization (i18n)

- **Configuration:** `i18n.ts` configures locale detection with priority: cookie → browser language → default (pt-br)
- **Supported Locales:** `en` and `pt-br`
- **Translation Files:** `messages/en.json` and `messages/pt-br.json`
- **Usage:** Use `useTranslations()` hook in client components. Messages are provided via `NextIntlClientProvider` in root layout.
- **Font:** Uses Noto Sans font family loaded via next/font/google

### Database Schema

The application uses Supabase with Row Level Security (RLS) enabled on all tables:

**Core Tables:**
- `recibos_processados` - Stores processed receipts with fields: user_id, chat_id, tipo_estabelecimento, nome_estabelecimento, data_compra, valor_total, metodo_pagamento, itens_comprados, json_original
- `telegram_users` - Links Supabase user_id to Telegram chat_id (one-to-one relationship)
- `user_link_tokens` - Temporary 6-character tokens for linking Telegram accounts (15-minute expiration)
- `user_subscriptions` - Manages user subscription plans (free/premium)
- `premium_features` - Defines available features per subscription tier

**Database Views:**
- `monthly_spending_summary` - Aggregates spending by month and chat_id
- `spending_by_type` - Aggregates spending by establishment type

**Migration Scripts:** Located in `scripts/` directory. Execute in order via Supabase Dashboard SQL Editor:
1. `001_create_recibos_table.sql` - Creates indexes, RLS policies, and views
2. `002_create_subscriptions_table.sql` - Creates subscription tables and trigger
3. `003_create_telegram_users_table.sql` - Creates Telegram user linking table
4. `004_create_user_link_tokens_table.sql` - Creates token system for account linking

### Telegram Integration Flow

1. User generates a link token via `lib/telegram-link.ts:generateLinkToken()` in the dashboard
2. Token is displayed in `TelegramLinkDialog` component
3. User sends token to Telegram bot
4. Bot validates token and creates `telegram_users` record linking user_id ↔ chat_id
5. Receipts sent to bot are associated with chat_id, which maps to user_id via `telegram_users` table
6. Dashboard queries `recibos_processados` filtered by the user's chat_id

**Key Functions:**
- `generateLinkToken()` - Creates 15-minute expiring token
- `checkTelegramLinkStatus()` - Verifies if user has linked Telegram
- `getActiveToken()` - Retrieves current valid token

### App Structure

```
app/
├── page.tsx              # Landing page
├── layout.tsx            # Root layout with i18n provider
├── login/page.tsx        # Login page
├── signup/page.tsx       # Sign up page
└── dashboard/
    ├── page.tsx          # Main dashboard with expense cards, stats, and filters
    ├── analytics/page.tsx # Charts and spending analysis
    └── premium/page.tsx   # Premium subscription features
```

### Key Components

- `DashboardHeader` - Navigation header with user menu and language switcher
- `ExpenseCard` - Displays individual receipt with expandable items timeline
- `ExpenseFilters` - Advanced filtering by date range, establishment type, payment method, and search
- `StatsCard` - Displays metrics (total spent, monthly spending, avg expense, receipt count)
- `TelegramLinkDialog` - Modal for generating and displaying link tokens
- `Footer` - Footer with links and branding
- `LanguageSwitcher` - Toggle between en/pt-br, stores preference in cookie

### Utilities

- `lib/format-utils.ts` - Currency formatting, date formatting, unique value extraction
- `lib/subscription.ts` - Subscription tier checking and premium feature access
- `lib/types.ts` - TypeScript interfaces for Recibo, TelegramUser, UserLinkToken, etc.

## Important Patterns

1. **Data Fetching in Dashboard:** Always fetch `telegram_users` first to get chat_id, then query `recibos_processados` by chat_id. This ensures users only see their own receipts.

2. **Filtering:** Client-side filtering is applied on already-fetched receipts. Filters include: search term, establishment type, payment method, and date range.

3. **Supabase Client Selection:** Use browser client (`getSupabaseBrowserClient()`) in client components with `"use client"` directive. Use server client (`getSupabaseServerClient()`) in server components/actions.

4. **RLS Pattern:** All tables use RLS with policies that filter by `user_id = auth.uid()`. The `recibos_processados` table filters by chat_id which is validated against the authenticated user's telegram_users record.

5. **TypeScript Configuration:** Build errors are ignored (`ignoreBuildErrors: true` in next.config.mjs) - be aware when making type changes.
