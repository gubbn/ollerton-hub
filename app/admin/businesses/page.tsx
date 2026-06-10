'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  business_name: string
  slug: string
  town: string | null
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  is_premium: boolean | null
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

  useEffect(() => {
    async function loadBusinesses() {
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

      const { data, error } = await supabase
        .from('businesses')
        .select(
          'id, business_name, slug, town, status, is_approved, is_featured, is_premium'
        )
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setBusinesses(data || [])
      }

      setLoading(false)
    }

    loadBusinesses()
  }, [router])

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const searchText = `${business.business_name} ${business.town || ''}`.toLowerCase()
      const matchesSearch = searchText.includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'approved'
          ? business.is_approved === true
          : statusFilter === 'pending'
          ? business.status === 'pending' || business.is_approved === false
          : business.status === statusFilter

      const matchesFeatured = featuredOnly ? business.is_featured === true : true
      const matchesPremium = premiumOnly ? business.is_premium === true : true

      return matchesSearch && matchesStatus && matchesFeatured && matchesPremium
    })
  }, [businesses, search, statusFilter, featuredOnly, premiumOnly])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <p className="text-gray-700">Loading businesses...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm text-gray-600 hover:underline">
          ← Back to admin
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Businesses
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Showing {filteredBusinesses.length} of {businesses.length} businesses.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-4 shadow">
          <div className="grid gap-4 md:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business or town..."
              className="rounded-lg border p-3 text-gray-900 md:col-span-2"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border p-3 text-gray-900"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
                setFeaturedOnly(false)
                setPremiumOnly(false)
              }}
              className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white"
            >
              Clear filters
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
              />
              Featured only
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={premiumOnly}
                onChange={(e) => setPremiumOnly(e.target.checked)}
              />
              Premium only
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
                <th className="p-4">Featured</th>
                <th className="p-4">Premium</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBusinesses.map((business) => (
                <tr key={business.id} className="border-t">
                  <td className="p-4 font-medium text-gray-900">
                    {business.business_name}
                  </td>

                  <td className="p-4 text-gray-700">
                    {business.town || '—'}
                  </td>

                  <td className="p-4 text-gray-700">
                    {business.is_approved
                      ? 'approved'
                      : business.status || 'pending'}
                  </td>

                  <td className="p-4 text-gray-700">
                    {business.is_featured ? 'Yes' : 'No'}
                  </td>

                  <td className="p-4 text-gray-700">
                    {business.is_premium ? 'Yes' : 'No'}
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
              ))}

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