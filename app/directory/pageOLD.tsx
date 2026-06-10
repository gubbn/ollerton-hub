import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type CategoryRelation =
  | { name: string }
  | { name: string }[]
  | null

type Business = {
  id: string
  business_name: string
  slug: string
  description: string | null
  town: string | null
  service_area: string | null
  is_featured: boolean
  categories: CategoryRelation
}

function getCategoryName(categories: CategoryRelation) {
  if (!categories) return 'Local business'

  if (Array.isArray(categories)) {
    return categories[0]?.name ?? 'Local business'
  }

  return categories.name
}

export default async function DirectoryPage() {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      id,
      business_name,
      slug,
      description,
      town,
      service_area,
      is_featured,
      categories (
        name
      )
    `)
    .eq('is_approved', true)
    .order('is_featured', { ascending: false })
    .order('business_name')

  const businesses = (data as Business[] | null) ?? []

  if (error) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-bold">Directory</h1>
          <p className="mt-4 text-red-700">
            Failed to load businesses.
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {error.message}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <section className="bg-stone-900 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="text-sm font-semibold text-amber-300 underline"
          >
            ← Home
          </Link>

          <h1 className="mt-6 text-5xl font-bold">
            Local Business Directory
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-stone-300">
            Discover trusted businesses in Ollerton and surrounding areas.
          </p>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-200">
            <input
              type="text"
              placeholder="Search coming soon..."
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {businesses.length > 0 ? (
              businesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/business/${business.slug}`}
                  className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-200 transition hover:shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-500">
                      {getCategoryName(business.categories)}
                    </p>

                    {business.is_featured && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Featured
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-xl font-bold">
                    {business.business_name}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-sm text-stone-600">
                    {business.description ?? 'No description available.'}
                  </p>

                  <div className="mt-4 text-sm font-medium text-stone-700">
                    {business.service_area ||
                      business.town ||
                      'Ollerton'}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
                <h2 className="text-xl font-bold">
                  No businesses yet
                </h2>

                <p className="mt-2 text-stone-600">
                  Businesses will appear here once approved.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}