import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
}

type CategoryRelation = { name: string } | { name: string }[] | null

type Business = {
  id: string
  business_name: string
  slug: string
  description: string | null
  town: string | null
  logo_url: string | null
  is_featured: boolean
  categories: CategoryRelation
}

function getCategoryName(categories: CategoryRelation) {
  if (!categories) return 'Local business'
  if (Array.isArray(categories)) return categories[0]?.name ?? 'Local business'
  return categories.name
}

export default async function HomePage() {
  const { data: categoryData } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .order('name')

  const { data: businessData } = await supabase
    .from('businesses')
    .select(`
      id,
      business_name,
      slug,
      description,
      town,
      logo_url,
      is_featured,
      categories (
        name
      )
    `)
    .eq('is_approved', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6)

  const categories = (categoryData as Category[] | null) ?? []
  const businesses = (businessData as Business[] | null) ?? []

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <section className="bg-stone-900 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-300">
            Ollerton Local Business Directory
          </p>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Find trusted local businesses in and around Ollerton.
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-stone-200">
            Discover local services, shops, trades, food, fitness, technology and more.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/directory"
              className="rounded-xl bg-red-700 px-6 py-3 text-center font-semibold text-white hover:bg-red-800"
            >
              Browse businesses
            </Link>

            <Link
              href="/register"
              className="rounded-xl border border-white/30 px-6 py-3 text-center font-semibold text-white hover:bg-white/10"
            >
              Add your business
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-200">
            <label className="mb-2 block text-sm font-semibold text-stone-700">
              Search local businesses
            </label>

            <input
              type="text"
              placeholder="Search by name, service or category..."
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
            />

            <p className="mt-2 text-sm text-stone-600">
              Search is available on the directory page.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-stone-900">
            Browse by category
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/directory?category=${category.slug}`}
                className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-stone-200 transition hover:shadow-xl"
              >
                <h3 className="font-semibold text-stone-900">
                  {category.name}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                  {category.description ?? 'Browse local businesses.'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-8 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-stone-900">
              Featured local businesses
            </h2>

            <Link href="/directory" className="text-sm font-semibold underline">
              View all
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {businesses.length > 0 ? (
              businesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/business/${business.slug}`}
                  className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-200 transition hover:shadow-xl"
                >
                  <div className="mb-4 flex items-center gap-4">
                    {business.logo_url ? (
                      <img
                        src={business.logo_url}
                        alt={`${business.business_name} logo`}
                        className="h-16 w-16 rounded-2xl object-cover ring-1 ring-stone-200"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-xl font-bold text-stone-500 ring-1 ring-stone-200">
                        {business.business_name.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-500">
                        {getCategoryName(business.categories)}
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-stone-900">
                        {business.business_name}
                      </h3>
                    </div>
                  </div>

                  {business.is_featured && (
                    <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Featured
                    </span>
                  )}

                  <p className="mt-2 line-clamp-3 text-sm text-stone-600">
                    {business.description ?? 'No description added yet.'}
                  </p>

                  <p className="mt-4 text-sm font-medium text-stone-700">
                    {business.town ?? 'Ollerton'}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl bg-white p-6 text-stone-600 shadow-lg ring-1 ring-stone-200 md:col-span-3">
                No approved businesses yet. Once listings are approved, they’ll appear here.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}