export interface Company {
  id: string
  name: string
  domain: string | null
  company_linkedin_url: string | null
  created_at: string
  updated_at: string
}

export interface CompanyCustomer {
  id: string
  company_id: string
  customer_company: string
  customer_company_domain: string | null
  created_at: string
  updated_at: string
}

export interface ClayPersonEnrichmentFlattenedData {
  id: string
  // Root level flat fields
  dob: string | null
  org: string | null
  url: string | null
  name: string | null
  slug: string | null
  title: string | null
  awards: string | null
  country: string | null
  courses: string | null
  summary: string | null
  user_id: string | null
  headline: string | null
  projects: string | null
  languages: string | null
  last_name: string | null
  person_id: string | null
  first_name: string | null
  jobs_count: number | null
  profile_id: number | null
  connections: number | null
  last_refresh: string | null
  others_named: string | null
  publications: string | null
  volunteering: string | null
  location_name: string | null
  num_followers: number | null
  patents: string | null
  picture_url_copy: string | null
  picture_url_orig: string | null
  people_also_viewed: string | null
  // From latest_experience object
  latest_experience_url: string | null
  latest_experience_title: string | null
  latest_experience_company: string | null
  latest_experience_company_domain: string | null
  latest_experience_org_id: number | null
  latest_experience_start_date: string | null
  latest_experience_end_date: string | null
  latest_experience_locality: string | null
  latest_experience_is_current: boolean | null
  latest_experience_summary: string | null
  // Timestamps
  created_at: string
  updated_at: string
}

export interface ClayPersonEnrichmentWorkHistoryData {
  id: string
  person_id: string
  company_linkedin_url: string | null
  title: string | null
  company: string | null
  company_domain: string | null
  org_id: number | null
  company_id: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
  locality: string | null
  summary: string | null
  created_at: string
  updated_at: string
}

export interface ClayPersonEnrichmentEducationData {
  id: string
  person_id: string
  school_name: string | null
  degree: string | null
  field_of_study: string | null
  grade: string | null
  activities: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface ClayPersonEnrichmentCertificationsData {
  id: string
  person_id: string
  title: string | null
  company_name: string | null
  company_id: string | null
  date: string | null
  credential_id: string | null
  verify_url: string | null
  summary: string | null
  created_at: string
  updated_at: string
}

export interface ClayPersonEnrichmentRawPayloads {
  id: string
  linkedin_url: string | null
  name: string | null
  first_name: string | null
  last_name: string | null
  raw_payload: Record<string, unknown>
  received_at: string
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Company, 'id' | 'created_at'>>
      }
      company_customers: {
        Row: CompanyCustomer
        Insert: Omit<CompanyCustomer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CompanyCustomer, 'id' | 'created_at'>>
      }
      clay_person_enrichment_flattened_data: {
        Row: ClayPersonEnrichmentFlattenedData
        Insert: Omit<ClayPersonEnrichmentFlattenedData, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClayPersonEnrichmentFlattenedData, 'id' | 'created_at'>>
      }
      clay_person_enrichment_work_history_data: {
        Row: ClayPersonEnrichmentWorkHistoryData
        Insert: Omit<ClayPersonEnrichmentWorkHistoryData, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClayPersonEnrichmentWorkHistoryData, 'id' | 'created_at'>>
      }
      clay_person_enrichment_education_data: {
        Row: ClayPersonEnrichmentEducationData
        Insert: Omit<ClayPersonEnrichmentEducationData, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClayPersonEnrichmentEducationData, 'id' | 'created_at'>>
      }
      clay_person_enrichment_certifications_data: {
        Row: ClayPersonEnrichmentCertificationsData
        Insert: Omit<ClayPersonEnrichmentCertificationsData, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClayPersonEnrichmentCertificationsData, 'id' | 'created_at'>>
      }
      clay_person_enrichment_raw_payloads: {
        Row: ClayPersonEnrichmentRawPayloads
        Insert: Omit<ClayPersonEnrichmentRawPayloads, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClayPersonEnrichmentRawPayloads, 'id' | 'created_at'>>
      }
    }
  }
}
