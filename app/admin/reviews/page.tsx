'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type BusinessRelation =
  | {
      business_name: string
      slug: string
      listing_type: string | null
      useful_listing_type: string | null
    }
  | {
      business_name: string
      slug: string
      listing_type: string | null
      useful_listing_type: string | null
    }[]
  | null

type Review = {
  id: string
  business_id: string
  reviewer_name: string | null
  reviewer_email: string | null
  rating: number | null
  review_text: string | null
  is_approved: boolean | null
  created_at: string
  businesses: BusinessRelation
}

function getBusiness(review: Review) {
  if (!review.businesses) return null
  if (Array.isArray(review.businesses)) return review.businesses[0] ?? null
  return review.businesses
}

function getBusinessName(review: Review) {
  return getBusiness(review)?.business_name ?? 'Unknown listing'
}

function getBusinessSlug(review: Review) {
  return getBusiness(review)?.slug ?? ''
}

function isCommunityReview(review: Review) {
  return getBusiness(review)?.listing_type === 'community'
}

function getReviewStatus(review: Review) {
  return review.is_approved === true ? 'approved' : 'pending'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminReviewsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    setLoading(true)
    setError('')
    setMessage('')

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

    await loadReviews()
    setLoading(false)
  }

  async function loadReviews() {
    const { data, error: reviewsError } = await supabase
      .from('reviews')
      .select(
        `
        id,
        business_id,
        reviewer_name,
        reviewer_email,
        rating,
        review_text,
        is_approved,
        created_at,
        businesses (
          business_name,
          slug,
          listing_type,
          useful_listing_type
        )
      `
      )
      .order('created_at', { ascending: false })

    if (reviewsError) {
      setError(reviewsError.message)
      setReviews([])
      return
    }

    const loadedReviews = ((data ?? []) as Review[]).filter(
      (review) => !isCommunityReview(review)
    )

    setReviews(loadedReviews)
  }

  const stats = useMemo(() => {
    const pending = reviews.filter((review) => review.is_approved !== true)
    const approved = reviews.filter((review) => review.is_approved === true)

    return {
      total: reviews.length,
      pending: pending.length,
      approved: approved.length,
    }
  }, [reviews])

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (filter === 'all') return true
      if (filter === 'approved') return review.is_approved === true
      return review.is_approved !== true
    })
  }, [reviews, filter])

  async function approveReview(reviewId: string) {
    setError('')
    setMessage('')
    setSavingId(reviewId)

    const { data, error: updateError } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', reviewId)
      .select('id, is_approved')
      .single()

    if (updateError) {
      setError(updateError.message)
      setSavingId(null)
      return
    }

    if (data?.is_approved !== true) {
      setError('The review was not approved. Please check review RLS policies.')
      setSavingId(null)
      return
    }

    setMessage('Review approved.')
    await loadReviews()
    setSavingId(null)
  }

  async function unapproveReview(reviewId: string) {
    setError('')
    setMessage('')
    setSavingId(reviewId)

    const { data, error: updateError } = await supabase
      .from('reviews')
      .update({ is_approved: false })
      .eq('id', reviewId)
      .select('id, is_approved')
      .single()

    if (updateError) {
      setError(updateError.message)
      setSavingId(null)
      return
    }

    if (data?.is_approved !== false) {
      setError('The review was not unapproved. Please check review RLS policies.')
      setSavingId(null)
      return
    }

    setMessage('Review moved back to pending.')
    await loadReviews()
    setSavingId(null)
  }

  async function deleteReview(reviewId: string) {
    const confirmed = window.confirm('Delete this review? This cannot be undone.')

    if (!confirmed) return

    setError('')
    setMessage('')
    setSavingId(reviewId)

    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (deleteError) {
      setError(deleteError.message)
      setSavingId(null)
      return
    }

    setMessage('Review deleted.')
    await loadReviews()
    setSavingId(null)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            Loading reviews...
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-red-700 hover:underline"
            >
              ← Back to admin
            </Link>

            <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-red-700">
              Moderation
            </p>

            <h1 className="mt-2 text-3xl font-bold text-stone-950">
              Review moderation
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">
              Approve, unapprove or delete reviews left on business listings.
              Local amenities do not collect reviews.
            </p>
          </div>

          <Link
            href="/directory"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-800 shadow-sm hover:bg-stone-50"
          >
            View directory
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total reviews" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Approved" value={stats.approved} />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            {message}
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-950">
                Reviews
              </h2>

              <p className="mt-1 text-sm text-stone-600">
                Showing {filteredReviews.length} of {reviews.length} reviews.
              </p>
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 outline-none focus:border-red-700"
            >
              <option value="pending">Pending reviews</option>
              <option value="approved">Approved reviews</option>
              <option value="all">All reviews</option>
            </select>
          </div>

          <div className="mt-6 grid gap-4">
            {filteredReviews.length === 0 ? (
              <div className="rounded-2xl bg-stone-50 p-6 text-center text-sm text-stone-600">
                No reviews found.
              </div>
            ) : (
              filteredReviews.map((review) => {
                const status = getReviewStatus(review)
                const businessSlug = getBusinessSlug(review)
                const isSaving = savingId === review.id

                return (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-stone-950">
                            {getBusinessName(review)}
                          </h3>

                          <StatusBadge status={status} />
                        </div>

                        <p className="mt-1 text-xs text-stone-500">
                          Submitted {formatDate(review.created_at)}
                        </p>

                        <p className="mt-3 text-sm text-stone-700">
                          <span className="font-semibold">
                            {review.reviewer_name || 'Anonymous'}
                          </span>{' '}
                          · Rating: {review.rating || '—'} / 5
                        </p>

                        {review.reviewer_email ? (
                          <p className="mt-1 text-xs text-stone-500">
                            {review.reviewer_email}
                          </p>
                        ) : null}

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-800">
                          {review.review_text || 'No review text.'}
                        </p>
                      </div>

                      {businessSlug ? (
                        <Link
                          href={`/business/${businessSlug}`}
                          className="shrink-0 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-800 hover:bg-stone-100"
                        >
                          View listing
                        </Link>
                      ) : null}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {review.is_approved !== true ? (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => approveReview(review.id)}
                          className="rounded-full bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                        >
                          {isSaving ? 'Approving...' : 'Approve'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => unapproveReview(review.id)}
                          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                        >
                          {isSaving ? 'Updating...' : 'Unapprove'}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => deleteReview(review.id)}
                        className="rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                      >
                        {isSaving ? 'Working...' : 'Delete'}
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <p className="text-xs font-bold uppercase tracking-wide text-red-700">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-stone-950">
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
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