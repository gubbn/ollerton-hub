'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  business_name: string
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  is_premium: boolean | null
  created_at: string
}

function getBusinessStatus(business: Business) {
  if (business.status === 'rejected') return 'rejected'
  if (business.is_approved === true) return 'approved'
  return 'pending'
}

export default function AdminPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<Business[]>([])
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

      const { data, error: businessesError } = await supabase
        .from('businesses')
        .select(`
          id,
          business_name,
          status,
          is_approved,
          is_featured,
          is_premium,
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

    loadAdminData()
  }, [router])

  const stats = useMemo(() => {
    const pending = businesses.filter(
      (business) => getBusinessStatus(business) === 'pending'
    )

    const approved = businesses.filter(
      (business) => getBusinessStatus(business) === 'approved'
    )

    const rejected = businesses.filter(
      (business) => getBusinessStatus(business) === 'rejected'
    )

    const featured = businesses.filter(
      (business) => business.is_featured === true
    )

    const premium = businesses.filter(
      (business) => business.is_premium === true
    )

    return {
      total: businesses.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      featured: featured.length,
      premium: premium.length,
    }
  }, [businesses])

  const recentBusinesses = businesses.slice(0, 5)

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <p className="text-gray-700">Loading admin dashboard...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage business submissions, approvals and directory visibility.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total businesses" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Rejected" value={stats.rejected} />
          <StatCard label="Featured" value={stats.featured} />
          <StatCard label="Premium" value={stats.premium} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/businesses"
            className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900">
              Manage Businesses
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Approve, reject, feature or manage premium listings.
            </p>
          </Link>

          <Link
            href="/"
            className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900">
              View Public Site
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Return to the live directory homepage.
            </p>
          </Link>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-900">
            Recent businesses
          </h2>

          <div className="mt-4 space-y-3">
            {recentBusinesses.map((business) => (
              <div
                key={business.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {business.business_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {getBusinessStatus(business)}
                  </p>
                </div>

                <Link
                  href={`/admin/businesses/${business.id}`}
                  className="text-sm font-medium text-red-700 hover:underline"
                >
                  Manage
                </Link>
              </div>
            ))}

            {recentBusinesses.length === 0 && (
              <p className="text-sm text-gray-500">
                No businesses have been submitted yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
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
    }
  > = {
    Pending: {
      border: 'border-amber-200',
      text: 'text-amber-700',
      value: 'text-amber-800',
    },
    Approved: {
      border: 'border-green-200',
      text: 'text-green-700',
      value: 'text-green-800',
    },
    Rejected: {
      border: 'border-red-200',
      text: 'text-red-700',
      value: 'text-red-800',
    },
    Featured: {
      border: 'border-blue-200',
      text: 'text-blue-700',
      value: 'text-blue-800',
    },
    Premium: {
      border: 'border-purple-200',
      text: 'text-purple-700',
      value: 'text-purple-800',
    },
    'Total businesses': {
      border: 'border-gray-200',
      text: 'text-gray-700',
      value: 'text-gray-900',
    },
  }

  const style = styles[label] || styles['Total businesses']

  return (
    <div
      className={`rounded-xl border ${style.border} bg-white px-4 py-3 shadow-sm`}
    >
      <p className={`text-xs font-medium uppercase tracking-wide ${style.text}`}>
        {label}
      </p>

      <p className={`mt-1 text-2xl font-bold ${style.value}`}>
        {value}
      </p>
    </div>
  )
}