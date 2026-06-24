'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { expireOldPaidListings } from '@/lib/expirePaidListings'

type ListingTier = 'free' | 'featured'

type Business = {
  id: string
  business_name: string
  slug: string
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  paid_tier: ListingTier | null
  paid_tier_expires_at: string | null
  listing_type: string | null
  useful_listing_type: string | null
  town: string | null
  created_at: string | null
  has_pending_changes: boolean | null
}

function getListingStatus(listing: Business) {
  if (listing.status === 'rejected') return 'rejected'
  if (listing.status === 'approved') return 'approved'
  if (listing.is_approved === true) return 'approved'
  return 'pending'
}

function getListingTier(listing: Business): ListingTier {
  if (listing.paid_tier === 'featured') return 'featured'
  if (listing.is_featured === true) return 'featured'
  return 'free'
}

function isBusinessOnly(listing: Business) {
  return (
    listing.listing_type !== 'community' &&
    listing.listing_type !== 'local_info' &&
    !listing.useful_listing_type
  )
}

function formatDate(value: string | null) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getStatusBadgeClasses(status: string) {
  if (status === 'approved') {
    return 'bg-green-100 text-green-800'
  }

  if (status === 'rejected') {
    return 'bg-red-100 text-red-800'
  }

  return 'bg-amber-100 text-amber-800'
}

function AdminBusinessesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  )
  const [tierFilter, setTierFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    loadBusinesses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadBusinesses() {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setError(userError.message)
      setLoading(false)
      return
    }

    if (!user) {
      router.push('/login')
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
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)

    await expireOldPaidListings()

    const { data, error: businessesError } = await supabase
      .from('businesses')
      .select(
        `
        id,
        business_name,
        slug,
        status,
        is_approved,
        is_featured,
        paid_tier,
        paid_tier_expires_at,
        listing_type,
        useful_listing_type,
        town,
        created_at,
        has_pending_changes
      `
      )
      .order('created_at', { ascending: false })

    if (businessesError) {
      setError(businessesError.message)
      setLoading(false)
      return
    }

    const businessOnly = ((data ?? []) as Business[]).filter(isBusinessOnly)

    setBusinesses(businessOnly)
    setLoading(false)
  }

  const stats = useMemo(() => {
    const pending = businesses.filter(
      (business) => getListingStatus(business) === 'pending'
    )

    const approved = businesses.filter(
      (business) => getListingStatus(business) === 'approved'
    )

    const rejected = businesses.filter(
      (business) => getListingStatus(business) === 'rejected'
    )

    const featured = businesses.filter(
      (business) => getListingTier(business) === 'featured'
    )

    const pendingChanges = businesses.filter(
      (business) => business.has_pending_changes === true
    )

    return {
      total: businesses.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      featured: featured.length,
      pendingChanges: pendingChanges.length,
    }
  }, [businesses])

  const filteredBusinesses = useMemo(() => {
    const term = search.trim().toLowerCase()

    return businesses.filter((business) => {
      const status = getListingStatus(business)
      const tier = getListingTier(business)

      const matchesSearch =
        !term ||
        business.business_name.toLowerCase().includes(term) ||
        business.town?.toLowerCase().includes(term) ||
        business.slug.toLowerCase().includes(term)

      const matchesStatus =
        statusFilter === 'all' ||
        status === statusFilter ||
        (statusFilter === 'changes' && business.has_pending_changes === true)

      const matchesTier = tierFilter === 'all' || tier === tierFilter

      return matchesSearch && matchesStatus && matchesTier
    })
  }, [businesses, search, statusFilter, tierFilter])

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-stone-600">Loading businesses...</p>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
          >
            Back to admin centre
          </Link>

          <Link
            href="/admin/amenities"
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
          >
            Manage local amenities
          </Link>
        </div>

        <header className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
            Admin centre
          </p>

          <h1 className="mt-3 text-3xl font-bold text-stone-950 md:text-4xl">
            Manage businesses
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">
            Review, approve, reject, feature and manage business listings.
            Local amenities are excluded from this page and should be managed
            from the local amenities area.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total businesses" value={stats.total} />
          <StatCard label="Pending approval" value={stats.pending} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Pending changes" value={stats.pendingChanges} />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Featured" value={stats.featured} subtle />
          <StatCard label="Rejected" value={stats.rejected} subtle />
          <StatCard
            label="Shown below"
            value={filteredBusinesses.length}
            subtle
          />
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by business, town or slug..."
              className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="changes">Pending changes</option>
            </select>

            <select
              value={tierFilter}
              onChange={(event) => setTierFilter(event.target.value)}
              className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
            >
              <option value="all">All listing types</option>
              <option value="free">Free</option>
              <option value="featured">Featured</option>
            </select>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-950">
                Business listings
              </h2>

              <p className="mt-1 text-sm text-stone-600">
                {filteredBusinesses.length} shown from {businesses.length}{' '}
                business listings.
              </p>
            </div>
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-stone-50 p-5 text-sm text-stone-600">
              No businesses match the current filters.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filteredBusinesses.map((business) => {
                const status = getListingStatus(business)
                const tier = getListingTier(business)

                return (
                  <article
                    key={business.id}
                    className="rounded-2xl border border-stone-200 p-4 transition hover:bg-stone-50"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-stone-950">
                            {business.business_name}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClasses(
                              status
                            )}`}
                          >
                            {status}
                          </span>

                          {tier === 'featured' ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              Featured
                            </span>
                          ) : (
                            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                              Free
                            </span>
                          )}

                          {business.has_pending_changes ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              Changes pending
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm text-stone-600">
                          {business.town || 'No town added'} · Submitted{' '}
                          {formatDate(business.created_at)}
                        </p>

                        {tier === 'featured' ? (
                          <p className="mt-1 text-xs text-stone-500">
                            Featured until{' '}
                            {formatDate(business.paid_tier_expires_at)}
                          </p>
                        ) : null}

                        <p className="mt-1 text-xs text-stone-400">
                          /business/{business.slug}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/business/${business.slug}`}
                          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-white"
                        >
                          View
                        </Link>

                        <Link
                          href={`/admin/businesses/${business.id}`}
                          className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  subtle = false,
}: {
  label: string
  value: number
  subtle?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm ${
        subtle ? 'bg-stone-50' : 'bg-white'
      }`}
    >
      <p className="text-3xl font-bold text-stone-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-stone-600">{label}</p>
    </div>
  )
}

export default function AdminBusinessesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm text-stone-600">Loading businesses...</p>
          </div>
        </main>
      }
    >
      <AdminBusinessesContent />
    </Suspense>
  )
}