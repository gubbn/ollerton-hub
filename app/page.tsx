import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
}

type Business = {
  id: string
  business_name: string
  slug: string
  description: string | null
  town: string | null
  is_featured: boolean
  categories: {
    name: string
  } | null
}

export default async function HomePage() {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .order('name')

  const { data: businesses } = await supabase
    .from('businesses')
    .select(`
      id,
      business_name,
      slug,
      description,
      town,
      is_featured,
      categories (
        name
      )
    `)
    .eq('is_approved', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="bg-stone-900 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-300">
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
              className="rounded-xl bg-amber-400 px-6 py-3 text-center font-semibold text-stone-950 hover:bg-amber-300"
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
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Search local businesses
            </label>

            <input
              type="text"
              placeholder="Search by name, service or category..."
              className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-900"
            />

            <p className="mt-2 text-sm text-stone-500">
              Search will be connected in the next step.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold">Browse by category</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(categories as Category[] | null)?.map((category) => (
              <Link
                key={category.id}
                href={`/directory?category=${category.slug}`}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 hover:shadow-md"
              >
                <h3 className="font-semibold">{category.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Featured local businesses</h2>

            <Link href="/directory" className="text-sm font-semibold underline">
              View all
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(businesses as Business[] | null)?.length ? (
              (businesses as Business[]).map((business) => (
                <Link
                  key={business.id}
                  href={`/business/${business.slug}`}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-stone-500">
                      {business.categories?.name ?? 'Local business'}
                    </p>

                    {business.is_featured && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Featured
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold">{business.business_name}</h3>

                  <p className="mt-2 line-clamp-3 text-sm text-stone-600">
                    {business.description ?? 'No description added yet.'}
                  </p>

                  <p className="mt-4 text-sm font-medium text-stone-700">
                    {business.town ?? 'Ollerton'}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl bg-white p-6 text-stone-600 shadow-sm ring-1 ring-stone-200 md:col-span-3">
                No approved businesses yet. Once listings are approved, they’ll appear here.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}