import Link from 'next/link'

const faqs = [
  {
    question: 'What is Ollerton Hub?',
    answer:
      'Ollerton Hub is a local directory for businesses, services and useful community information in and around Ollerton. It helps residents find local businesses, amenities and contact details in one place.',
  },
  {
    question: 'How do I add my business?',
    answer:
      'You can add your business by creating an account and submitting your listing. Once submitted, it will be reviewed before appearing publicly on the directory.',
  },
  {
    question: 'What do you mean by "surrounding villages"?',
    answer:  'Villages up to a 10 mile radius of Ollerton, Nottinghamshire can list their business with Ollerton Hub.',
  },
  {
    question: 'Why does my business need to be approved?',
    answer:
      'Business listings are reviewed before publication to help keep the directory useful, accurate and safe for local residents and to make sure that it stays a local directory.',
  },
  {
    question: 'How long does approval take?',
    answer:
      'Approvals are handled manually and should be approved within a few days.This will vary depending on availability.',
  },
  {
    question: 'Can I edit my listing after it has been approved?',
    answer:
      'Yes. You can log in to your dashboard and update your business details. Some changes may need to be checked again before they appear publicly.',
  },
    {
    question: 'Can charities, schools or local amenities be listed?',
    answer:
      'Yes. Ollerton Hub also includes useful local information such as schools, places of worship, council services and other community amenities. These are usually added by the site admin rather than through the standard business sign-up process.',
  },
  {
    question: 'Can customers leave reviews?',
    answer:
      'Yes, customers can leave reviews on business listings. Reviews are checked before being published to help prevent spam or inappropriate content.',
  },
  {
    question: 'Can reviews be left for local amenities?',
    answer:
      'No. Reviews are intended for business listings only. Local amenities are listed for useful information rather than customer feedback.',
  },
  {
    question: 'How do I report incorrect information?',
    answer:
      'Use the contact page to report a listing. Please include the name of the business or amenity and what needs changing.',
  },
  {
    question: 'Can I advertise on Ollerton Hub?',
    answer:
      'Yes. Advertising spaces may be available across the site. You can use the contact page to ask about advert opportunities.',
  },
  {
    question: 'Who manages Ollerton Hub?',
    answer:
      'Ollerton Hub is locally managed by Ollerton residents. Listings, reviews and contact requests are checked by the site admin. You can submit a request on the contact page if you wish to contact the team.',
  },
]

export const metadata = {
  title: 'FAQ | Ollerton Hub',
  description:
    'Frequently asked questions about Ollerton Hub, business listings, reviews, local amenities and advertising.',
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
          >
            Return to the hub
          </Link>
        </div>

        <header className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Help & information
          </p>

          <h1 className="mt-3 text-3xl font-bold text-stone-950 md:text-4xl">
            Frequently asked questions
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600 md:text-base">
            Find answers about adding your business, managing your listing,
            reviews, local amenities, featured listings and advertising on
            Ollerton Hub.
          </p>
        </header>

        <section className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-bold text-stone-950">
                {faq.question}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {faq.answer}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl bg-emerald-900 p-6 text-white shadow-sm md:p-8">
          <h2 className="text-2xl font-bold">Still need help?</h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">
            Use the contact page for listing changes, advert enquiries,
            subscription questions, reporting a listing or general support.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
            >
              Contact us
            </Link>

            <Link
              href="/register"
              className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Add your listing
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}