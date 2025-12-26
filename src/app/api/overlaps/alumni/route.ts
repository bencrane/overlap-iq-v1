import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerDomain = searchParams.get('customer_domain')

    if (!customerDomain) {
      return NextResponse.json(
        { error: 'customer_domain is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Query the view for alumni at this customer domain (paginated to handle >1000 rows)
    type AlumniRecord = {
      person_id: string
      name: string | null
      headline: string | null
      linkedin_url: string | null
      past_title: string | null
      past_start_date: string | null
      past_end_date: string | null
      current_company: string | null
      current_title: string | null
    }

    let allAlumni: AlumniRecord[] = []
    let page = 0
    const pageSize = 1000

    while (true) {
      const { data: batch, error: batchError } = await supabase
        .from('v_customer_alumni')
        .select('person_id, name, headline, linkedin_url, past_title, past_start_date, past_end_date, current_company, current_title')
        .ilike('customer_domain', customerDomain)
        .order('past_end_date', { ascending: false, nullsFirst: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (batchError) {
        console.error('Error fetching alumni:', batchError)
        return NextResponse.json({ error: batchError.message }, { status: 500 })
      }

      if (!batch || batch.length === 0) break

      allAlumni = allAlumni.concat(batch)

      if (batch.length < pageSize) break
      page++
    }

    return NextResponse.json({ alumni: allAlumni })
  } catch (err) {
    console.error('Error in alumni API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
