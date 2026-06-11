'use client'

import { useSearchParams } from 'next/navigation'

const contactEmail = 'ngubb@fixingit.tech'

export default function ContactPage() {
  const searchParams = useSearchParams()

  const subjectParam = searchParams.get('subject') ?? 'Ollerton Hub enquiry'
  const businessParam = searchParams.get('business') ?? ''

  const subject = businessParam
    ? `Report Listing: ${businessParam}`
    : subjectParam

  const body = businessParam
    ? `Hi Ollerton Hub,

I would like to report the following listing:

${businessParam}

Reason:

Details:
`
    : `Hi Ollerton Hub,

`

  const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 md:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600">
            Contact
          </p>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-stone-900">
            Get in touch with Ollerton Hub
          </h1>

          <p className="mb-8 max-w-2xl text-base leading-relaxed text-stone-700">
            Need to report a listing, request a correction, or ask a question?
            Click the button below and your email app will open with the details
            ready to send.
          </p>

          <div className="rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200">
            <h2 className="mb-2 text-xl font-bold text-stone-900">
              Email us
            </h2>

            <p className="mb-5 text-sm leading-relaxed text-stone-600">
              This keeps things simple and avoids storing your message on the
              website.
            </p>

            <a
              href={mailtoLink}
              className="inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Email Ollerton Hub
            </a>


          </div>
        </section>
      </div>
    </main>
  )
}