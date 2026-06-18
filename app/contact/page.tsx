'use client'

import { FormEvent, Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type ContactTopic =
  | 'general'
  | 'subscriptions'
  | 'advert-enquiry'
  | 'report-listing'
  | 'featured-listing'
  | 'premium-listing'
  | 'local-info'
  | 'technical'

type TopicOption = {
  value: ContactTopic
  label: string
  title: string
  intro: string
  messagePlaceholder: string
}

const topicOptions: TopicOption[] = [
  {
    value: 'general',
    label: 'General enquiry',
    title: 'Contact Ollerton Hub',
    intro:
      'Send us a message about Ollerton Hub, local listings, corrections or general enquiries.',
    messagePlaceholder: 'How can we help?',
  },
  {
    value: 'subscriptions',
    label: 'Listing options',
    title: 'Listing options enquiry',
    intro:
      'Ask about Free, Featured or Premium listings on Ollerton Hub.',
    messagePlaceholder:
      'Tell us what you would like to know about listing options.',
  },
  {
    value: 'advert-enquiry',
    label: 'Advert enquiry',
    title: 'Advert enquiry',
    intro:
      'Ask about advert space for local offers, events, sponsor messages or announcements.',
    messagePlaceholder:
      'Tell us what you would like to advertise and roughly when you would like it to appear.',
  },
  {
    value: 'report-listing',
    label: 'Report a listing',
    title: 'Report a listing',
    intro:
      'Use this form to report incorrect details, unsuitable content or a concern about a listing.',
    messagePlaceholder:
      'Please explain what is wrong with the listing and what you think needs checking.',
  },
  {
    value: 'featured-listing',
    label: 'Featured listing',
    title: 'Featured listing enquiry',
    intro:
      'Ask about giving your listing extra visibility on Ollerton Hub.',
    messagePlaceholder:
      'Tell us which listing you would like to feature and what you would like to achieve.',
  },
  {
    value: 'premium-listing',
    label: 'Premium listing',
    title: 'Premium listing enquiry',
    intro:
      'Ask about the highest visibility listing option on Ollerton Hub.',
    messagePlaceholder:
      'Tell us about your business and what you would like from a Premium listing.',
  },
  {
    value: 'local-info',
    label: 'Submit local information',
    title: 'Submit useful local information',
    intro:
      'Suggest a school, place of worship, council service, community group or other useful local information.',
    messagePlaceholder:
      'Tell us what should be added or updated, including any useful contact details or links.',
  },
  {
    value: 'technical',
    label: 'Technical issue',
    title: 'Report a technical issue',
    intro:
      'Let us know if something on Ollerton Hub is not working as expected.',
    messagePlaceholder:
      'Please explain what happened, what page you were on, and what device/browser you were using if known.',
  },
]

function getTopicOption(value: string | null): TopicOption {
  const match = topicOptions.find((option) => option.value === value)
  return match || topicOptions[0]
}

function cleanValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function ContactContent() {
  const searchParams = useSearchParams()

  const initialTopic = getTopicOption(searchParams.get('topic'))
  const listingSlug = searchParams.get('listing') || ''
  const listingId = searchParams.get('listingId') || ''
  const listingName = searchParams.get('listingName') || ''

  const [topic, setTopic] = useState<ContactTopic>(initialTopic.value)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [businessName, setBusinessName] = useState(listingName)
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const selectedTopic = useMemo(() => getTopicOption(topic), [topic])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess(false)

    // Honeypot spam check.
    if (company.trim()) {
      setSuccess(true)
      return
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please add your name, email address and message.')
      return
    }

    setSubmitting(true)

    const sourceUrl =
      typeof window !== 'undefined' ? window.location.href : null

    const messageWithListingName = businessName.trim()
      ? `Business / listing name: ${businessName.trim()}\n\n${message.trim()}`
      : message.trim()

    const { error: insertError } = await supabase
      .from('contact_requests')
      .insert({
        request_type: topic,
        subject: selectedTopic.title,
        name: name.trim(),
        email: email.trim(),
        phone: cleanValue(phone),
        message: messageWithListingName,
        listing_id: cleanValue(listingId),
        listing_slug: cleanValue(listingSlug),
        status: 'new',
        admin_notes: null,
        source_url: sourceUrl,
      })

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSuccess(true)
    setName('')
    setEmail('')
    setPhone('')
    setBusinessName(listingName)
    setMessage('')
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
      <section className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-stone-600 hover:underline"
        >
          ← Back to Ollerton Hub
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl bg-stone-900 text-white shadow-sm">
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
              Contact us
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              {selectedTopic.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-200">
              {selectedTopic.intro}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 md:p-6">
          {success ? (
            <div className="rounded-2xl bg-green-50 p-5 ring-1 ring-green-200">
              <h2 className="text-lg font-bold text-green-900">
                Message sent
              </h2>

              <p className="mt-2 text-sm leading-6 text-green-800">
                Thanks for contacting Ollerton Hub. Your message has been
                received.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                >
                  Send another message
                </button>

                <Link
                  href="/directory"
                  className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                >
                  Back to directory
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-stone-900">
                  What is this about?
                </label>

                <select
                  value={topic}
                  onChange={(event) =>
                    setTopic(event.target.value as ContactTopic)
                  }
                  className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-red-600"
                >
                  {topicOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-stone-900">
                    Your name *
                  </label>

                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-red-600"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-stone-900">
                    Email address *
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-red-600"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-stone-900">
                    Phone number
                  </label>

                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-red-600"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-stone-900">
                    Business / listing name
                  </label>

                  <input
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-red-600"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {listingSlug ? (
                <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Linked listing
                  </p>

                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {listingName || listingSlug}
                  </p>

                  <p className="mt-1 text-xs text-stone-500">
                    /business/{listingSlug}
                  </p>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-semibold text-stone-900">
                  Message *
                </label>

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={7}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none focus:border-red-600"
                  placeholder={selectedTopic.messagePlaceholder}
                />
              </div>

              <div className="hidden">
                <label>
                  Company
                  <input
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>

              {error ? (
                <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Send message'}
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  )
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
          <section className="mx-auto max-w-4xl">
            <p>Loading contact form...</p>
          </section>
        </main>
      }
    >
      <ContactContent />
    </Suspense>
  )
}