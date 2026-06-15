import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import HomeSearch from '@/app/components/HomeSearch'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
}

type CategoryRelation = { name: string; slug: string } | { name: string; slug: string }[] | null

type Listing = {
  id: string
  business_name: string
  slug: string
  description: string | null
  town: string | null
  logo_url: string | null
  is_featured: boolean | null
  is_premium: boolean | null
  listing_type: string | null
  useful_listing_type: string | null
  categories: CategoryRelation
}

type SiteSetting = {
  setting_key: string
  setting_value: string | null
}

function getCategoryName(categories: CategoryRelation) {
  if (!categories) return 'Local listing'

  if (Array.isArray(categories)) {
    return categories[0]?.name ?? 'Local listing'
  }

  return categories.name
}

function getSetting(
  settings: SiteSetting[],
  key: string,
  fallback: string
) {
  return (
    settings.find((setting) => setting.setting_key === key)?.setting_value ||
    fallback
  )
}

function getListingLabel(listing: Listing) {
  if (listing.listing_type === 'community') {
    return listing.useful_listing_type || 'Local amenity'
  }

  if (listing.is_premium) return 'Premium business'
  if (listing.is_featured) return 'Featured business'

  return getCategoryName(listing.categories)
}

export default async function HomePage() {
  const [{ data: categoriesData }, { data: listingsData }, { data: settingsData }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, description')
        .neq('name', 'Other')
        .order('name', { ascending: true }),

      supabase
        .from('businesses')
        .select(
          `
          id,
          business_name,
          slug,
          description,
          town,
          logo_url,
          is_featured,
          is_premium,
          listing_type,
          useful_listing_type,
          categories (
            name,
            slug
          )
        `
        )
        .eq('is_approved', true)
        .order('is_featured', { ascending: false })
        .order('is_premium', { ascending: false })
        .order('business_name', { ascending: true })
        .limit(8),

      supabase.from('site_settings').select('setting_key, setting_value'),
    ])

  const categories = (categoriesData ?? []) as Category[]
  const listings = (listingsData ?? []) as Listing[]
  const settings = (settingsData ?? []) as SiteSetting[]

  const heroTitle = getSetting(
    settings,
    'home_hero_title',
    'Find trusted local businesses, services and useful places in Ollerton'
  )

  const heroSubtitle = getSetting(
    settings,
    'home_hero_subtitle',
    'Ollerton Hub helps residents discover local businesses, community services, amenities and useful information in one easy place.'
  )

  const featuredListings = listings.filter(
    (listing) => listing.is_featured === true && listing.listing_type !== 'community'
  )

  const localAmenities = listings.filter(
    (listing) => listing.listing_type === 'community'
  )

  const otherListings = listings.filter(
    (listing) =>
      listing.listing_type !== 'community' && listing.is_featured !== true
  )

  const homepageListings = [
    ...featuredListings,
    ...localAmenities,
    ...otherListings,
  ].slice(0, 8)

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <section className="bg-stone-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
            Ollerton Hub
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            {heroTitle}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-200 sm:text-lg">
            {heroSubtitle}
          </p>

          <div className="mt-8 max-w-3xl">
            <HomeSearch />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/directory"
              className="rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800"
            >
              Browse directory
            </Link>

            <Link
              href="/register"
              className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white hover:text-stone-950"
            >
              Add your listing
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
          <InfoCard
            title="Local businesses"
            description="Find trades, shops, services and independent businesses in and around Ollerton."
          />

          <InfoCard
            title="Useful local places"
            description="Discover schools, places of worship, council services, recycling centres and community venues."
          />

          <InfoCard
            title="Community-first"
            description="Listings are reviewed so the directory stays useful, relevant and local."
          />
        </div>
      </section>

      <section className="px-4 pb-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
                Browse by category
              </p>
              <h2 className="mt-2 text-2xl font-bold text-stone-950">
                What are you looking for?
              </h2>
            </div>

            <Link
              href="/directory"
              className="text-sm font-bold text-red-700 hover:underline"
            >
              View all listings
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.length === 0 ? (
              <p className="rounded-2xl bg-white p-5 text-sm text-stone-600 shadow-sm">
                Categories will appear here once they have been added.
              </p>
            ) : (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/directory?category=${category.slug}`}
                  className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <h3 className="text-lg font-bold text-stone-950">
                    {category.name}
                  </h3>

                  {category.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-700">
                      {category.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      Browse local listings in this category.
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
                Featured and useful
              </p>
              <h2 className="mt-2 text-2xl font-bold text-stone-950">
                Recently highlighted listings
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">
                A mix of featured local businesses and useful community
                information.
              </p>
            </div>

            <Link
              href="/directory"
              className="text-sm font-bold text-red-700 hover:underline"
            >
              Open directory
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {homepageListings.length === 0 ? (
              <p className="rounded-2xl bg-white p-5 text-sm text-stone-600 shadow-sm">
                Listings will appear here once they have been approved.
              </p>
            ) : (
              homepageListings.map((listing) => {
                const isAmenity = listing.listing_type === 'community'

                return (
                  <Link
                    key={listing.id}
                    href={`/business/${listing.slug}`}
                    className="rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-200 text-sm font-bold text-stone-700">
                        {listing.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={listing.logo_url}
                            alt={`${listing.business_name} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          listing.business_name.charAt(0)
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-base font-bold text-stone-950">
                          {listing.business_name}
                        </h3>

                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-red-700">
                          {getListingLabel(listing)}
                        </p>
                      </div>
                    </div>

                    {listing.description ? (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-700">
                        {listing.description}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-stone-700">
                        View this {isAmenity ? 'local amenity' : 'local listing'}.
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {listing.town ? (
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                          {listing.town}
                        </span>
                      ) : null}

                      {isAmenity ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                          Local amenity
                        </span>
                      ) : null}

                      {listing.is_featured && !isAmenity ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          Featured
                        </span>
                      ) : null}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 rounded-3xl bg-stone-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Know a useful local place we should include?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-200">
              Businesses can submit their own listing. Local amenities and
              community information can be suggested for review.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800"
            >
              Add your business
            </Link>

            <Link
              href="/contact"
              className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white hover:text-stone-950"
            >
              Suggest an amenity
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function InfoCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-700">{description}</p>
    </div>
  )
}