'use client'

import { useState } from 'react'
import { Card, CardContent, Button, Spinner } from '@/components/ui'

export default function AdminPage() {
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/refresh-alumni-counts', {
        method: 'POST'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to refresh')
      }

      setLastRefresh(data.refreshedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          System administration and maintenance
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Refresh Alumni Counts
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Refreshes the materialized view that caches alumni counts per domain.
            Run this after ingesting new person data to update the Table View counts.
          </p>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Refreshing...</span>
                </>
              ) : (
                'Refresh Alumni Counts'
              )}
            </Button>

            {lastRefresh && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Last refreshed: {new Date(lastRefresh).toLocaleString()}
              </span>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              Error: {error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
