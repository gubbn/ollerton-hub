'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  business_name: string
  slug: string
  description: string | null
  town: string | null
  is_approved: boolean
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadAdmin() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      await loadBusinesses()
      setLoading(false)
    }

    loadAdmin()
  }, [router])

  async function loadBusinesses() {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, business_name, slug, description, town, is_approved, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setBusinesses((data as Business[]) ?? [])
  }

  async function toggleApproval(id: string, approved: boolean) {
    setMessage('')

    const { error } = await supabase
      .from('businesses')
      .update({ is_approved: approved, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadBusinesses()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
        Loading admin...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="font-semibold underline">
          Back to dashboard
        </Link>

        <div className="mt-6 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
          <h1 className="text-3xl font-bold">Admin approval</h1>
          <p className="mt-2 text-stone-700">
            Approve businesses before they appear publicly.
          </p>

          {message && <p className="mt-4 text-sm text-red-700">{message}</p>}

          <div className="mt-8 space-y-4">
            {businesses.length ? (
              businesses.map((business) => (
                <div
                  key={business.id}
                  className="rounded-2xl border border-stone-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <p className="text-sm font-semibold text-stone-500">
                        {business.town ?? 'Ollerton'}
                      </p>

                      <h2 className="mt-1 text-xl font-bold">
                        {business.business_name}
                      </h2>

                      <p className="mt-2 line-clamp-2 text-sm text-stone-700">
                        {business.description ?? 'No description added.'}
                      </p>

                      <p className="mt-3 text-sm">
                        Status:{' '}
                        <span
                          className={
                            business.is_approved
                              ? 'font-semibold text-green-700'
                              : 'font-semibold text-amber-700'
                          }
                        >
                          {business.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </p>

                      {business.is_approved && (
                        <Link
                          href={`/business/${business.slug}`}
                          className="mt-3 inline-block text-sm font-semibold underline"
                        >
                          View public page
                        </Link>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-3">
                      {!business.is_approved ? (
                        <button
                          onClick={() => toggleApproval(business.id, true)}
                          className="rounded-xl bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleApproval(business.id, false)}
                          className="rounded-xl bg-stone-700 px-4 py-2 font-semibold text-white hover:bg-stone-800"
                        >
                          Unapprove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-stone-700">No businesses submitted yet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}