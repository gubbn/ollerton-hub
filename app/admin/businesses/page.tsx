'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type BusinessStatus = 'pending' | 'approved' | 'rejected'

type Business = {
  id: string
  business_name: string
  slug: string
  town: string | null
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  is_premium: boolean | null
  has_pending_changes: boolean | null
  pending_changed_fields: string[] | null
  changes_submitted_at: string | null
  created_at: string
}

function getBusinessStatus(business: Business): BusinessStatus {
  if (business.status === 'rejected') return 'rejected'
  if (business.status === 'approved' || business.is_approved === true) {
    return 'approved'
  }

  return 'pending'
}

function getStatusLabel(status: BusinessStatus) {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending'
}

function getStatusBadgeClasses(status: BusinessStatus) {
  if (status === 'approved') {
    return 'bg-green-100 text-green-800 ring-green-200'
  }

  if (status === 'rejected') {
    return 'bg-red-100 text-red-800 ring-red-200'
  }

  return 'bg-amber-100 text-amber-800 ring-amber-200'
}

function formatDate(value: string | null) {
  if (!value) return null

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AdminBusinessesPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [premiumOnly, setPremiumOnly] = useState(false)
  const [pendingChangesOnly, setPendingChangesOnly] = useState(false)

  useEffect(() => {
    async function loadBusinesses() {
      setLoading(true)
      setError('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      if (!profile?.is_admin) {
        router.push('/')
        return
      }

      const { data, error: businessesError } = await supabase
        .from('businesses')
        .select(`
          id,
          business_name,
          slug,
          town,
          status,
          is_approved,
          is_featured,
          is_premium,
          has_pending_changes,
          pending_changed_fields,
          changes_submitted_at,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (businessesError) {
        setError(businessesError.message)
        setBusinesses([])
      } else {
        setBusinesses((data || []) as Business[])
      }

      setLoading(false)
    }

    loadBusinesses()
  }, [router])

  const summary = useMemo(() => {
    return businesses.reduce(
      (totals, business) => {
        const status = getBusinessStatus(business)

        totals.total += 1

        if (status === 'pending') totals.pending += 1
        if (status === 'approved') totals.approved += 1
        if (status === 'rejected') totals.rejected += 1
        if (business.has_pending_changes) totals.pendingChanges += 1

        return totals
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        pendingChanges: 0,
      }
    )
  }, [businesses])

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const searchText = `
        ${business.business_name}
        ${business.slug}
        ${business.town || ''}
      `.toLowerCase()

      const matchesSearch = searchText.includes(search.toLowerCase().trim())

      const currentStatus = getBusinessStatus(business)

      const matchesStatus =
        statusFilter === 'all' ? true : currentStatus === statusFilter

      const matchesFeatured = featuredOnly ? business.is_featured === true : true
      const matchesPremium = premiumOnly ? business.is_premium === true : true

      const matchesPendingChanges = pendingChangesOnly
        ? business.has_pending_changes === true
        : true

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFeatured &&
        matchesPremium &&
        matchesPendingChanges
      )
    })
  }, [
    businesses,
    search,
    statusFilter,
    featuredOnly,
    premiumOnly,
    pendingChangesOnly,
  ])

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setFeaturedOnly(false)
    setPremiumOnly(false)
    setPendingChangesOnly(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <section className="mx-auto max-w-6xl">
          <p className="text-gray-700">Loading businesses...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm text-gray-600 hover:underline">
          ← Back to admin
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Businesses
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Showing {filteredBusinesses.length} of {businesses.length}{' '}
              businesses.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 text-sm shadow">
            <p className="font-semibold text-gray-900">Review summary</p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {summary.pending} pending
              </span>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                {summary.approved} approved
              </span>

              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                {summary.rejected} rejected
              </span>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                {summary.pendingChanges} with changes
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-4 shadow">
          <div className="grid gap-4 md:grid-cols-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search business, slug or town..."
              className="rounded-lg border border-gray-300 p-3 text-gray-900 md:col-span-2"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 p-3 text-gray-900"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
            >
              Clear filters
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(event) => setFeaturedOnly(event.target.checked)}
              />
              Featured only
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={premiumOnly}
                onChange={(event) => setPremiumOnly(event.target.checked)}
              />
              Premium only
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pendingChangesOnly}
                onChange={(event) =>
                  setPendingChangesOnly(event.target.checked)
                }
              />
              Changes pending review only
            </label>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-4">Business</th>
                <th className="p-4">Town</th>
                <th className="p-4">Status</th>
                <th className="p-4">Flags</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBusinesses.map((business) => {
                const status = getBusinessStatus(business)
                const changedFieldCount =
                  business.pending_changed_fields?.length || 0

                return (
                  <tr key={business.id} className="border-t align-top">
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">
                        {business.business_name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        /business/{business.slug}
                      </p>

                      {business.has_pending_changes && (
                        <p className="mt-2 text-xs font-medium text-blue-800">
                          {changedFieldCount > 0
                            ? `${changedFieldCount} field${
                                changedFieldCount === 1 ? '' : 's'
                              } changed`
                            : 'Changes submitted'}
                        </p>
                      )}
                    </td>

                    <td className="p-4 text-gray-700">
                      {business.town || '—'}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(
                          status
                        )}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {business.is_featured && (
                          <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                            Featured
                          </span>
                        )}

                        {business.is_premium && (
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                            Premium
                          </span>
                        )}

                        {business.has_pending_changes && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            Changes pending review
                          </span>
                        )}

                        {!business.is_featured &&
                          !business.is_premium &&
                          !business.has_pending_changes && (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                      </div>
                    </td>

                    <td className="p-4 text-gray-700">
                      {business.has_pending_changes
                        ? formatDate(business.changes_submitted_at) ||
                          'Changes submitted'
                        : formatDate(business.created_at) || '—'}
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/admin/businesses/${business.id}`}
                        className="font-medium text-red-700 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                )
              })}

              {filteredBusinesses.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No businesses match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}