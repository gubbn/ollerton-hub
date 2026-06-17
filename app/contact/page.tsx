'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const contactEmail = 'hello@ollertonhub.co.uk'

function getReadableBusinessName(slug: string) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function ContactContent() {
  const searchParams = useSearchParams()

  const subjectParam = searchParams.get('subject') ?? ''
  const businessParam = searchParams.get('business') ?? ''

  const isAmenityRequest = subjectParam === 'request-local-amenity'
  const isReportListing =
    subjectParam.toLowerCase() === 'report listing' && Boolean(businessParam)
  const isAdvertising = subjectParam === 'advertising'
  const isFeatured = subjectParam === 'featured'
  const isPremium = subjectParam === 'premium'

  const readableBusinessName = businessParam
    ? getReadableBusinessName(businessParam)
    : ''

  const pageLabel = isAmenityRequest
    ? 'Local amenity request'
    : isReportListing
      ? 'Report listing'
      : isAdvertising
        ? 'Advertising enquiry'
        : isFeatured
          ? 'Featured listing enquiry'
          : isPremium
            ? 'Premium listing enquiry'
            : 'Contact'

  const pageTitle = isAmenityRequest
    ? 'Request a local amenity'
    : isReportListing
      ? 'Report a listing'
      : isAdvertising
        ? 'Ask about advertising'
        : isFeatured
          ? 'Ask about Featured listings'
          : isPremium
            ? 'Ask about Premium listings'
            : 'Get in touch with Ollerton Hub'

  const introText = isAmenityRequest
    ? 'Tell us about a useful local place, service or public amenity that should be added to Ollerton Hub.'
    : isReportListing
      ? 'Tell us what needs checking or correcting on this listing.'
      : isAdvertising
        ? 'Ask about placing a local advert on Ollerton Hub.'
        : isFeatured
          ? 'Ask about giving your business extra visibility with a Featured listing.'
          : isPremium
            ? 'Ask about Premium listings, including extra visibility and listing performance metrics.'
            : 'Need to report a listing, request a correction, ask about paid options or suggest something useful for the directory?'

  const emailSubject = isAmenityRequest
    ? 'Request local amenity'
    : isReportListing
      ? `Report Listing: ${readableBusinessName || businessParam}`
      : isAdvertising
        ? 'Advertising enquiry'
        : isFeatured
          ? 'Featured listing enquiry'
          : isPremium
            ? 'Premium listing enquiry'
            : subjectParam || 'Ollerton Hub enquiry'

  const emailBody = isAmenityRequest
    ? `Hi Ollerton Hub,

I would like to suggest a local amenity to be added to the directory.

Amenity name:

Amenity type:
For example: school, place of worship, recycling centre, council service, community venue, public service.

Address or area:

Website, phone number or email if known:

Why this would be useful for local residents:

Additional details:
`
    : isReportListing
      ? `Hi Ollerton Hub,

I would like to report the following listing:

${readableBusinessName || businessParam}
${businessParam ? `Listing slug: ${businessParam}` : ''}

Reason:

Details:
`
      : isAdvertising
        ? `Hi Ollerton Hub,

I would like to ask about advertising on Ollerton Hub.

Business / organisation name:

Website or social link:

What would you like to advertise?

Preferred advert dates, if known:

Additional details:
`
        : isFeatured
          ? `Hi Ollerton Hub,

I would like to ask about a Featured listing.

Business name:

Current listing link, if already listed:

Additional details:
`
          : isPremium
            ? `Hi Ollerton Hub,

I would like to ask about a Premium listing.

Business name:

Current listing link, if already listed:

Additional details:
`
            : `Hi Ollerton Hub,

`

  const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(emailBody)}`

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 md:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600">
            {pageLabel}
          </p>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-stone-900">
            {pageTitle}
          </h1>

          <p className="mb-8 max-w-2xl text-base leading-relaxed text-stone-700">
            {introText}
          </p>

          {isAmenityRequest ? (
            <div className="mb-6 rounded-2xl bg-red-50 p-5 text-sm text-red-900 ring-1 ring-red-100">
              <p className="font-bold">Helpful details to include:</p>

              <ul className="mt-3 space-y-2">
                <li>• Name of the place or service</li>
                <li>
                  • Type, such as school, place of worship, recycling centre or
                  community venue
                </li>
                <li>• Address, town or service area</li>
                <li>• Website, phone number or email if known</li>
                <li>• Why it should be added to Ollerton Hub</li>
              </ul>
            </div>
          ) : null}

          {isReportListing ? (
            <div className="mb-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-100">
              <p className="font-bold">Listing to review:</p>
              <p className="mt-2">{readableBusinessName || businessParam}</p>
              {businessParam ? (
                <p className="mt-1 text-amber-800">Slug: {businessParam}</p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200">
            <h2 className="mb-2 text-xl font-bold text-stone-900">
              Email us
            </h2>

            <p className="mb-5 text-sm leading-relaxed text-stone-600">
              This keeps things simple and avoids storing your message on the
              website. The email button will open your email app with the right
              subject and guidance already filled in.
            </p>

            <a
              href={mailtoLink}
              className="inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              {isAmenityRequest
                ? 'Email amenity request'
                : isReportListing
                  ? 'Email listing report'
                  : isAdvertising
                    ? 'Email advertising enquiry'
                    : isFeatured
                      ? 'Email Featured enquiry'
                      : isPremium
                        ? 'Email Premium enquiry'
                        : 'Email Ollerton Hub'}
            </a>

            <p className="mt-5 text-sm text-stone-600">
              Or email us directly at{' '}
              <a
                href={`mailto:${contactEmail}`}
                className="font-semibold text-red-600 hover:underline"
              >
                {contactEmail}
              </a>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/directory"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-50"
            >
              View directory
            </Link>

            <Link
              href="/about"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-50"
            >
              About listings
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
          <div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            Loading contact page...
          </div>
        </main>
      }
    >
      <ContactContent />
    </Suspense>
  )
}