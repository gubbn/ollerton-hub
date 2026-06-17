'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  business_name: string
  slug: string
  listing_type: string | null
  use_external_reviews: boolean | null
  external_review_platform: string | null
  external_review_url: string | null
}

function cleanWebsiteUrl(url: string) {
  return url.startsWith('http') ? url : `https://${url}`
}

function isCommunityListing(business: Business) {
  return business.listing_type === 'community'
}

export default function BusinessReviewPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()

  const slug = params.slug

  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [saving, setSaving] = useState(false)

  const [business, setBusiness] = useState<Business | null>(null)

  const [reviewerName, setReviewerName] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [rating, setRating] = useState('5')
  const [reviewText, setReviewText] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadBusiness()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function loadBusiness() {
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error: businessError } = await supabase
      .from('businesses')
      .select(
        `
        id,
        business_name,
        slug,
        listing_type,
        use_external_reviews,
        external_review_platform,
        external_review_url
      `
      )
      .eq('slug', slug)
      .eq('is_approved', true)
      .maybeSingle()

    if (businessError) {
      setError(businessError.message)
      setLoading(false)
      return
    }

    if (!data) {
      setError('This business listing could not be found.')
      setLoading(false)
      return
    }

    const loadedBusiness = data as Business

    if (isCommunityListing(loadedBusiness)) {
      setBusiness(loadedBusiness)
      setError('Reviews are not available for local amenities.')
      setLoading(false)
      return
    }

    const hasExternalReviewLink =
      Boolean(loadedBusiness.use_external_reviews) &&
      Boolean(loadedBusiness.external_review_url)

    if (hasExternalReviewLink && loadedBusiness.external_review_url) {
      setRedirecting(true)
      window.location.replace(cleanWebsiteUrl(loadedBusiness.external_review_url))
      return
    }

    setBusiness(loadedBusiness)
    setLoading(false)
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!business) {
      setError('Business listing could not be found.')
      return
    }

    if (!reviewerName.trim()) {
      setError('Please enter your name.')
      return
    }

    if (!reviewerEmail.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (!reviewText.trim()) {
      setError('Please write a review.')
      return
    }

    const numericRating = Number(rating)

    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      setError('Please choose a rating between 1 and 5.')
      return
    }

    setSaving(true)

    const { error: insertError } = await supabase.from('reviews').insert({
      business_id: business.id,
      reviewer_name: reviewerName.trim(),
      reviewer_email: reviewerEmail.trim(),
      rating: numericRating,
      review_text: reviewText.trim(),
      is_approved: false,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setReviewerName('')
    setReviewerEmail('')
    setRating('5')
    setReviewText('')

    setSuccess(
      'Thank you. Your review has been submitted and will appear once it has been approved.'
    )

    setSaving(false)
  }

  if (loading || redirecting) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-stone-700">
            {redirecting
              ? 'Taking you to the external review page...'
              : 'Loading review page...'}
          </p>
        </div>
      </main>
    )
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h1 className="text-2xl font-bold text-stone-950">
            Review page unavailable
          </h1>

          <p className="mt-3 text-stone-700">
            {error || 'This review page could not be loaded.'}
          </p>

          <Link
            href="/directory"
            className="mt-5 inline-flex rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Back to directory
          </Link>
        </div>
      </main>
    )
  }

  if (isCommunityListing(business)) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <Link
            href={`/business/${business.slug}`}
            className="text-sm font-semibold text-red-700 hover:text-red-800 hover:underline"
          >
            ← Back to listing
          </Link>

          <h1 className="mt-5 text-2xl font-bold text-stone-950">
            Reviews unavailable
          </h1>

          <p className="mt-3 text-stone-700">
            Reviews are only available for business listings. Local amenities can
            be updated using the report or suggest update option on the listing.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl bg-stone-900 p-6 text-white">
          <Link
            href={`/business/${business.slug}`}
            className="text-sm font-semibold text-red-300 hover:text-red-200 hover:underline"
          >
            ← Back to {business.business_name}
          </Link>

          <h1 className="mt-5 text-3xl font-bold">
            Leave a review
          </h1>

          <p className="mt-3 max-w-2xl text-stone-200">
            Share your experience with {business.business_name}. Reviews are
            checked before they appear on Ollerton Hub.
          </p>
        </section>

        <form
          onSubmit={submitReview}
          className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200"
        >
          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800 ring-1 ring-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-800 ring-1 ring-green-200">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-stone-800">
              Your name
            </label>

            <input
              value={reviewerName}
              onChange={(event) => setReviewerName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-800">
              Your email
            </label>

            <input
              type="email"
              value={reviewerEmail}
              onChange={(event) => setReviewerEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
              placeholder="you@example.com"
            />

            <p className="mt-2 text-xs text-stone-500">
              Your email is used for moderation only and will not be shown
              publicly.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-800">
              Rating
            </label>

            <select
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
            >
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-800">
              Review
            </label>

            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              rows={6}
              className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
              placeholder="Tell others about your experience..."
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-stone-600">
              Submitted reviews are checked before being published.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}