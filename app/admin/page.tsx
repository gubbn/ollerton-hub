'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Listing = {
  id: string
  business_name: string
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  is_premium: boolean | null
  listing_type: string | null
  useful_listing_type: string | null
  created_at: string
}

function getListingStatus(listing: Listing) {
  if (listing.status === 'rejected') return 'rejected'
  if (listing.status === 'approved') return 'approved'
  if (listing.is_approved === true) return 'approved'
  return 'pending'
}

function getListingTypeLabel(listing: Listing) {
  if (listing.listing_type === 'community') {
    return listing.useful_listing_type || 'Local amenity'
  }

  return 'Business'
}

function getManageLink(listing: Listing) {
  if (listing.listing_type === 'community') {
    return '/admin/useful-listings'
  }

  return `/admin/businesses/${listing.id}`
}

export default function AdminPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAdminData() {
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

      const { data, error: listingsError } = await supabase
        .from('businesses')
        .select(
          `
          id,
          business_name,
          status,
          is_approved,
          is_featured,
          is_premium,
          listing_type,
          useful_listing_type,
          created_at
        `
        )
        .order('created_at', { ascending: false })

      if (listingsError) {
        setError(listingsError.message)
        setListings([])
      } else {
        setListings((data || []) as Listing[])
      }

      setLoading(false)
    }

    loadAdminData()
  }, [router])

  const stats = useMemo(() => {
    const businesses = listings.filter(
      (listing) => listing.listing_type !== 'community'
    )

    const localAmenities = listings.filter(
      (listing) => listing.listing_type === 'community'
    )

    const pendingBusinesses = businesses.filter(
      (listing) => getListingStatus(listing) === 'pending'
    )

    const pendingAmenities = localAmenities.filter(
      (listing) => getListingStatus(listing) === 'pending'
    )

    const approved = listings.filter(
      (listing) => getListingStatus(listing) === 'approved'
    )

    const rejected = listings.filter(
      (listing) => getListingStatus(listing) === 'rejected'
    )

    const featured = listings.filter(
      (listing) => listing.is_featured === true
    )

    const premium = listings.filter(
      (listing) => listing.is_premium === true
    )

    return {
      total: listings.length,
      businesses: businesses.length,
      localAmenities: localAmenities.length,
      pendingBusinesses: pendingBusinesses.length,
      pendingAmenities: pendingAmenities.length,
      approved: approved.length,
      rejected: rejected.length,
      featured: featured.length,
      premium: premium.length,
    }
  }, [listings])

  const recentListings = listings.slice(0, 8)

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            Loading admin dashboard...
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
              Ollerton Hub
            </p>

            <h1 className="text-3xl font-bold text-stone-950">
              Admin dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">
              Manage business submissions, local amenities, useful community
              listings, reviews, featured visibility and premium options.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-800 shadow-sm hover:bg-stone-50"
          >
            View public site
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total listings" value={stats.total} />
          <StatCard label="Businesses" value={stats.businesses} />
          <StatCard label="Local amenities" value={stats.localAmenities} />
          <StatCard label="Pending businesses" value={stats.pendingBusinesses} />
          <StatCard label="Pending amenities" value={stats.pendingAmenities} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Rejected" value={stats.rejected} />
          <StatCard label="Featured" value={stats.featured} />
          <StatCard label="Premium" value={stats.premium} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <AdminActionCard
            href="/admin/businesses"
            eyebrow="Business directory"
            title="Manage businesses"
            description="Approve, reject, feature, delete and manage premium business listings."
          />

          <AdminActionCard
            href="/admin/useful-listings"
            eyebrow="Local amenities"
            title="Manage useful listings"
            description="Add and manage places of worship, schools, recycling centres, council services, community venues and public information."
          />

          <AdminActionCard
            href="/admin/reviews"
            eyebrow="Moderation"
            title="Manage reviews"
            description="Check pending reviews and decide what should appear on public business profiles."
          />

          <AdminActionCard
            href="/admin/settings"
            eyebrow="Site content"
            title="Site settings"
            description="Update homepage text, directory messaging and other editable site content."
          />
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-950">
                Recent listings
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Latest businesses and local amenities added to Ollerton Hub.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/businesses"
                className="text-sm font-bold text-red-700 hover:underline"
              >
                Businesses
              </Link>

              <Link
                href="/admin/useful-listings"
                className="text-sm font-bold text-red-700 hover:underline"
              >
                Local amenities
              </Link>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {recentListings.length === 0 ? (
              <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
                No listings have been added yet.
              </p>
            ) : (
              recentListings.map((listing) => {
                const status = getListingStatus(listing)
                const isAmenity = listing.listing_type === 'community'

                return (
                  <div
                    key={listing.id}
                    className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-stone-950">
                          {listing.business_name}
                        </p>

                        <span
                          className={
                            isAmenity
                              ? 'rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800'
                              : 'rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-700'
                          }
                        >
                          {getListingTypeLabel(listing)}
                        </span>

                        <StatusBadge status={status} />
                      </div>

                      <p className="mt-1 text-sm text-stone-600">
                        Added{' '}
                        {new Date(listing.created_at).toLocaleDateString(
                          'en-GB'
                        )}
                      </p>
                    </div>

                    <Link
                      href={getManageLink(listing)}
                      className="rounded-full bg-stone-900 px-4 py-2 text-center text-sm font-bold text-white hover:bg-red-800"
                    >
                      Manage
                    </Link>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

function AdminActionCard({
  href,
  eyebrow,
  title,
  description,
}: {
  href: string
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-xl font-bold text-stone-950">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-stone-700">
        {description}
      </p>
    </Link>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  const styles: Record<
    string,
    {
      border: string
      text: string
      value: string
      bg: string
    }
  > = {
    'Total listings': {
      border: 'border-stone-200',
      text: 'text-stone-700',
      value: 'text-stone-950',
      bg: 'bg-white',
    },
    Businesses: {
      border: 'border-blue-200',
      text: 'text-blue-700',
      value: 'text-blue-900',
      bg: 'bg-blue-50',
    },
    'Local amenities': {
      border: 'border-red-200',
      text: 'text-red-700',
      value: 'text-red-900',
      bg: 'bg-red-50',
    },
    'Pending businesses': {
      border: 'border-amber-200',
      text: 'text-amber-700',
      value: 'text-amber-900',
      bg: 'bg-amber-50',
    },
    'Pending amenities': {
      border: 'border-orange-200',
      text: 'text-orange-700',
      value: 'text-orange-900',
      bg: 'bg-orange-50',
    },
    Approved: {
      border: 'border-green-200',
      text: 'text-green-700',
      value: 'text-green-900',
      bg: 'bg-green-50',
    },
    Rejected: {
      border: 'border-red-200',
      text: 'text-red-700',
      value: 'text-red-900',
      bg: 'bg-red-50',
    },
    Featured: {
      border: 'border-purple-200',
      text: 'text-purple-700',
      value: 'text-purple-900',
      bg: 'bg-purple-50',
    },
    Premium: {
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      value: 'text-indigo-900',
      bg: 'bg-indigo-50',
    },
  }

  const style = styles[label] || styles['Total listings']

  return (
    <div
      className={`rounded-2xl border ${style.border} ${style.bg} px-5 py-4 shadow-sm`}
    >
      <p className={`text-xs font-bold uppercase tracking-wide ${style.text}`}>
        {label}
      </p>

      <p className={`mt-2 text-3xl font-bold ${style.value}`}>
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  )
}