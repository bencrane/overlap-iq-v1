import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()

    // Call the refresh function
    const { error } = await supabase.rpc('refresh_alumni_counts')

    if (error) {
      console.error('Error refreshing alumni counts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Alumni counts refreshed successfully',
      refreshedAt: new Date().toISOString()
    })
  } catch (err) {
    console.error('Error in refresh-alumni-counts API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
