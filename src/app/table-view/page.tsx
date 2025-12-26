'use client'

import { useEffect, useState } from 'react'
import { Card, Spinner, SearchInput } from '@/components/ui'
import Link from 'next/link'

interface CompanySummary {
  id: string
  name: string
  domain: string | null
  customer_count: number
  overlap_count: number
}

export default function TableViewPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'customers' | 'overlaps'>('overlaps')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/companies-summary')
        const data = await res.json()
        setCompanies(data.companies || [])
      } catch (err) {
        console.error('Error fetching companies:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSort = (column: 'name' | 'customers' | 'overlaps') => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir(column === 'name' ? 'asc' : 'desc')
    }
  }

  const filteredCompanies = companies
    .filter(c =>
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.domain?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (sortBy === 'customers') {
        cmp = a.customer_count - b.customer_count
      } else {
        cmp = a.overlap_count - b.overlap_count
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  const totalOverlaps = companies.reduce((sum, c) => sum + c.overlap_count, 0)
  const totalCustomers = companies.reduce((sum, c) => sum + c.customer_count, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Companies Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Companies with customers and their overlap counts
          </p>
        </div>
        <div className="w-full sm:w-72">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search companies..."
          />
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
          <span>
            <span className="font-semibold text-gray-900 dark:text-white">{companies.length}</span> companies with customers
          </span>
          <span>
            <span className="font-semibold text-gray-900 dark:text-white">{totalCustomers.toLocaleString()}</span> total customers
          </span>
          <span>
            <span className="font-semibold text-gray-900 dark:text-white">{totalOverlaps.toLocaleString()}</span> total overlaps
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No companies with customers found
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-1">
                      Company
                      {sortBy === 'name' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Domain
                  </th>
                  <th
                    onClick={() => handleSort('customers')}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Customers
                      {sortBy === 'customers' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('overlaps')}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Overlaps
                      {sortBy === 'overlaps' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {company.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {company.domain || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      {company.customer_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={company.overlap_count > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                        {company.overlap_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Link
                        href={`/overlaps?company=${company.id}`}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
