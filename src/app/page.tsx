'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, Spinner } from '@/components/ui'

interface Stats {
  totalCompanies: number
  companiesWithCustomers: number
  totalCustomers: number
  totalPeople: number
  totalWorkHistory: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome to Overlap IQ
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalCompanies.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Companies</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.companiesWithCustomers.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">With Customers</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalCustomers.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Customers</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalPeople.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">People Enriched</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
