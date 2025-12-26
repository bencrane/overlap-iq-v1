'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, Spinner, SearchInput, Badge } from '@/components/ui'
import type { CustomerWithAlumni, CustomerAlumni } from '@/types/overlaps'

interface Company {
  id: string
  name: string
  domain: string | null
}

export default function OverlapsPage() {
  // Company selection state
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  // Customers with alumni state
  const [customers, setCustomers] = useState<CustomerWithAlumni[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [companySearchTerm, setCompanySearchTerm] = useState('')

  // Expanded customer alumni state
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
  const [alumniByCustomer, setAlumniByCustomer] = useState<Record<string, CustomerAlumni[]>>({})
  const [loadingAlumni, setLoadingAlumni] = useState<Set<string>>(new Set())

  const [error, setError] = useState<string | null>(null)

  // Fetch companies on mount
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch('/api/companies')
        const data = await res.json()

        if (!res.ok) throw new Error(data.error)

        setCompanies(data.companies || [])

        // Auto-select first company if available
        if (data.companies && data.companies.length > 0) {
          setSelectedCompanyId(data.companies[0].id)
        }
      } catch (err) {
        console.error('Error fetching companies:', err)
        setError('Failed to load companies')
      } finally {
        setLoadingCompanies(false)
      }
    }
    fetchCompanies()
  }, [])

  // Fetch customers with alumni when company is selected
  const fetchCustomers = useCallback(async () => {
    if (!selectedCompanyId) return

    try {
      setLoadingCustomers(true)
      setError(null)

      const res = await fetch(`/api/overlaps/customers?company_id=${selectedCompanyId}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setCustomers(data.customers || [])
      // Reset expanded state when company changes
      setExpandedCustomers(new Set())
      setAlumniByCustomer({})
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoadingCustomers(false)
    }
  }, [selectedCompanyId])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Fetch alumni for a specific customer
  const fetchAlumni = async (customerDomain: string) => {
    if (!customerDomain || alumniByCustomer[customerDomain]) return

    try {
      setLoadingAlumni(prev => new Set(prev).add(customerDomain))

      const res = await fetch(`/api/overlaps/alumni?customer_domain=${encodeURIComponent(customerDomain)}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setAlumniByCustomer(prev => ({
        ...prev,
        [customerDomain]: data.alumni || []
      }))
    } catch (err) {
      console.error('Error fetching alumni:', err)
    } finally {
      setLoadingAlumni(prev => {
        const next = new Set(prev)
        next.delete(customerDomain)
        return next
      })
    }
  }

  const toggleExpanded = (customerDomain: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev)
      if (next.has(customerDomain)) {
        next.delete(customerDomain)
      } else {
        next.add(customerDomain)
        // Fetch alumni when expanding
        fetchAlumni(customerDomain)
      }
      return next
    })
  }

  // Filter customers by search term
  const filteredCustomers = customers.filter(c =>
    !searchTerm ||
    c.customer_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_company_domain?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalAlumni = customers.reduce((sum, c) => sum + c.alumni_count, 0)
  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

  // Filter companies by search term
  const filteredCompanies = companies.filter(c =>
    !companySearchTerm ||
    c.name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
    c.domain?.toLowerCase().includes(companySearchTerm.toLowerCase())
  )

  return (
    <div className="flex gap-6">
      {/* Sidebar - Company Selector */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Select Company
          </h2>
          <div className="mb-3">
            <SearchInput
              value={companySearchTerm}
              onChange={setCompanySearchTerm}
              placeholder="Search companies..."
            />
          </div>
          {loadingCompanies ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {companySearchTerm ? 'No matching companies' : 'No companies found'}
            </p>
          ) : (
            <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
              {filteredCompanies.map(company => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompanyId(company.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCompanyId === company.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {company.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedCompany ? `${selectedCompany.name} Customers` : 'Customer Alumni'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              People who used to work at your customers
            </p>
          </div>
          <div className="w-full sm:w-72">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search customers..."
            />
          </div>
        </div>

        {/* Stats */}
        {!loadingCustomers && !error && customers.length > 0 && (
          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              <span className="font-semibold text-gray-900 dark:text-white">{customers.length}</span> customers
            </span>
            <span>
              <span className="font-semibold text-gray-900 dark:text-white">{totalAlumni}</span> total alumni
            </span>
          </div>
        )}

        {/* Loading State */}
        {loadingCustomers && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <div className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchCustomers}
                className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Try again
              </button>
            </div>
          </Card>
        )}

        {/* No Company Selected */}
        {!selectedCompanyId && !loadingCompanies && (
          <Card>
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Select a company to view its customers
              </p>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loadingCustomers && !error && selectedCompanyId && customers.length === 0 && (
          <Card>
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No customers found
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Add customers to this company to see alumni data
              </p>
            </div>
          </Card>
        )}

        {/* Customers List */}
        {!loadingCustomers && !error && filteredCustomers.length > 0 && (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => {
              const isExpanded = expandedCustomers.has(customer.customer_company_domain || '')
              const isLoadingAlumni = loadingAlumni.has(customer.customer_company_domain || '')
              const alumni = alumniByCustomer[customer.customer_company_domain || ''] || []

              return (
                <Card key={customer.id} className="overflow-hidden">
                  {/* Customer Header - Clickable */}
                  <button
                    onClick={() => customer.customer_company_domain && toggleExpanded(customer.customer_company_domain)}
                    disabled={!customer.customer_company_domain || customer.alumni_count === 0}
                    className={`w-full px-4 py-4 flex items-center justify-between text-left transition-colors ${
                      customer.customer_company_domain && customer.alumni_count > 0
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {customer.alumni_count > 0 ? (
                        <svg
                          className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      ) : (
                        <div className="w-5" />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {customer.customer_company}
                        </h3>
                        {customer.customer_company_domain && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.customer_company_domain}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={customer.alumni_count > 0 ? 'success' : 'default'}>
                      {customer.alumni_count} {customer.alumni_count === 1 ? 'alumnus' : 'alumni'}
                    </Badge>
                  </button>

                  {/* Expanded Alumni List */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {isLoadingAlumni ? (
                        <div className="flex justify-center py-6">
                          <Spinner size="sm" />
                        </div>
                      ) : alumni.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                          No alumni found
                        </div>
                      ) : (
                        alumni.map((person) => (
                          <div
                            key={person.person_id}
                            className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                  {person.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                </span>
                              </div>

                              {/* Person Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {person.linkedin_url ? (
                                    <a
                                      href={person.linkedin_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                      {person.name}
                                    </a>
                                  ) : (
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {person.name}
                                    </span>
                                  )}
                                  {person.linkedin_url && (
                                    <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                    </svg>
                                  )}
                                </div>

                                {/* Past role at this customer */}
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  Was: {person.past_title || 'Unknown role'}
                                  {person.past_end_date && (
                                    <span className="text-gray-400"> (left {new Date(person.past_end_date).getFullYear()})</span>
                                  )}
                                </p>

                                {/* Current role */}
                                {person.current_company && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Now: {person.current_title} at <span className="font-medium">{person.current_company}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
