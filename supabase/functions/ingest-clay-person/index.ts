import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Normalize partial dates (e.g., "2025-02" -> "2025-02-01") for PostgreSQL DATE columns
function normalizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null

  // Already full date (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

  // Partial date (YYYY-MM) -> add day 01
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`

  // Year only (YYYY) -> add month and day
  if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`

  // Return as-is and let PostgreSQL handle/reject it
  return dateStr
}

// Type definitions for payload structure
interface LatestExperience {
  url?: string
  title?: string
  company?: string
  company_domain?: string
  org_id?: number
  start_date?: string
  end_date?: string
  locality?: string
  is_current?: boolean
  summary?: string
}

interface ExperienceEntry {
  url?: string
  title?: string
  company?: string
  company_domain?: string
  org_id?: number
  company_id?: string
  start_date?: string
  end_date?: string
  is_current?: boolean
  locality?: string
  summary?: string
}

interface EducationEntry {
  school_name?: string
  degree?: string
  field_of_study?: string
  grade?: string
  activities?: string
  start_date?: string
  end_date?: string
}

interface CertificationEntry {
  title?: string
  company_name?: string
  company_id?: string
  date?: string
  credential_id?: string
  verify_url?: string
  summary?: string
}

interface ClayPersonPayload {
  // Root level fields
  dob?: string
  org?: string
  url?: string
  name?: string
  slug?: string
  title?: string
  awards?: string
  country?: string
  courses?: string
  summary?: string
  user_id?: string
  headline?: string
  projects?: string
  languages?: string
  last_name?: string
  person_id?: string
  first_name?: string
  jobs_count?: number
  profile_id?: number
  connections?: number
  last_refresh?: string
  others_named?: string
  publications?: string
  volunteering?: string
  location_name?: string
  num_followers?: number
  patents?: string
  picture_url_copy?: string
  picture_url_orig?: string
  people_also_viewed?: string
  // Nested objects/arrays
  latest_experience?: LatestExperience
  experience?: ExperienceEntry[]
  education?: EducationEntry[]
  certifications?: CertificationEntry[]
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

    // Parse request body
    const body = await req.json()

    // Unwrap from person_raw_enriched_payload if present
    const payload: ClayPersonPayload = body.person_raw_enriched_payload ?? body

    // Validate required field: url (LinkedIn URL)
    if (!payload.url) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: url (LinkedIn URL)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Track counts for response
    const counts = {
      work_history: 0,
      education: 0,
      certifications: 0
    }

    // ============================================================
    // STEP 1: Store Raw Payload
    // ============================================================
    const rawPayloadRecord = {
      linkedin_url: payload.url ?? null,
      name: payload.name ?? null,
      first_name: payload.first_name ?? null,
      last_name: payload.last_name ?? null,
      raw_payload: payload,
      received_at: new Date().toISOString()
    }

    const { error: rawPayloadError } = await supabase
      .from('clay_person_enrichment_raw_payloads')
      .upsert(rawPayloadRecord, {
        onConflict: 'linkedin_url',
        ignoreDuplicates: false
      })

    if (rawPayloadError) {
      console.error('Error storing raw payload:', rawPayloadError)
      // Continue - don't fail the entire request for raw payload storage
    }

    // ============================================================
    // STEP 2: Insert/Update Flattened Data
    // ============================================================
    const flattenedRecord = {
      // Root level fields
      dob: payload.dob ?? null,
      org: payload.org ?? null,
      url: payload.url ?? null,
      name: payload.name ?? null,
      slug: payload.slug ?? null,
      title: payload.title ?? null,
      awards: payload.awards ?? null,
      country: payload.country ?? null,
      courses: payload.courses ?? null,
      summary: payload.summary ?? null,
      user_id: payload.user_id ?? null,
      headline: payload.headline ?? null,
      projects: payload.projects ?? null,
      languages: payload.languages ?? null,
      last_name: payload.last_name ?? null,
      person_id: payload.person_id ?? null,
      first_name: payload.first_name ?? null,
      jobs_count: payload.jobs_count ?? null,
      profile_id: payload.profile_id ?? null,
      connections: payload.connections ?? null,
      last_refresh: payload.last_refresh ?? null,
      others_named: payload.others_named ?? null,
      publications: payload.publications ?? null,
      volunteering: payload.volunteering ?? null,
      location_name: payload.location_name ?? null,
      num_followers: payload.num_followers ?? null,
      patents: payload.patents ?? null,
      picture_url_copy: payload.picture_url_copy ?? null,
      picture_url_orig: payload.picture_url_orig ?? null,
      people_also_viewed: payload.people_also_viewed ?? null,
      // From latest_experience object
      latest_experience_url: payload.latest_experience?.url ?? null,
      latest_experience_title: payload.latest_experience?.title ?? null,
      latest_experience_company: payload.latest_experience?.company ?? null,
      latest_experience_company_domain: payload.latest_experience?.company_domain ?? null,
      latest_experience_org_id: payload.latest_experience?.org_id ?? null,
      latest_experience_start_date: normalizeDate(payload.latest_experience?.start_date),
      latest_experience_end_date: normalizeDate(payload.latest_experience?.end_date),
      latest_experience_locality: payload.latest_experience?.locality ?? null,
      latest_experience_is_current: payload.latest_experience?.is_current ?? null,
      latest_experience_summary: payload.latest_experience?.summary ?? null
    }

    const { data: flattenedData, error: flattenedError } = await supabase
      .from('clay_person_enrichment_flattened_data')
      .upsert(flattenedRecord, {
        onConflict: 'url',
        ignoreDuplicates: false
      })
      .select('id')
      .single()

    if (flattenedError) {
      console.error('Error storing flattened data:', flattenedError)
      return new Response(
        JSON.stringify({ error: `Failed to store person data: ${flattenedError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const personId = flattenedData.id

    // ============================================================
    // STEP 3: Insert Work History (Delete + Insert)
    // ============================================================
    const experienceArray = Array.isArray(payload.experience) ? payload.experience : []

    if (experienceArray.length > 0) {
      // Delete existing work history for this person
      const { error: deleteWorkError } = await supabase
        .from('clay_person_enrichment_work_history_data')
        .delete()
        .eq('person_id', personId)

      if (deleteWorkError) {
        console.error('Error deleting existing work history:', deleteWorkError)
      }

      // Insert new work history records
      const workHistoryRecords = experienceArray.map((exp) => ({
        person_id: personId,
        company_linkedin_url: exp.url ?? null,
        title: exp.title ?? null,
        company: exp.company ?? null,
        company_domain: exp.company_domain ?? null,
        org_id: exp.org_id ?? null,
        company_id: exp.company_id ?? null,
        start_date: normalizeDate(exp.start_date),
        end_date: normalizeDate(exp.end_date),
        is_current: exp.is_current ?? null,
        locality: exp.locality ?? null,
        summary: exp.summary ?? null
      }))

      const { error: insertWorkError } = await supabase
        .from('clay_person_enrichment_work_history_data')
        .insert(workHistoryRecords)

      if (insertWorkError) {
        console.error('Error inserting work history:', insertWorkError)
      } else {
        counts.work_history = workHistoryRecords.length
      }
    }

    // ============================================================
    // STEP 4: Insert Education (Delete + Insert)
    // ============================================================
    const educationArray = Array.isArray(payload.education) ? payload.education : []

    if (educationArray.length > 0) {
      // Delete existing education for this person
      const { error: deleteEduError } = await supabase
        .from('clay_person_enrichment_education_data')
        .delete()
        .eq('person_id', personId)

      if (deleteEduError) {
        console.error('Error deleting existing education:', deleteEduError)
      }

      // Insert new education records
      const educationRecords = educationArray.map((edu) => ({
        person_id: personId,
        school_name: edu.school_name ?? null,
        degree: edu.degree ?? null,
        field_of_study: edu.field_of_study ?? null,
        grade: edu.grade ?? null,
        activities: edu.activities ?? null,
        start_date: normalizeDate(edu.start_date),
        end_date: normalizeDate(edu.end_date)
      }))

      const { error: insertEduError } = await supabase
        .from('clay_person_enrichment_education_data')
        .insert(educationRecords)

      if (insertEduError) {
        console.error('Error inserting education:', insertEduError)
      } else {
        counts.education = educationRecords.length
      }
    }

    // ============================================================
    // STEP 5: Insert Certifications (Delete + Insert)
    // ============================================================
    const certificationsArray = Array.isArray(payload.certifications) ? payload.certifications : []

    if (certificationsArray.length > 0) {
      // Delete existing certifications for this person
      const { error: deleteCertError } = await supabase
        .from('clay_person_enrichment_certifications_data')
        .delete()
        .eq('person_id', personId)

      if (deleteCertError) {
        console.error('Error deleting existing certifications:', deleteCertError)
      }

      // Insert new certification records
      const certificationRecords = certificationsArray.map((cert) => ({
        person_id: personId,
        title: cert.title ?? null,
        company_name: cert.company_name ?? null,
        company_id: cert.company_id ?? null,
        date: normalizeDate(cert.date),
        credential_id: cert.credential_id ?? null,
        verify_url: cert.verify_url ?? null,
        summary: cert.summary ?? null
      }))

      const { error: insertCertError } = await supabase
        .from('clay_person_enrichment_certifications_data')
        .insert(certificationRecords)

      if (insertCertError) {
        console.error('Error inserting certifications:', insertCertError)
      } else {
        counts.certifications = certificationRecords.length
      }
    }

    // ============================================================
    // Return Success Response
    // ============================================================
    return new Response(
      JSON.stringify({
        success: true,
        person_id: personId,
        counts
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
