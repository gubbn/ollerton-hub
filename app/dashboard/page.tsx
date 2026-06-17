'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  business_name: string
  slug: string
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  is_premium: boolean | null
  has_pending_changes: boolean | null
  pending_changed_fields: string[] | null
  changes_submitted_at: string | null
  change_rejection_reason: string | null
}

type BusinessStat = {
  event_type: string
}

type Stats = {
  profile_view: number
  website_click: number
  phone_click: number
  email_click: number
  facebook_click: number
  instagram_click: number
}

const emptyStats: Stats = {
  profile_view: 0,
  website_click: 0,
  phone_click: 0,
  email_click: 0,
  facebook_click: 0,
  instagram_click: 0,
}

function formatDate(value: string | null) {
  if (!value) return null

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getApprovalLabel(business: Business) {
  if (business.status === 'rejected') return 'Rejected listing'
  if (business.status === 'approved' || business.is_approved === true) {
    return 'Approved listing'
  }

  return 'Awaiting approval'
}

function getApprovalBadgeClasses(business: Business) {
  if (business.status === 'rejected') {
    return 'bg-red-100 text-red-800'
  }

  if (business.status === 'approved' || business.is_approved === true) {
    return 'bg-green-100 text-green-800'
  }

  return 'bg-amber-100 text-amber-800'
}

export default function DashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<Business | null>(null)
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const [profileResult, businessResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle(),

      supabase
        .from('businesses')
        .select(
          `
          id,
          business_name,
          slug,
          status,
          is_approved,
          is_featured,
          is_premium,
          has_pending_changes,
          pending_changed_fields,
          changes_submitted_at,
          change_rejection_reason
        `
        )
        .eq('owner_id', user.id)
        .neq('listing_type', 'community')
        .maybeSingle(),
    ])

    if (profileResult.error) {
      setError(profileResult.error.message)
      setLoading(false)
      return
    }

    if (businessResult.error) {
      setError(businessResult.error.message)
      setLoading(false)
      return
    }

    setIsAdmin(profileResult.data?.is_admin === true)

    if (businessResult.data) {
      const loadedBusiness = businessResult.data as Business
      setBusiness(loadedBusiness)

      // Keep loading stats for all businesses.
      // Only Premium users see the numbers on the dashboard.
      await loadStats(loadedBusiness.id)
    } else {
      setBusiness(null)
      setStats(emptyStats)
    }

    setLoading(false)
  }

  async function loadStats(businessId: string) {
    const { data } = await supabase
      .from('business_stats')
      .select('event_type')
      .eq('business_id', businessId)

    const statsData = (data as BusinessStat[] | null) ?? []

    const nextStats: Stats = { ...emptyStats }

    statsData.forEach((item) => {
      if (item.event_type in nextStats) {
        nextStats[item.event_type as keyof Stats] += 1
      }
    })

    setStats(nextStats)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-5xl">
          <p>Loading dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-stone-900 p-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
                Business dashboard
              </p>

              <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>

              <p className="mt-3 max-w-2xl text-stone-200">
                Manage your Ollerton Hub listing, update your business details
                and access listing tools.
              </p>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              Sign out
            </button>
          </div>

          {business ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <span
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${getApprovalBadgeClasses(
                  business
                )}`}
              >
                {getApprovalLabel(business)}
              </span>

              {business.has_pending_changes ? (
                <span className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
                  Changes awaiting review
                </span>
              ) : null}

              {business.is_featured ? (
                <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-stone-900">
                  Featured listing
                </span>
              ) : null}

              {business.is_premium ? (
                <span className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-800">
                  Premium listing
                </span>
              ) : null}
            </div>
          ) : null}
        </section>

        {error ? (
          <section className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </section>
        ) : null}

        {business?.has_pending_changes ? (
          <section className="rounded-2xl bg-blue-50 p-5 shadow-sm ring-1 ring-blue-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Changes awaiting review
                </p>

                <h2 className="mt-1 text-lg font-bold text-blue-950">
                  Your current approved listing is still live
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-900">
                  Some of your recent edits need to be reviewed before they
                  appear publicly. Your existing approved listing will stay live
                  while those changes are checked.
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-blue-900">
                  {business.pending_changed_fields?.length ? (
                    <span className="rounded-full bg-white px-3 py-1 ring-1 ring-blue-200">
                      {business.pending_changed_fields.length} field
                      {business.pending_changed_fields.length === 1
                        ? ''
                        : 's'}{' '}
                      awaiting review
                    </span>
                  ) : null}

                  {business.changes_submitted_at ? (
                    <span className="rounded-full bg-white px-3 py-1 ring-1 ring-blue-200">
                      Submitted {formatDate(business.changes_submitted_at)}
                    </span>
                  ) : null}
                </div>
              </div>

              <Link
                href="/dashboard/business"
                className="inline-flex justify-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                View edits
              </Link>
            </div>
          </section>
        ) : null}

        {business?.change_rejection_reason ? (
          <section className="rounded-2xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Previous change note
            </p>

            <h2 className="mt-1 text-lg font-bold text-amber-950">
              Admin note about your last submitted changes
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-900">
              {business.change_rejection_reason}
            </p>
          </section>
        ) : null}

        {business ? (
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Listing performance
                </p>

                <h2 className="mt-1 text-lg font-bold text-stone-900">
                  {business.business_name}
                </h2>
              </div>

              {business.is_approved ? (
                <Link
                  href={`/business/${business.slug}`}
                  className="text-sm font-medium text-red-700 hover:underline"
                >
                  View public listing →
                </Link>
              ) : null}
            </div>

            {business.is_premium ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                  <MiniStat label="Views" value={stats.profile_view} />
                  <MiniStat label="Website" value={stats.website_click} />
                  <MiniStat label="Calls" value={stats.phone_click} />
                  <MiniStat label="Emails" value={stats.email_click} />
                  <MiniStat label="Facebook" value={stats.facebook_click} />
                  <MiniStat label="Instagram" value={stats.instagram_click} />
                </div>

                <p className="mt-4 text-xs text-stone-500">
                  These stats show how visitors are interacting with your public
                  business listing.
                </p>
              </>
            ) : (
              <LockedMetrics isFeatured={business.is_featured === true} />
            )}
          </section>
        ) : null}

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title={
              business ? 'Edit business listing' : 'Create business listing'
            }
            description={
              business
                ? business.has_pending_changes
                  ? 'Review your submitted edits, update safe contact details, or make further changes to your listing.'
                  : 'Update your business details, logo, opening times and contact information.'
                : 'Add your business to Ollerton Hub so local people can find you.'
            }
            href="/dashboard/business"
            buttonText={business ? 'Edit business' : 'Create listing'}
          />

          <DashboardCard
            title="View the directory"
            description="See how your business appears alongside other local listings."
            href="/directory"
            buttonText="Show directory"
          />

          {isAdmin ? (
            <DashboardCard
              title="Admin centre"
              description="Manage businesses, local amenities, reviews, settings and directory moderation."
              href="/admin"
              buttonText="Open admin centre"
              admin
            />
          ) : null}
        </section>

        {!business ? (
          <section className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
            <h2 className="text-lg font-bold text-amber-900">
              No business listing yet
            </h2>

            <p className="mt-2 text-sm text-amber-800">
              Create your listing first. Once approved, your business can appear
              in the public directory.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  )
}

function LockedMetrics({ isFeatured }: { isFeatured: boolean }) {
  return (
    <div className="mt-4 rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Premium metrics
            </p>

            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white">
              Locked
            </span>
          </div>

          <h3 className="mt-2 text-xl font-bold text-stone-950">
            Unlock activity stats with Premium
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            {isFeatured
              ? 'Metrics are included with Premium. Upgrade from Featured to Premium to see profile views, website clicks, phone clicks, email clicks and social clicks.'
              : 'Metrics are available on Premium listings. Upgrade to see profile views, website clicks, phone clicks, email clicks and social clicks.'}
          </p>
        </div>

        <Link
          href="/contact"
          className="inline-flex justify-center rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
        >
          Ask about Premium
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <LockedStat label="Views" />
        <LockedStat label="Website" />
        <LockedStat label="Calls" />
        <LockedStat label="Emails" />
        <LockedStat label="Facebook" />
        <LockedStat label="Instagram" />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-stone-50 px-3 py-3 text-center ring-1 ring-stone-200">
      <p className="text-xl font-bold text-stone-900">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{label}</p>
    </div>
  )
}

function LockedStat({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-3 text-center opacity-70 ring-1 ring-stone-200">
      <p className="text-xl font-bold text-stone-400">—</p>
      <p className="mt-1 text-xs text-stone-500">{label}</p>
    </div>
  )
}

function DashboardCard({
  title,
  description,
  href,
  buttonText,
  admin = false,
}: {
  title: string
  description: string
  href: string
  buttonText: string
  admin?: boolean
}) {
  return (
    <div
      className={`rounded-3xl p-6 shadow-sm ring-1 ${
        admin ? 'bg-red-50 ring-red-200' : 'bg-white ring-stone-200'
      }`}
    >
      <h2 className="text-xl font-bold text-stone-900">{title}</h2>

      <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>

      <Link
        href={href}
        className={`mt-5 inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white ${
          admin ? 'bg-stone-900 hover:bg-stone-800' : 'bg-red-700 hover:bg-red-800'
        }`}
      >
        {buttonText}
      </Link>
    </div>
  )
}
