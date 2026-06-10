'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Stats = {
  total: number
  pending: number
  approved: number
  featured: number
  premium: number
}

export default function AdminPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    featured: 0,
    premium: 0,
  })

  useEffect(() => {
    async function loadAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/')
        return
      }

      const { count: total } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })

      const { count: pending } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.pending,is_approved.eq.false')

      const { count: approved } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true)

      const { count: featured } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true)

      const { count: premium } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('is_premium', true)

      setStats({
        total: total || 0,
        pending: pending || 0,
        approved: approved || 0,
        featured: featured || 0,
        premium: premium || 0,
      })

      setLoading(false)
    }

    loadAdmin()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <p className="text-gray-700">Loading admin...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Manage approvals, listings and site content.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total businesses" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} highlight />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Featured" value={stats.featured} />
          <StatCard label="Premium" value={stats.premium} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/businesses"
            className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Businesses
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Approve, edit, feature and delete listings.
            </p>
          </Link>

          <Link
            href="/directory"
            className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              View Directory
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Open the public business directory.
            </p>
          </Link>
          <Link
  href="/admin/reviews"
  className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
>
  <h2 className="text-xl font-semibold text-gray-900">
    Manage Reviews
  </h2>
  <p className="mt-2 text-sm text-gray-600">
    Approve, unapprove and delete reviews.
  </p>
</Link>
<Link
  href="/admin/categories"
  className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
>
  <h2 className="text-xl font-semibold text-gray-900">
    Categories
  </h2>
  <p className="mt-2 text-sm text-gray-600">
    Add, edit and remove directory categories.
  </p>
</Link>
        </div>
      </section>
    </main>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow ${
        highlight ? 'bg-green-700 text-white' : 'bg-white text-gray-900'
      }`}
    >
      <p className={highlight ? 'text-sm text-red-100' : 'text-sm text-gray-500'}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  )
}