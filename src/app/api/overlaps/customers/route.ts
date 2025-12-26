import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get customers for this company
    const { data: customers, error: customersError } = await supabase
      .from('company_customers')
      .select('id, customer_company, customer_company_domain')
      .eq('company_id', companyId)
      .order('customer_company')

    if (customersError) {
      console.error('Error fetching customers:', customersError)
      return NextResponse.json({ error: customersError.message }, { status: 500 })
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({ customers: [] })
    }

    // Get alumni counts for each customer domain
    const domains = customers
      .map(c => c.customer_company_domain?.toLowerCase())
      .filter((d): d is string => d !== null && d !== undefined)

    // Query the view to get counts per domain (paginated to handle >1000 rows)
    let allAlumniRecords: { customer_domain: string | null }[] = []
    let page = 0
    const pageSize = 1000

    while (true) {
      const { data: batch, error: batchError } = await supabase
        .from('v_customer_alumni')
        .select('customer_domain')
        .in('customer_domain', domains)
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (batchError) {
        console.error('Error fetching alumni counts:', batchError)
        break
      }

      if (!batch || batch.length === 0) break

      allAlumniRecords = allAlumniRecords.concat(batch)

      if (batch.length < pageSize) break
      page++
    }

    const alumniCounts = allAlumniRecords

    // Count alumni per domain
    const countByDomain: Record<string, number> = {}
    if (alumniCounts) {
      for (const row of alumniCounts) {
        const domain = row.customer_domain?.toLowerCase()
        if (domain) {
          countByDomain[domain] = (countByDomain[domain] || 0) + 1
        }
      }
    }

    // Merge counts with customers
    const customersWithCounts = customers.map(c => ({
      id: c.id,
      customer_company: c.customer_company,
      customer_company_domain: c.customer_company_domain,
      alumni_count: countByDomain[c.customer_company_domain?.toLowerCase() || ''] || 0
    }))

    // Sort by alumni count descending
    customersWithCounts.sort((a, b) => b.alumni_count - a.alumni_count)

    return NextResponse.json({ customers: customersWithCounts })
  } catch (err) {
    console.error('Error in customers API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
