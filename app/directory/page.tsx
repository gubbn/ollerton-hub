'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
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

type Listing = {
  id: string
  business_name: string
  slug: string
  description: string | null
  town: string | null
  service_area: string | null
  logo_url: string | null
  is_featured: boolean | null
  listing_type: string | null
  useful_listing_type: string | null
  categories: CategoryRelation
}

function getCategoryName(categories: CategoryRelation) {
  if (!categories) return 'Local listing'
  if (Array.isArray(categories)) return categories[0]?.name ?? 'Local listing'
  return categories.name
}

function getCategorySlug(categories: CategoryRelation) {
  if (!categories) return ''
  if (Array.isArray(categories)) return categories[0]?.slug ?? ''
  return categories.slug
}

function getListingTypeLabel(listing: Listing) {
  if (listing.useful_listing_type) return listing.useful_listing_type
  return getCategoryName(listing.categories)
}

function cleanSearchValue(value: string | null) {
  return value?.trim() ?? ''
}

function normalise(value: string | null | undefined) {
  return (value || '').toLowerCase().trim()
}

function isOtherCategory(category: Category) {
  return (
    category.slug.toLowerCase() === 'other' ||
    category.name.toLowerCase() === 'other'
  )
}

function getStrictLocalInfoSearchType(search: string) {
  const value = normalise(search)

  if (['school', 'schools'].includes(value)) {
    return 'school'
  }

  if (
    [
      'place of worship',
      'places of worship',
      'church',
      'churches',
      'worship',
    ].includes(value)
  ) {
    return 'place of worship'
  }

  if (
    [
      'council',
      'council service',
      'council services',
      'local council',
    ].includes(value)
  ) {
    return 'council service'
  }

  if (
    [
      'mp',
      'councillor',
      'councillors',
      'mp councillor',
      'mp / councillor',
    ].includes(value)
  ) {
    return 'mp / councillor'
  }

  if (
    [
      'recycling',
      'recycling centre',
      'recycling centres',
      'tip',
      'waste',
    ].includes(value)
  ) {
    return 'recycling centre'
  }

  return null
}

function DirectoryContent() {
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()

  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')

  const [search, setSearch] = useState(cleanSearchValue(searchParams.get('q')))
  const [categoryFilter, setCategoryFilter] = useState(
    cleanSearchValue(searchParams.get('category'))
  )
  const [townFilter, setTownFilter] = useState(
    cleanSearchValue(searchParams.get('town'))
  )

  useEffect(() => {
    setSearch(cleanSearchValue(searchParams.get('q')))
    setCategoryFilter(cleanSearchValue(searchParams.get('category')))
    setTownFilter(cleanSearchValue(searchParams.get('town')))
  }, [queryString, searchParams])

  useEffect(() => {
    loadDirectory()
  }, [])

  async function loadDirectory() {
    setLoading(true)
    setError('')

    const [categoriesResult, listingsResult] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, description')
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
          service_area,
          logo_url,
          is_featured,
          listing_type,
          useful_listing_type,
          categories (
            name,
            slug
          )
        `
        )
        .eq('is_approved', true)
        .order('business_name', { ascending: true }),
    ])

    if (categoriesResult.error) {
      setError(categoriesResult.error.message)
    } else {
      const visibleCategories = ((categoriesResult.data || []) as Category[]).filter(
        (category) => !isOtherCategory(category)
      )

      setCategories(visibleCategories)
    }

    if (listingsResult.error) {
      setError(listingsResult.error.message)
      setListings([])
    } else {
      const alphabeticalListings = ((listingsResult.data || []) as Listing[]).sort(
        (a, b) => a.business_name.localeCompare(b.business_name)
      )

      setListings(alphabeticalListings)
    }

    setLoading(false)
  }

  const towns = useMemo(() => {
    return Array.from(
      new Set(
        listings
          .map((listing) => listing.town?.trim())
          .filter((town): town is string => Boolean(town))
      )
    ).sort((a, b) => a.localeCompare(b))
  }, [listings])

  const filteredListings = useMemo(() => {
    const searchTerm = search.toLowerCase().trim()
    const strictLocalInfoType = getStrictLocalInfoSearchType(searchTerm)

    return listings
      .filter((listing) => {
        const categoryName = getCategoryName(listing.categories)
        const categorySlug = getCategorySlug(listing.categories)

        const matchesCategory = categoryFilter
          ? categorySlug === categoryFilter
          : true

        const matchesTown = townFilter ? listing.town === townFilter : true

        if (!matchesCategory || !matchesTown) {
          return false
        }

        if (strictLocalInfoType) {
          return normalise(listing.useful_listing_type) === strictLocalInfoType
        }

        const searchableText = `
          ${listing.business_name}
          ${listing.description || ''}
          ${listing.town || ''}
          ${listing.service_area || ''}
          ${categoryName}
          ${listing.useful_listing_type || ''}
        `.toLowerCase()

        const matchesSearch = searchTerm
          ? searchableText.includes(searchTerm)
          : true

        return matchesSearch
      })
      .sort((a, b) => a.business_name.localeCompare(b.business_name))
  }, [listings, search, categoryFilter, townFilter])

  function clearFilters() {
    setSearch('')
    setCategoryFilter('')
    setTownFilter('')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
        <section className="mx-auto max-w-[1500px]">
          <p>Loading directory...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
      <section className="mx-auto max-w-[1500px]">
        <div className="rounded-3xl bg-stone-900 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
            Ollerton Hub Directory
          </p>

          <h1 className="mt-2 text-2xl font-bold md:text-3xl">
            Find local businesses and useful local information
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-200">
            Search local businesses, services, schools, places of worship,
            community listings and useful contacts around Ollerton.
          </p>
        </div>

        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
          <div className="grid gap-3 lg:grid-cols-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, service or description..."
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-red-600 lg:col-span-2"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-red-600"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={townFilter}
              onChange={(event) => setTownFilter(event.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-red-600"
            >
              <option value="">All towns</option>
              {towns.map((town) => (
                <option key={town} value={town}>
                  {town}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">
              Showing {filteredListings.length} of {listings.length} listings,
              alphabetically.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Clear filters
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Local amenities
              </p>

              <h2 className="mt-1 text-lg font-bold text-stone-950">
                Schools, places of worship and useful local information
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Quickly find local amenities such as schools, places of worship,
                council services, recycling centres and community information.
              </p>
            </div>

            <Link
              href="/contact?topic=local-info"
              className="inline-flex justify-center rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Suggest local info
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/directory?q=school"
              className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200"
            >
              Schools
            </Link>

            <Link
              href="/directory?q=place%20of%20worship"
              className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200"
            >
              Places of worship
            </Link>

            <Link
              href="/directory?q=council"
              className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200"
            >
              Council services
            </Link>

            <Link
              href="/directory?q=recycling"
              className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200"
            >
              Recycling centres
            </Link>

            <Link
              href="/directory?q=mp"
              className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200"
            >
              MP / councillors
            </Link>
          </div>
        </section>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {filteredListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/business/${listing.slug}`}
              className="group rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-2.5">
                {listing.logo_url ? (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={listing.logo_url}
                      alt={`${listing.business_name} logo`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold leading-snug text-stone-950 group-hover:text-red-700">
                    {listing.business_name}
                  </h2>

                  <ListingBadges
                    isFeatured={listing.is_featured}
                    listingType={listing.listing_type}
                    usefulListingType={listing.useful_listing_type}
                    className="mt-1.5"
                  />

                  <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
                    {getListingTypeLabel(listing)}
                  </p>
                </div>
              </div>

              {listing.description ? (
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-stone-600">
                  {listing.description}
                </p>
              ) : (
                <p className="mt-3 text-xs leading-5 text-stone-600">
                  View this local listing.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {listing.town ? (
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                    {listing.town}
                  </span>
                ) : null}

                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                  {getCategoryName(listing.categories)}
                </span>
              </div>
            </Link>
          ))}
        </section>

        {filteredListings.length === 0 && !error ? (
          <section className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200">
            <h2 className="text-xl font-bold text-stone-900">
              No listings found
            </h2>

            <p className="mt-2 text-sm text-stone-600">
              Try changing your search, category or town filter.
            </p>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default function DirectoryPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
          <section className="mx-auto max-w-[1500px]">
            <p>Loading directory...</p>
          </section>
        </main>
      }
    >
      <DirectoryContent />
    </Suspense>
  )
}