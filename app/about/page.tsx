import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-700">
            About Ollerton Hub
          </p>

          <h1 className="mb-4 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
            Helping local businesses get found
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-stone-700">
            Ollerton Hub is a public directory for businesses in Ollerton and
            the surrounding villages. It gives local businesses a simple place
            to share their name, contact details, services, opening times and
            website links.
          </p>

          <p className="mt-4 max-w-3xl leading-7 text-stone-700">
            Standard listings are free for everyone. Businesses that want more
            visibility can choose a Featured or Premium listing, and local
            adverts can also be placed on selected pages.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800"
            >
              Create a free listing
            </Link>

            <Link
              href="/contact"
              className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Ask about paid options
            </Link>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <PricingCard
            label="Free"
            title="Standard Listing"
            price="£0"
            priceNote="/ month"
            description="For local businesses that want a basic presence in the public directory."
            includedTitle="Includes:"
            items={[
              'Business profile page',
              'Business name and description',
              'Phone number and email address',
              'Website and social media links',
              'Opening times',
              'Address or service area',
              'Logo upload',
              'Customer reviews',
              'Appears in directory search results',
            ]}
            bestFor="Best for businesses that simply want to be found online."
            href="/register"
            buttonText="Sign up free"
          />

          <PricingCard
            featured
            label="Featured"
            title="Featured Listing"
            price="£10"
            priceNote="/ month"
            description="For businesses that want more visibility than a standard free listing."
            includedTitle="Includes everything in Free, plus:"
            items={[
              'Featured badge on your listing',
              'Priority placement above standard listings',
              'Chance to appear on the homepage featured section',
              'Highlighted card styling in the directory',
              'Useful for seasonal offers or new businesses',
            ]}
            bestFor="Best for businesses that want extra attention without a full promotion package."
            href="/contact"
            buttonText="Ask about Featured"
          />

          <PricingCard
            premium
            label="Premium"
            title="Premium Listing"
            price="£25"
            priceNote="/ month"
            description="For businesses that want the strongest directory visibility and access to performance metrics."
            includedTitle="Includes everything in Featured, plus:"
            items={[
              'Premium badge on your business profile',
              'Highest placement in relevant directory results',
              'Larger promotional area on your listing',
              'Option to highlight key services or offers',
              'Access to listing performance metrics',
              'View profile views and contact clicks',
              'Suitable for ongoing local promotion',
            ]}
            bestFor="Best for businesses that rely on local visibility and want to be seen first."
            href="/contact"
            buttonText="Ask about Premium"
          />
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
                Local advertising
              </p>

              <h2 className="mt-2 text-2xl font-bold text-stone-950">
                Advertise on Ollerton Hub
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-stone-700">
                Advert spaces are available for local businesses, community
                events, seasonal offers and useful local services. These spaces
                sit underneath the listing options on this page and can be used
                to give your message more visibility.
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 px-5 py-4 text-center ring-1 ring-red-100">
              <p className="text-sm font-semibold text-red-800">
                From
              </p>
              <p className="text-3xl font-bold text-red-950">
                £15
              </p>
              <p className="text-sm text-red-800">
                per month
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Example advert space
            </p>

            <div className="overflow-hidden rounded-2xl bg-stone-900 shadow-sm ring-1 ring-stone-300">
              <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
                <div className="p-6 text-white sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
                    Example local advert
                  </p>

                  <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
                    Need help around the house?
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-stone-200 sm:text-base">
                    Smith & Sons Handyman Services offer repairs, flat-pack
                    furniture, garden tidy-ups and odd jobs across Ollerton and
                    nearby villages.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                    <span className="rounded-full bg-white px-4 py-2 text-stone-900">
                      Free quotes
                    </span>
                    <span className="rounded-full bg-red-700 px-4 py-2 text-white">
                      Local service
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center bg-red-700 p-6 text-center text-white sm:p-8">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-red-100">
                      Call today
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      01623 000 000
                    </p>
                    <p className="mt-2 text-sm text-red-100">
                      smithandsons.co.uk
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-stone-600 md:grid-cols-3">
              <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
                <p className="font-semibold text-stone-900">
                  Recommended size
                </p>
                <p className="mt-1">
                  1200 × 300 px banner
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
                <p className="font-semibold text-stone-900">
                  File types
                </p>
                <p className="mt-1">
                  WEBP, JPG or PNG
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
                <p className="font-semibold text-stone-900">
                  File size
                </p>
                <p className="mt-1">
                  Maximum 1 MB
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Link
                href="/contact"
                className="inline-flex rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800"
              >
                Ask about advertising
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-stone-900 p-6 text-white shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold">
            Start with a free listing
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-stone-200">
            You do not need a paid plan to be listed. Create a free listing now,
            then upgrade later if you want more visibility or access to Premium
            metrics.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-stone-950 hover:bg-stone-100"
            >
              Create a free listing
            </Link>

            <Link
              href="/directory"
              className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              View the directory
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}

function PricingCard({
  label,
  title,
  price,
  priceNote,
  description,
  includedTitle,
  items,
  bestFor,
  href,
  buttonText,
  featured = false,
  premium = false,
}: {
  label: string
  title: string
  price: string
  priceNote: string
  description: string
  includedTitle: string
  items: string[]
  bestFor: string
  href: string
  buttonText: string
  featured?: boolean
  premium?: boolean
}) {
  return (
    <div
      className={`rounded-3xl bg-white p-6 shadow-sm ${
        featured
          ? 'ring-2 ring-red-300'
          : premium
            ? 'ring-2 ring-stone-800'
            : 'ring-1 ring-stone-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-sm font-semibold uppercase tracking-wide ${
            featured
              ? 'text-red-700'
              : premium
                ? 'text-stone-900'
                : 'text-stone-500'
          }`}
        >
          {label}
        </p>

        {featured && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
            Popular
          </span>
        )}

        {premium && (
          <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white">
            Metrics included
          </span>
        )}
      </div>

      <h2 className="mt-3 text-2xl font-bold text-stone-950">
        {title}
      </h2>

      <p className="mt-3 text-4xl font-bold text-stone-950">
        {price}
        <span className="text-base font-medium text-stone-500">
          {' '}
          {priceNote}
        </span>
      </p>

      <p className="mt-4 leading-7 text-stone-700">
        {description}
      </p>

      <div className="mt-6 border-t border-stone-200 pt-5">
        <h3 className="text-sm font-semibold text-stone-950">
          {includedTitle}
        </h3>

        <ul className="mt-4 space-y-3 text-sm text-stone-700">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <div
        className={`mt-6 rounded-2xl p-4 text-sm ${
          featured
            ? 'bg-red-50 text-red-900'
            : premium
              ? 'bg-stone-900 text-white'
              : 'bg-stone-50 text-stone-700'
        }`}
      >
        {bestFor}
      </div>

      <Link
        href={href}
        className={`mt-6 inline-flex w-full justify-center rounded-xl px-5 py-3 text-sm font-semibold ${
          featured
            ? 'bg-red-700 text-white hover:bg-red-800'
            : premium
              ? 'bg-stone-900 text-white hover:bg-stone-800'
              : 'bg-stone-900 text-white hover:bg-stone-800'
        }`}
      >
        {buttonText}
      </Link>
    </div>
  )
}