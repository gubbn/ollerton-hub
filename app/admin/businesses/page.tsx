'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  business_name: string
  slug: string
  town: string | null
  status: string | null
  is_featured: boolean | null
}

export default function AdminBusinessesPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [error, setError] = useState('')

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
        .select('id, business_name, slug, town, status, is_featured')
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

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Manage Businesses
        </h1>

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
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {businesses.map((business) => (
                <tr key={business.id} className="border-t">
                  <td className="p-4 font-medium text-gray-900">
                    {business.business_name}
                  </td>

                  <td className="p-4 text-gray-700">
                    {business.town || '—'}
                  </td>

                  <td className="p-4 text-gray-700">
                    {business.status || 'pending'}
                  </td>

                  <td className="p-4 text-gray-700">
                    {business.is_featured ? 'Yes' : 'No'}
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

              {businesses.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    No businesses found.
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