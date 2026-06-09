'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  business_name: string
  slug: string
}

export default function ReviewPage() {
  const params = useParams()
  const slug = params.slug as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadBusiness() {
      const { data } = await supabase
        .from('businesses')
        .select('id, business_name, slug')
        .eq('slug', slug)
        .eq('is_approved', true)
        .single()

      setBusiness(data as Business | null)
      setLoading(false)
    }

    loadBusiness()
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!business) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('reviews').insert({
      business_id: business.id,
      reviewer_name: reviewerName,
      reviewer_email: reviewerEmail || null,
      rating,
      review_text: reviewText,
      is_approved: false,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setReviewerName('')
      setReviewerEmail('')
      setRating(5)
      setReviewText('')
      setMessage('Review submitted. It will appear once approved.')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
        Loading...
      </main>
    )
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold">Business not found</h1>
          <Link href="/directory" className="mt-4 block font-semibold underline">
            Back to directory
          </Link>
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

        <div className="mt-6 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
          <h1 className="text-3xl font-bold">Leave a review</h1>

          <p className="mt-2 text-stone-700">
            Share your experience with {business.business_name}.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block font-semibold">Your name</label>
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Email address <span className="font-normal text-stone-500">(not public)</span>
              </label>
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                type="email"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">Rating</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 focus:border-stone-900 focus:outline-none"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
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
                onChange={(e) => setReviewText(e.target.value)}
                required
              />
            </div>

            <button
              disabled={saving}
              className="w-full rounded-xl bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {saving ? 'Submitting...' : 'Submit review'}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-stone-700">{message}</p>}
        </div>
      </div>
    </main>
  )
}