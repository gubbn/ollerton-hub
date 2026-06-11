import Link from 'next/link'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl bg-stone-900 p-6 text-white shadow-sm md:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-500">
            Business dashboard
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight">
            Manage your Ollerton Hub listing
          </h1>

          <p className="mt-4 max-w-2xl text-stone-300">
            Create, update and manage your business profile so local residents
            can find accurate information about your services.
          </p>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <Link
            href="/dashboard/business"
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600">
              Your listing
            </p>

            <h2 className="text-2xl font-bold text-stone-900">
              Create or edit business page
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Add your logo, contact details, opening times, address, services
              and social links.
            </p>

            <span className="mt-5 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">
              Manage listing
            </span>
          </Link>

          <Link
            href="/directory"
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-600">
              Directory
            </p>

            <h2 className="text-2xl font-bold text-stone-900">
              View public directory
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Check how Ollerton Hub looks to residents and browse live business
              listings.
            </p>

            <span className="mt-5 inline-flex rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700">
              Open directory
            </span>
          </Link>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 md:p-8">
          <h2 className="text-2xl font-bold text-stone-900">
            Helpful notes
          </h2>

          <div className="mt-4 space-y-3 text-sm leading-relaxed text-stone-600">
            <p>
              New or updated listings may need approval before they appear
              publicly.
            </p>

            <p>
              Keep your contact details, opening times and service areas up to
              date so residents can reach you easily.
            </p>

            <p>
              If something looks wrong, use the contact page and we&apos;ll help
              you correct it.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}