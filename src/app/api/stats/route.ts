import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get total companies count
    const { count: totalCompanies } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    // Get companies with customers (distinct company_ids in company_customers)
    const { data: companiesWithCustomers } = await supabase
      .from('company_customers')
      .select('company_id')

    const uniqueCompaniesWithCustomers = new Set(
      companiesWithCustomers?.map(c => c.company_id) || []
    ).size

    // Get total customers count
    const { count: totalCustomers } = await supabase
      .from('company_customers')
      .select('*', { count: 'exact', head: true })

    // Get total people count
    const { count: totalPeople } = await supabase
      .from('clay_person_enrichment_flattened_data')
      .select('*', { count: 'exact', head: true })

    // Get total work history records
    const { count: totalWorkHistory } = await supabase
      .from('clay_person_enrichment_work_history_data')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      totalCompanies: totalCompanies || 0,
      companiesWithCustomers: uniqueCompaniesWithCustomers,
      totalCustomers: totalCustomers || 0,
      totalPeople: totalPeople || 0,
      totalWorkHistory: totalWorkHistory || 0
    })
  } catch (err) {
    console.error('Error in stats API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
