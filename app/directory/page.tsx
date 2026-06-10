'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type CategoryRelation = { name: string; slug: string } | { name: string; slug: string }[] | null

type Business = {
  id: string
  business_name: string
  slug: string
  description: string | null
  town: string | null
  service_area: string | null
  logo_url: string | null
  is_featured: boolean
  categories: CategoryRelation
}

type Category = {
  id: string
  name: string
  slug: string
}

function getCategory(categories: CategoryRelation) {
  if (!categories) return null
  if (Array.isArray(categories)) return categories[0] ?? null
  return categories
}

export default function DirectoryPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [town, setTown] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDirectory() {
      const { data: businessData } = await supabase
        .from('businesses')
        .select(`
          id,
          business_name,
          slug,
          description,
          town,
          service_area,
          logo_url,
          is_featured,
          categories (
            name,
            slug
          )
        `)
        .eq('is_approved', true)
        .order('is_featured', { ascending: false })
        .order('business_name')

      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')

      setBusinesses((businessData as unknown as Business[]) ?? [])
      setCategories((categoryData as Category[] | null) ?? [])
      setLoading(false)
    }

    loadDirectory()
  }, [])

  const towns = useMemo(() => {
    return Array.from(
      new Set(
        businesses
          .map((business) => business.town)
          .filter((value): value is string => Boolean(value))
      )
    ).sort()
  }, [businesses])

  const filteredBusinesses = useMemo(() => {
    const searchValue = search.toLowerCase().trim()

    return businesses.filter((business) => {
      const businessCategory = getCategory(business.categories)

      const matchesSearch =
        !searchValue ||
        business.business_name.toLowerCase().includes(searchValue) ||
        business.description?.toLowerCase().includes(searchValue) ||
        business.service_area?.toLowerCase().includes(searchValue) ||
        businessCategory?.name.toLowerCase().includes(searchValue)

      const matchesCategory =
        !category || businessCategory?.slug === category

      const matchesTown = !town || business.town === town

      return matchesSearch && matchesCategory && matchesTown
    })
  }, [businesses, search, category, town])

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <section className="bg-stone-900 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="text-sm font-semibold text-red-300 underline">
            ← Home
          </Link>

          <h1 className="mt-6 text-5xl font-bold">Local Business Directory</h1>

          <p className="mt-4 max-w-2xl text-lg text-stone-300">
            Search trusted local businesses in Ollerton and surrounding areas.
          </p>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-200">
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="text"
                placeholder="Search by name, service or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 focus:border-stone-900 focus:outline-none"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={town}
                onChange={(e) => setTown(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 focus:border-stone-900 focus:outline-none"
              >
                <option value="">All towns</option>
                {towns.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-4 text-sm text-stone-600">
              Showing {filteredBusinesses.length} business
              {filteredBusinesses.length === 1 ? '' : 'es'}
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
                Loading businesses...
              </div>
            ) : filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => {
                const businessCategory = getCategory(business.categories)

                return (
                  <Link
                    key={business.id}
                    href={`/business/${business.slug}`}
                    className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-stone-200 transition hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
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
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-stone-500">
                            {businessCategory?.name ?? 'Local business'}
                          </p>

                          {business.is_featured && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              Featured
                            </span>
                          )}
                        </div>

                        <h2 className="mt-2 text-xl font-bold">
                          {business.business_name}
                        </h2>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm text-stone-600">
                      {business.description ?? 'No description available.'}
                    </p>

                    <p className="mt-4 text-sm font-medium text-stone-700">
                      {business.service_area || business.town || 'Ollerton'}
                    </p>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-full rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
                <h2 className="text-xl font-bold">No businesses found</h2>
                <p className="mt-2 text-stone-600">
                  Try changing your search or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}