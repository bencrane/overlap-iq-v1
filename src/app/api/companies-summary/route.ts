import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Use the efficient SQL function instead of fetching all rows
    const { data: companies, error } = await supabase
      .rpc('get_companies_summary')

    if (error) {
      console.error('Error fetching companies summary:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ companies: companies || [] })
  } catch (err) {
    console.error('Error in companies-summary API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
