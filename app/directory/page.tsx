import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  business_name: string
  slug: string
  description: string | null
  town: string | null
  service_area: string | null
  is_featured: boolean
  categories: {
    name: string
  } | null
}

export default async function DirectoryPage() {
  const { data: businesses, error } = await supabase
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

  if (error) {
    return (
      <main className="min-h-screen bg-stone-50 p-6">
        <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Directory</h1>
          <p className="mt-4 text-red-600">Could not load businesses.</p>
          <p className="mt-2 text-sm text-stone-500">{error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="bg-stone-900 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm text-amber-300 underline">
            Back home
          </Link>

          <h1 className="mt-6 text-4xl font-bold">Local business directory</h1>

          <p className="mt-3 max-w-2xl text-stone-200">
            Browse approved local businesses in and around Ollerton.
          </p>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <input
              type="text"
              placeholder="Search will be connected soon..."
              className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-900"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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

                  <h2 className="text-lg font-bold">{business.business_name}</h2>

                  <p className="mt-2 line-clamp-3 text-sm text-stone-600">
                    {business.description ?? 'No description added yet.'}
                  </p>

                  <p className="mt-4 text-sm font-medium text-stone-700">
                    {business.service_area || business.town || 'Ollerton'}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl bg-white p-6 text-stone-600 shadow-sm ring-1 ring-stone-200 md:col-span-3">
                No approved businesses yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}