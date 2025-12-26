import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestPayload {
  company_domain: string
  customer_company: string
  customer_company_domain?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: RequestPayload = await req.json()

    // Validate required fields
    if (!payload.company_domain) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: company_domain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!payload.customer_company) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: customer_company' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Look up company by domain
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('domain', payload.company_domain.trim().toLowerCase())
      .single()

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: `Company not found for domain: ${payload.company_domain}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert customer
    const { data, error } = await supabase
      .from('company_customers')
      .insert({
        company_id: company.id,
        customer_company: payload.customer_company.trim(),
        customer_company_domain: payload.customer_company_domain?.trim().toLowerCase() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
