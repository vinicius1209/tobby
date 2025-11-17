// Supabase Edge Function: Generate Recurring Transactions
// Runs daily via cron job to create transactions from recurring rules

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecurringTransaction {
  id: string
  user_id: string
  description: string
  amount: number
  transaction_type: 'withdrawal' | 'deposit'
  frequency_type: 'monthly' | 'biweekly' | 'weekly' | 'yearly'
  frequency_config: any
  start_date: string
  end_date?: string | null
  last_generated_date?: string | null
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of day

    console.log(`[${new Date().toISOString()}] Starting transaction generation for ${today.toISOString().split('T')[0]}`)

    // Fetch all active recurring transactions
    const { data: recurringTransactions, error: fetchError } = await supabaseClient
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${today.toISOString().split('T')[0]}`)
      .lte('start_date', today.toISOString().split('T')[0])

    if (fetchError) {
      console.error('Error fetching recurring transactions:', fetchError)
      throw fetchError
    }

    console.log(`Found ${recurringTransactions?.length || 0} active recurring transactions`)

    let generatedCount = 0
    let skippedCount = 0

    // Process each recurring transaction
    for (const recurring of recurringTransactions || []) {
      try {
        if (shouldGenerateToday(recurring, today)) {
          // Check if already generated for today
          const { data: existingLog } = await supabaseClient
            .from('transaction_generation_log')
            .select('id')
            .eq('recurring_transaction_id', recurring.id)
            .eq('generated_for_date', today.toISOString().split('T')[0])
            .single()

          if (existingLog) {
            console.log(`Already generated for recurring_id: ${recurring.id}`)
            skippedCount++
            continue
          }

          // Generate the transaction
          const { data: newTransaction, error: insertError } = await supabaseClient
            .from('user_transactions')
            .insert({
              user_id: recurring.user_id,
              description: recurring.description,
              transaction_date: today.toISOString().split('T')[0],
              transaction_type: recurring.transaction_type,
              amount: recurring.amount,
            })
            .select()
            .single()

          if (insertError) {
            console.error(`Error inserting transaction for recurring_id ${recurring.id}:`, insertError)
            continue
          }

          // Log the generation
          const { error: logError } = await supabaseClient
            .from('transaction_generation_log')
            .insert({
              recurring_transaction_id: recurring.id,
              generated_transaction_id: newTransaction.id,
              generated_for_date: today.toISOString().split('T')[0],
            })

          if (logError) {
            console.error(`Error logging generation for recurring_id ${recurring.id}:`, logError)
          }

          // Update last_generated_date
          await supabaseClient
            .from('recurring_transactions')
            .update({ last_generated_date: today.toISOString().split('T')[0] })
            .eq('id', recurring.id)

          console.log(`✅ Generated transaction for: ${recurring.description} (${recurring.transaction_type})`)
          generatedCount++
        } else {
          skippedCount++
        }
      } catch (error) {
        console.error(`Error processing recurring transaction ${recurring.id}:`, error)
      }
    }

    const result = {
      success: true,
      date: today.toISOString().split('T')[0],
      processed: recurringTransactions?.length || 0,
      generated: generatedCount,
      skipped: skippedCount,
    }

    console.log('Generation summary:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/**
 * Determines if a transaction should be generated today based on frequency rules
 */
function shouldGenerateToday(recurring: RecurringTransaction, today: Date): boolean {
  const todayDay = today.getDate()
  const todayWeekday = today.getDay() // 0=Sunday, 6=Saturday
  const todayMonth = today.getMonth() + 1 // 1-12

  switch (recurring.frequency_type) {
    case 'monthly': {
      const { day } = recurring.frequency_config
      return todayDay === day
    }

    case 'biweekly': {
      const { days } = recurring.frequency_config
      return days.includes(todayDay)
    }

    case 'weekly': {
      const { weekday } = recurring.frequency_config
      return todayWeekday === weekday
    }

    case 'yearly': {
      const { month, day } = recurring.frequency_config
      return todayMonth === month && todayDay === day
    }

    default:
      return false
  }
}
