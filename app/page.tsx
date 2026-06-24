import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import HomeSearch from '@/app/components/HomeSearch'
import ListingBadges from '@/app/components/ListingBadges'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
}

type CategoryRelation =
  | { name: string; slug: string }
  | { name: string; slug: string }[]
  | null

type Business = {
  id: string
  business_name: string
  slug: string
  description: string | null
  town: string | null
  service_area: string | null
  logo_url: string | null
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  listing_type: string | null
  useful_listing_type: string | null
  categories: CategoryRelation
}

type SiteSetting = {
  setting_key: string
  setting_value: string | null
}

function getSetting(settings: SiteSetting[], key: string, fallback: string) {
  return (
    settings.find((setting) => setting.setting_key === key)?.setting_value ||
    fallback
  )
}

function isOtherCategory(category: Category) {
  return (
    category.slug.toLowerCase() === 'other' ||
    category.name.toLowerCase() === 'other'
  )
}

function getCategoryName(categories: CategoryRelation) {
  if (!categories) return 'Local listing'
  if (Array.isArray(categories)) return categories[0]?.name ?? 'Local listing'
  return categories.name
}

function getListingTypeLabel(business: Business) {
  if (business.useful_listing_type) return business.useful_listing_type
  return getCategoryName(business.categories)
}

function isApprovedBusiness(business: Business) {
  return business.status === 'approved' || business.is_approved === true
}

function isCommunityListing(business: Business) {
  return business.listing_type === 'community'
}

function sortByBusinessName(a: Business, b: Business) {
  return a.business_name.localeCompare(b.business_name)
}

function HomepageSquareAdvert() {
  return (
    <aside className="mx-auto w-full max-w-[340px] lg:mx-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">
        Advertisement
      </p>

      <Link
        href="/contact?topic=advert-enquiry"
        className="group block aspect-square w-full overflow-hidden rounded-3xl bg-stone-100 shadow-sm ring-1 ring-white/20"
        aria-label="Advertise your business on Ollerton Hub"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/homepage-square-ollerton-hub.png"
          alt="Advertise your business on Ollerton Hub"
          className="block h-full w-full object-cover transition group-hover:scale-105"
        />
      </Link>
    </aside>
  )
}

function FeaturedBusinessCard({ business }: { business: Business }) {
  return (
    <Link
      href={`/business/${business.slug}`}
      className="group rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-2.5">
        {business.logo_url ? (
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={business.logo_url}
              alt={`${business.business_name} logo`}
              className="h-full w-full object-contain"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-snug text-stone-950 group-hover:text-red-700">
            {business.business_name}
          </h3>

          <ListingBadges
            isFeatured={business.is_featured}
            listingType={business.listing_type}
            usefulListingType={business.useful_listing_type}
            className="mt-1.5"
          />

          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
            {getListingTypeLabel(business)}
          </p>
        </div>
      </div>

      {business.description ? (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-stone-600">
          {business.description}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-stone-600">
          View this local listing.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {business.town ? (
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
            {business.town}
          </span>
        ) : null}

        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
          {getCategoryName(business.categories)}
        </span>
      </div>
    </Link>
  )
}

export default async function HomePage() {
  const [settingsResult, categoriesResult, businessesResult] =
    await Promise.all([
      supabase.from('site_settings').select('setting_key, setting_value'),

      supabase
        .from('categories')
        .select('id, name, slug, description')
        .order('name', { ascending: true }),

      supabase
        .from('businesses')
        .select(`
          id,
          business_name,
          slug,
          description,
          town,
          service_area,
          logo_url,
          status,
          is_approved,
          is_featured,
          listing_type,
          useful_listing_type,
          categories (
            name,
            slug
          )
        `)
        .order('business_name', { ascending: true })
        .limit(100),
    ])

  const settings = (settingsResult.data || []) as SiteSetting[]

  const categories = ((categoriesResult.data || []) as Category[]).filter(
    (category) => !isOtherCategory(category)
  )

  const approvedBusinesses = ((businessesResult.data || []) as Business[])
    .filter((business) => isApprovedBusiness(business))
    .filter((business) => !isCommunityListing(business))

  const featuredBusinesses = approvedBusinesses
    .filter((business) => business.is_featured === true)
    .sort(sortByBusinessName)
    .slice(0, 10)

  const heroTitle = getSetting(settings, 'homepage_title', 'Ollerton Hub')

  const heroIntro = getSetting(
    settings,
    'homepage_intro',
    'Find local businesses, useful services, schools, places of worship, community groups and local information around Ollerton.'
  )

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
      <section className="mx-auto max-w-[1500px] space-y-8">
        <section className="overflow-hidden rounded-3xl bg-stone-900 text-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
                Local directory for Ollerton
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-5xl">
                {heroTitle}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-200">
                {heroIntro}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/directory"
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800"
                >
                  Browse directory
                </Link>

                <Link
                  href="/register"
                  className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Add your listing
                </Link>
              </div>

              <div className="mt-6 max-w-3xl rounded-2xl bg-white p-4 text-stone-900 shadow-sm">
                <p className="text-sm font-bold text-stone-950">
                  Search Ollerton Hub
                </p>

                <p className="mt-1 text-sm text-stone-600">
                  Search by business name, service, category or town.
                </p>

                <div className="mt-4">
                  <HomeSearch />
                </div>
              </div>
            </div>

            <HomepageSquareAdvert />
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Browse by category
              </p>

              <h2 className="mt-1 text-2xl font-bold text-stone-950">
                Find what you need locally
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Choose a category to browse local businesses, services and
                useful information.
              </p>
            </div>

            <Link
              href="/directory"
              className="text-sm font-semibold text-red-700 hover:underline"
            >
              View all listings →
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/directory?category=${category.slug}`}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="text-sm font-bold text-stone-950">
                  {category.name}
                </h3>

                {category.description ? (
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-600">
                    {category.description}
                  </p>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-stone-600">
                    Browse local listings in this category.
                  </p>
                )}
              </Link>
            ))}
          </div>

          {categories.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200">
              <h3 className="text-lg font-bold text-stone-900">
                No categories yet
              </h3>

              <p className="mt-2 text-sm text-stone-600">
                Categories will appear here once they have been added.
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-stone-950">
                Are you a local business?
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Create a free listing so local residents can find your services,
                opening times, contact details and useful information.
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Want extra visibility? Upgrade to a Featured listing, or enquire
                separately about advertising space on Ollerton Hub.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link
                href="/register"
                className="inline-flex justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800"
              >
                Create or edit listing
              </Link>

              <Link
                href="/contact?topic=advert-enquiry"
                className="inline-flex justify-center rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800"
              >
                Ask about advertising
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Featured listings
              </p>

              <h2 className="mt-1 text-2xl font-bold text-stone-950">
                Featured local businesses
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Featured listings give local businesses extra homepage
                visibility while the main directory stays fair and alphabetical.
              </p>
            </div>

            <Link
              href="/contact?topic=featured-listing"
              className="text-sm font-semibold text-red-700 hover:underline"
            >
              Ask about Featured →
            </Link>
          </div>

          {featuredBusinesses.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {featuredBusinesses.map((business) => (
                <FeaturedBusinessCard key={business.id} business={business} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-stone-300 bg-white p-6 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Space reserved
              </p>

              <h3 className="mt-2 text-xl font-bold text-stone-950">
                Featured listings will appear here
              </h3>

              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                This section is reserved for local businesses that choose the
                Featured listing option.
              </p>

              <Link
                href="/contact?topic=featured-listing"
                className="mt-5 inline-flex rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800"
              >
                Ask about Featured
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}