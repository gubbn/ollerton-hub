'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Review = {
  id: string
  business_id: string
  reviewer_name: string | null
  reviewer_email: string | null
  rating: number | null
  review_text: string | null
  is_approved: boolean | null
  created_at: string
  businesses: {
    business_name: string
  } | null
}

export default function AdminReviewsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    async function loadReviews() {
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
        .from('reviews')
        .select(`
          id,
          business_id,
          reviewer_name,
          reviewer_email,
          rating,
          review_text,
          is_approved,
          created_at,
          businesses (
            business_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setReviews((data as Review[]) || [])
      }

      setLoading(false)
    }

    loadReviews()
  }, [router])

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (filter === 'all') return true
      if (filter === 'approved') return review.is_approved === true
      return review.is_approved !== true
    })
  }, [reviews, filter])

  async function approveReview(reviewId: string) {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', reviewId)

    if (error) {
      setError(error.message)
      return
    }

    setReviews((current) =>
      current.map((review) =>
        review.id === reviewId ? { ...review, is_approved: true } : review
      )
    )
  }

  async function unapproveReview(reviewId: string) {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: false })
      .eq('id', reviewId)

    if (error) {
      setError(error.message)
      return
    }

    setReviews((current) =>
      current.map((review) =>
        review.id === reviewId ? { ...review, is_approved: false } : review
      )
    )
  }

  async function deleteReview(reviewId: string) {
    const confirmed = window.confirm('Delete this review? This cannot be undone.')

    if (!confirmed) return

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      setError(error.message)
      return
    }

    setReviews((current) => current.filter((review) => review.id !== reviewId))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <p className="text-gray-700">Loading reviews...</p>
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
              Review Moderation
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Showing {filteredReviews.length} of {reviews.length} reviews.
            </p>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border bg-white p-3 text-gray-900"
          >
            <option value="pending">Pending reviews</option>
            <option value="approved">Approved reviews</option>
            <option value="all">All reviews</option>
          </select>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 grid gap-4">
          {filteredReviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl bg-white p-5 shadow"
            >
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {review.businesses?.business_name || 'Unknown business'}
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    {review.reviewer_name || 'Anonymous'} · Rating:{' '}
                    {review.rating || '—'} / 5
                  </p>

                  {review.reviewer_email && (
                    <p className="mt-1 text-xs text-gray-500">
                      {review.reviewer_email}
                    </p>
                  )}
                </div>

                <span
                  className={`h-fit rounded-full px-3 py-1 text-xs font-medium ${
                    review.is_approved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {review.is_approved ? 'Approved' : 'Pending'}
                </span>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm text-gray-800">
                {review.review_text || 'No review text.'}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {!review.is_approved && (
                  <button
                    onClick={() => approveReview(review.id)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Approve
                  </button>
                )}

                {review.is_approved && (
                  <button
                    onClick={() => unapproveReview(review.id)}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Unapprove
                  </button>
                )}

                <button
                  onClick={() => deleteReview(review.id)}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}

          {filteredReviews.length === 0 && !error && (
            <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow">
              No reviews found.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}