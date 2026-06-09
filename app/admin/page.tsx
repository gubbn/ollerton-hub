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
  is_featured: boolean
  created_at: string
}

type Review = {
  id: string
  business_id: string
  reviewer_name: string
  rating: number
  review_text: string
  is_approved: boolean
  created_at: string
  businesses: {
    business_name: string
    slug: string
  } | null
}

export default function AdminPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
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

      await Promise.all([loadBusinesses(), loadReviews()])
      setLoading(false)
    }

    loadAdmin()
  }, [router])

  async function loadBusinesses() {
    const { data, error } = await supabase
      .from('businesses')
      .select(
        'id, business_name, slug, description, town, is_approved, is_featured, created_at'
      )
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setBusinesses((data as Business[]) ?? [])
  }

  async function loadReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        business_id,
        reviewer_name,
        rating,
        review_text,
        is_approved,
        created_at,
        businesses (
          business_name,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setReviews((data as Review[]) ?? [])
  }

  async function updateBusiness(
    id: string,
    changes: Partial<Pick<Business, 'is_approved' | 'is_featured'>>
  ) {
    setMessage('')

    const { error } = await supabase
      .from('businesses')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadBusinesses()
  }

  async function updateReview(id: string, approved: boolean) {
    setMessage('')

    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: approved })
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadReviews()
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
          <h1 className="text-3xl font-bold">Admin area</h1>
          <p className="mt-2 text-stone-700">
            Approve businesses, feature listings and moderate public reviews.
          </p>

          {message && <p className="mt-4 text-sm text-red-700">{message}</p>}
        </div>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
          <h2 className="text-2xl font-bold">Business approvals</h2>

          <div className="mt-6 space-y-4">
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

                      <h3 className="mt-1 text-xl font-bold">
                        {business.business_name}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm text-stone-700">
                        {business.description ?? 'No description added.'}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <span
                          className={
                            business.is_approved
                              ? 'rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800'
                              : 'rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800'
                          }
                        >
                          {business.is_approved ? 'Approved' : 'Pending'}
                        </span>

                        {business.is_featured && (
                          <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-800">
                            Featured
                          </span>
                        )}
                      </div>

                      {business.is_approved && (
                        <Link
                          href={`/business/${business.slug}`}
                          className="mt-3 inline-block text-sm font-semibold underline"
                        >
                          View public page
                        </Link>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3">
                      <button
                        onClick={() =>
                          updateBusiness(business.id, {
                            is_approved: !business.is_approved,
                          })
                        }
                        className="rounded-xl bg-stone-900 px-4 py-2 font-semibold text-white hover:bg-stone-700"
                      >
                        {business.is_approved ? 'Unapprove' : 'Approve'}
                      </button>

                      <button
                        onClick={() =>
                          updateBusiness(business.id, {
                            is_featured: !business.is_featured,
                          })
                        }
                        className="rounded-xl bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800"
                      >
                        {business.is_featured ? 'Unfeature' : 'Feature'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-stone-700">No businesses submitted yet.</p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
          <h2 className="text-2xl font-bold">Review moderation</h2>

          <div className="mt-6 space-y-4">
            {reviews.length ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-stone-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <p className="text-sm font-semibold text-stone-500">
                        {review.businesses?.business_name ?? 'Unknown business'}
                      </p>

                      <h3 className="mt-1 text-lg font-bold">
                        {review.reviewer_name}
                      </h3>

                      <p className="mt-1 text-sm text-amber-600">
                        {'⭐'.repeat(review.rating)}
                      </p>

                      <p className="mt-3 text-sm text-stone-700">
                        {review.review_text}
                      </p>

                      <span
                        className={
                          review.is_approved
                            ? 'mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800'
                            : 'mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800'
                        }
                      >
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3">
                      <button
                        onClick={() =>
                          updateReview(review.id, !review.is_approved)
                        }
                        className="rounded-xl bg-stone-900 px-4 py-2 font-semibold text-white hover:bg-stone-700"
                      >
                        {review.is_approved ? 'Unapprove' : 'Approve'}
                      </button>

                      {review.businesses?.slug && (
                        <Link
                          href={`/business/${review.businesses.slug}`}
                          className="rounded-xl border border-stone-300 px-4 py-2 font-semibold hover:bg-stone-100"
                        >
                          View business
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-stone-700">No reviews submitted yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}