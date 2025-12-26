import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Aggregate work history by company, counting past and current employers
    const { data, error } = await supabase
      .from('clay_person_enrichment_work_history_data')
      .select('company, company_domain, is_current')

    if (error) {
      console.error('Error fetching employers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aggregate in memory (Supabase doesn't support conditional aggregates directly)
    const employerMap = new Map<string, {
      company: string
      company_domain: string | null
      past_count: number
      current_count: number
    }>()

    for (const row of data || []) {
      if (!row.company) continue

      // Use domain as key if available, otherwise company name
      const key = row.company_domain?.toLowerCase() || row.company.toLowerCase()

      const existing = employerMap.get(key) || {
        company: row.company,
        company_domain: row.company_domain?.toLowerCase() || null,
        past_count: 0,
        current_count: 0
      }

      if (row.is_current) {
        existing.current_count++
      } else {
        existing.past_count++
      }

      // Keep the most common company name (in case of variations)
      employerMap.set(key, existing)
    }

    // Convert to array and sort by total count descending
    const employers = Array.from(employerMap.values())
      .sort((a, b) => (b.past_count + b.current_count) - (a.past_count + a.current_count))

    return NextResponse.json({ employers })
  } catch (err) {
    console.error('Error in employers API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
