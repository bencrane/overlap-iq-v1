export interface OverlapPerson {
  person_id: string
  name: string
  headline: string | null
  linkedin_url: string | null
  current_title: string | null
  customer_company: string
  past_title: string | null
}

export interface TargetCompanyOverlap {
  target_company: string
  target_company_domain: string | null
  overlap_count: number
  people: OverlapPerson[]
}

export interface CustomerWithAlumni {
  id: string
  customer_company: string
  customer_company_domain: string | null
  alumni_count: number
}

export interface CustomerAlumni {
  person_id: string
  name: string
  headline: string | null
  linkedin_url: string | null
  past_title: string | null
  past_start_date: string | null
  past_end_date: string | null
  current_company: string | null
  current_title: string | null
}
