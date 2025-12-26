'use client'

import { useEffect, useState } from 'react'
import { Card, Spinner, SearchInput } from '@/components/ui'

interface EmployerSummary {
  company_name: string
  company_domain: string | null
  employee_count: number
}

export default function EmployersPage() {
  const [employers, setEmployers] = useState<EmployerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'count'>('count')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/employers-summary')
        const data = await res.json()
        setEmployers(data.employers || [])
      } catch (err) {
        console.error('Error fetching employers:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSort = (column: 'name' | 'count') => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir(column === 'name' ? 'asc' : 'desc')
    }
  }

  const filteredEmployers = employers
    .filter(e =>
      !searchTerm ||
      e.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.company_domain?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') {
        cmp = (a.company_name || '').localeCompare(b.company_name || '')
      } else {
        cmp = a.employee_count - b.employee_count
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  const totalPeople = employers.reduce((sum, e) => sum + e.employee_count, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Top Past Employers
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Companies that appear most frequently as past employers in our database
          </p>
        </div>
        <div className="w-full sm:w-72">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search employers..."
          />
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
          <span>
            <span className="font-semibold text-gray-900 dark:text-white">{employers.length}</span> unique past employers
          </span>
          <span>
            <span className="font-semibold text-gray-900 dark:text-white">{totalPeople.toLocaleString()}</span> total past positions
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : employers.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No past employers found
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
                    onClick={() => handleSort('count')}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Past Employees
                      {sortBy === 'count' && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployers.map((employer, idx) => (
                  <tr
                    key={`${employer.company_domain || employer.company_name}-${idx}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {employer.company_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {employer.company_domain || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {employer.employee_count.toLocaleString()}
                      </span>
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
