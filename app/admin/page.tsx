'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { expireOldPaidListings } from '@/lib/expirePaidListings'

type Business = {
  id: string
  business_name: string
  slug: string
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  listing_type: string | null
  useful_listing_type: string | null
  town: string | null
  created_at: string | null
}

type BusinessStat = {
  event_type: string
}

type ContactRequest = {
  id: string
  status: string | null
}

type Review = {
  id: string
  is_approved: boolean | null
}

function getListingStatus(listing: Business) {
  if (listing.status === 'rejected') return 'rejected'
  if (listing.status === 'approved') return 'approved'
  if (listing.is_approved === true) return 'approved'
  return 'pending'
}

function isBusinessListing(listing: Business) {
  return (
    listing.listing_type !== 'community' &&
    listing.listing_type !== 'local_info'
  )
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)

  d.setDate(diff)
  d.setHours(0, 0, 0, 0)

  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatDate(value: string | null) {
  if (!value) return 'Unknown date'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AdminPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [stats, setStats] = useState<BusinessStat[]>([])
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    loadAdmin()
  }, [])

  async function loadAdmin() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)

    await expireOldPaidListings()

    const [
      businessesResult,
      statsResult,
      contactRequestsResult,
      reviewsResult,
    ] = await Promise.all([
      supabase
        .from('businesses')
        .select(
          'id, business_name, slug, status, is_approved, is_featured, listing_type, useful_listing_type, town, created_at'
        )
        .order('created_at', { ascending: false }),

      supabase.from('business_stats').select('event_type'),

      supabase.from('contact_requests').select('id, status'),

      supabase.from('reviews').select('id, is_approved'),
    ])

    if (businessesResult.data) {
      setBusinesses(businessesResult.data as Business[])
    }

    if (statsResult.data) {
      setStats(statsResult.data as BusinessStat[])
    }

    if (contactRequestsResult.data) {
      setContactRequests(contactRequestsResult.data as ContactRequest[])
    }

    if (reviewsResult.data) {
      setReviews(reviewsResult.data as Review[])
    }

    setLoading(false)
  }

  const adminStats = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)

    const businessListings = businesses.filter(isBusinessListing)

    const pendingBusinesses = businessListings.filter(
      (business) => getListingStatus(business) === 'pending'
    )

    const approvedBusinesses = businessListings.filter(
      (business) => getListingStatus(business) === 'approved'
    )

    const rejectedBusinesses = businessListings.filter(
      (business) => getListingStatus(business) === 'rejected'
    )

    const featuredBusinesses = businessListings.filter(
      (business) => business.is_featured === true
    )

    const signedUpThisWeek = businessListings.filter((business) => {
      if (!business.created_at) return false
      return new Date(business.created_at) >= weekStart
    })

    const signedUpThisMonth = businessListings.filter((business) => {
      if (!business.created_at) return false
      return new Date(business.created_at) >= monthStart
    })

    const countStat = (eventType: string) =>
      stats.filter((stat) => stat.event_type === eventType).length

    const newContactRequests = contactRequests.filter(
      (request) => request.status === 'new' || !request.status
    )

    const pendingReviews = reviews.filter(
      (review) => review.is_approved !== true
    )

    return {
      businessListings,
      pendingBusinesses,
      approvedBusinesses,
      rejectedBusinesses,
      featuredBusinesses,
      signedUpThisWeek,
      signedUpThisMonth,
      newContactRequests,
      pendingReviews,
      profileViews: countStat('profile_view'),
      websiteClicks: countStat('website_click'),
      phoneClicks: countStat('phone_click'),
      emailClicks: countStat('email_click'),
      facebookClicks: countStat('facebook_click'),
      instagramClicks: countStat('instagram_click'),
    }
  }, [businesses, stats, contactRequests, reviews])

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-stone-600">Loading admin centre...</p>
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
        <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Admin centre
            </p>

            <h1 className="mt-2 text-3xl font-bold text-stone-950">
              Ollerton Hub admin
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Review new businesses, check site activity and manage the main
              admin areas from one place.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            Return to the hub
          </Link>
        </header>

        <section className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                Needs attention
              </p>

              <h2 className="mt-1 text-2xl font-bold text-stone-950">
                Pending businesses
              </h2>

              <p className="mt-2 text-sm text-stone-700">
                These are business listings waiting for approval. Local
                amenities are not shown here because they are admin-entered.
              </p>
            </div>

            <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
              <p className="text-4xl font-bold text-amber-700">
                {adminStats.pendingBusinesses.length}
              </p>

              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Waiting
              </p>
            </div>
          </div>

          {adminStats.pendingBusinesses.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-white p-5 text-sm text-stone-600 shadow-sm">
              No pending businesses at the moment.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {adminStats.pendingBusinesses.slice(0, 6).map((business) => (
                <article
                  key={business.id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-950">
                        {business.business_name}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
                          Pending
                        </span>

                        {business.is_featured ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-sm text-stone-600">
                        {business.town || 'No town added'} · Submitted{' '}
                        {formatDate(business.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/businesses/${business.id}`}
                      className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                    >
                      Review listing
                    </Link>

                    <Link
                      href={`/business/${business.slug}`}
                      className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
                    >
                      View public page
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {adminStats.pendingBusinesses.length > 6 ? (
            <div className="mt-5">
              <Link
                href="/admin/businesses?status=pending"
                className="text-sm font-semibold text-amber-800 underline underline-offset-4"
              >
                View all pending businesses
              </Link>
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            label="Signed up this week"
            value={adminStats.signedUpThisWeek.length}
          />

          <AdminStatCard
            label="Signed up this month"
            value={adminStats.signedUpThisMonth.length}
          />

          <AdminStatCard
            label="Total businesses"
            value={adminStats.businessListings.length}
          />

          <AdminStatCard
            label="Featured businesses"
            value={adminStats.featuredBusinesses.length}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AdminActionCard
            title="Manage businesses"
            description="Approve, reject, feature or edit business listings."
            href="/admin/businesses"
            badge={`${adminStats.pendingBusinesses.length} pending`}
          />

          <AdminActionCard
            title="Reviews"
            description="Approve or manage customer reviews left on business profiles."
            href="/admin/reviews"
            badge={`${adminStats.pendingReviews.length} pending`}
          />

          <AdminActionCard
            title="Contact requests"
            description="View Featured listing, advert, listing report and general enquiries."
            href="/admin/contact-requests"
            badge={`${adminStats.newContactRequests.length} new`}
          />

          <AdminActionCard
            title="Site settings"
            description="Update homepage text, contact details and general site settings."
            href="/admin/settings"
          />

          <AdminActionCard
            title="Directory"
            description="Check how businesses and local information appear publicly."
            href="/directory"
          />

          <AdminActionCard
            title="Local amenities"
            description="Add and amend schools, places of worship, council services and other useful local information."
            href="/admin/amenities"
          />
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-stone-950">
              Platform activity
            </h2>

            <p className="mt-1 text-xs text-stone-500">
              Combined activity across all business listings.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MiniStatCard
              label="Profile views"
              value={adminStats.profileViews}
            />

            <MiniStatCard
              label="Website clicks"
              value={adminStats.websiteClicks}
            />

            <MiniStatCard label="Calls" value={adminStats.phoneClicks} />

            <MiniStatCard
              label="Email clicks"
              value={adminStats.emailClicks}
            />

            <MiniStatCard label="Facebook" value={adminStats.facebookClicks} />

            <MiniStatCard
              label="Instagram"
              value={adminStats.instagramClicks}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

function AdminStatCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-3xl font-bold text-stone-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-stone-600">{label}</p>
    </div>
  )
}

function MiniStatCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl bg-stone-50 px-4 py-3">
      <p className="text-xl font-bold text-stone-950">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-stone-500">{label}</p>
    </div>
  )
}

function AdminActionCard({
  title,
  description,
  href,
  badge,
}: {
  title: string
  description: string
  href: string
  badge?: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold text-stone-950">{title}</h2>

        {badge ? (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
            {badge}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>

      <p className="mt-5 text-sm font-semibold text-emerald-700 group-hover:underline">
        Open
      </p>
    </Link>
  )
}