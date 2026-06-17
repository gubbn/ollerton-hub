'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  business_name: string
  slug: string
  listing_type: string | null
  useful_listing_type: string | null
}

function settingEnabled(value: string | null | undefined) {
  return value !== 'false'
}

function isCommunityListing(business: Business) {
  return business.listing_type === 'community'
}

function getListingTypeLabel(business: Business) {
  if (isCommunityListing(business)) {
    return business.useful_listing_type || 'Local amenity'
  }

  return 'Business'
}

export default function ReviewPage() {
  const params = useParams()
  const slug = params.slug as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [reviewModeration, setReviewModeration] = useState(true)

  const [reviewerName, setReviewerName] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadPage() {
      setLoading(true)
      setError('')

      const [{ data: businessData }, { data: settingData }] =
        await Promise.all([
          supabase
            .from('businesses')
            .select(
              `
              id,
              business_name,
              slug,
              listing_type,
              useful_listing_type
            `
            )
            .eq('slug', slug)
            .eq('is_approved', true)
            .single(),

          supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', 'review_moderation')
            .single(),
        ])

      setBusiness(businessData as Business | null)
      setReviewModeration(settingEnabled(settingData?.setting_value))
      setLoading(false)
    }

    loadPage()
  }, [slug])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!business) return

    setSaving(true)
    setMessage('')
    setError('')

    if (isCommunityListing(business)) {
      setError('Reviews are disabled for local amenities.')
      setSaving(false)
      return
    }

    if (!reviewerName.trim()) {
      setError('Please enter your name.')
      setSaving(false)
      return
    }

    if (!reviewText.trim()) {
      setError('Please enter your review.')
      setSaving(false)
      return
    }

    const shouldAutoApprove = !reviewModeration

    const { error: insertError } = await supabase.from('reviews').insert({
      business_id: business.id,
      reviewer_name: reviewerName.trim(),
      reviewer_email: reviewerEmail.trim() || null,
      rating,
      review_text: reviewText.trim(),
      is_approved: shouldAutoApprove,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setReviewerName('')
      setReviewerEmail('')
      setRating(5)
      setReviewText('')

      setMessage(
        shouldAutoApprove
          ? 'Review submitted. Thank you for sharing your experience.'
          : 'Review submitted. It will appear once approved.'
      )
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
          Loading...
        </div>
      </main>
    )
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
          <h1 className="text-2xl font-bold text-stone-950">
            Listing not found
          </h1>

          <p className="mt-3 text-stone-700">
            This listing may have been removed or is not currently approved.
          </p>

          <Link
            href="/directory"
            className="mt-5 inline-flex rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800"
          >
            Back to directory
          </Link>
        </div>
      </main>
    )
  }

  if (isCommunityListing(business)) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
        <div className="mx-auto max-w-xl">
          <Link
            href={`/business/${business.slug}`}
            className="font-semibold text-stone-900 underline"
          >
            Back to listing
          </Link>

          <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
              {getListingTypeLabel(business)}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-stone-950">
              Reviews are disabled
            </h1>

            <p className="mt-3 leading-7 text-stone-700">
              {business.business_name} is included on Ollerton Hub as useful
              local information rather than as a business listing, so reviews
              are not collected here.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/business/${business.slug}`}
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800"
              >
                Back to listing
              </Link>

              <Link
                href={`/contact?subject=Report Listing&business=${business.slug}`}
                className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-50"
              >
                Suggest an update
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-xl">
        <Link
          href={`/business/${business.slug}`}
          className="font-semibold text-stone-900 underline"
        >
          Back to business
        </Link>

        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Business review
          </p>

          <h1 className="mt-2 text-3xl font-bold text-stone-950">
            Leave a review
          </h1>

          <p className="mt-2 text-stone-700">
            Share your experience with {business.business_name}.
          </p>

          {reviewModeration ? (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Reviews are checked before appearing publicly.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block font-semibold">Your name</label>
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                value={reviewerName}
                onChange={(event) => setReviewerName(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Email address{' '}
                <span className="font-normal text-stone-500">
                  (not public)
                </span>
              </label>
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                type="email"
                value={reviewerEmail}
                onChange={(event) => setReviewerEmail(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">Rating</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 focus:border-stone-900 focus:outline-none"
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
              >
                <option value={5}>5 stars</option>
                <option value={4}>4 stars</option>
                <option value={3}>3 stars</option>
                <option value={2}>2 stars</option>
                <option value={1}>1 star</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">Review</label>
              <textarea
                className="min-h-32 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {saving ? 'Submitting...' : 'Submit review'}
            </button>
          </form>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}