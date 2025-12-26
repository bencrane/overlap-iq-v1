import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Use the efficient SQL function
    const { data: employers, error } = await supabase
      .rpc('get_top_past_employers', { limit_count: 500 } as unknown as undefined)

    if (error) {
      console.error('Error fetching employers summary:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ employers: employers || [] })
  } catch (err) {
    console.error('Error in employers-summary API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
