'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
  is_premium: boolean | null
  listing_type: string | null
  useful_listing_type: string | null
  categories: CategoryRelation
}

const amenityTypes = [
  'School',
  'Place of worship',
  'Council service',
  'MP / Councillor',
  'Recycling centre',
  'Community venue',
  'Emergency / public service',
  'Local information',
  'Other',
]

function isCommunityListing(listing: Listing) {
  return listing.listing_type === 'community'
}

function getCategoryName(categories: CategoryRelation) {
  if (!categories) return 'Local listing'

  if (Array.isArray(categories)) {
    return categories[0]?.name ?? 'Local listing'
  }

  return categories.name
}

function getCategorySlug(categories: CategoryRelation) {
  if (!categories) return ''

  if (Array.isArray(categories)) {
    return categories[0]?.slug ?? ''
  }

  return categories.slug
}

function getListingLabel(listing: Listing) {
  if (isCommunityListing(listing)) {
    return listing.useful_listing_type || 'Local information'
  }

  if (listing.is_premium) return 'Premium listing'
  if (listing.is_featured) return 'Featured listing'

  return getCategoryName(listing.categories)
}

function DirectoryContent() {
  const searchParams = useSearchParams()

  const initialSearch = searchParams.get('search') || ''
  const initialCategory = searchParams.get('category') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedTown, setSelectedTown] = useState('')

  useEffect(() => {
    loadDirectory()
  }, [])

  async function loadDirectory() {
    setLoading(true)
    setError('')

    const [
      { data: categoryData, error: categoryError },
      { data: listingData, error: listingError },
    ] = await Promise.all([
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
          service_area,
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
        .order('business_name', { ascending: true }),
    ])

    if (categoryError) {
      setError(categoryError.message)
      setCategories([])
    } else {
      setCategories((categoryData ?? []) as Category[])
    }

    if (listingError) {
      setError(listingError.message)
      setListings([])
    } else {
      setListings((listingData ?? []) as Listing[])
    }

    setLoading(false)
  }

  const towns = useMemo(() => {
    const uniqueTowns = new Set<string>()

    listings.forEach((listing) => {
      if (listing.town?.trim()) {
        uniqueTowns.add(listing.town.trim())
      }
    })

    return Array.from(uniqueTowns).sort((a, b) => a.localeCompare(b))
  }, [listings])

  const filteredListings = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return listings
      .filter((listing) => {
        const categoryName = getCategoryName(listing.categories)
        const categorySlug = getCategorySlug(listing.categories)

        const searchableText = [
          listing.business_name,
          listing.description,
          listing.town,
          listing.service_area,
          listing.useful_listing_type,
          categoryName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        const matchesSearch = searchTerm
          ? searchableText.includes(searchTerm)
          : true

        const matchesCategory = selectedCategory
          ? selectedCategory.startsWith('amenity:')
            ? isCommunityListing(listing) &&
              listing.useful_listing_type ===
                selectedCategory.replace('amenity:', '')
            : categorySlug === selectedCategory
          : true

        const matchesTown = selectedTown ? listing.town === selectedTown : true

        return matchesSearch && matchesCategory && matchesTown
      })
      .sort((a, b) => {
        const aIsCommunity = isCommunityListing(a)
        const bIsCommunity = isCommunityListing(b)

        const aFeatured = a.is_featured === true && !aIsCommunity
        const bFeatured = b.is_featured === true && !bIsCommunity

        const aPremium = a.is_premium === true && !aIsCommunity
        const bPremium = b.is_premium === true && !bIsCommunity

        if (aFeatured && !bFeatured) return -1
        if (!aFeatured && bFeatured) return 1

        if (aPremium && !bPremium) return -1
        if (!aPremium && bPremium) return 1

        return a.business_name.localeCompare(b.business_name)
      })
  }, [listings, search, selectedCategory, selectedTown])

  function clearFilters() {
    setSearch('')
    setSelectedCategory('')
    setSelectedTown('')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            Loading directory...
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
              Ollerton Hub
            </p>

            <h1 className="text-3xl font-bold text-stone-950">Directory</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">
              Search local businesses, services, schools, places of worship,
              community spaces and useful local information.
            </p>
          </div>

          <Link
            href="/register"
            className="rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800"
          >
            Add your business
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <div className="grid gap-4 lg:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold text-stone-800 lg:col-span-2">
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search businesses, schools, churches, recycling, food, trades..."
                className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Category or place type
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-red-700"
              >
                <option value="">All categories and places</option>

                {categories.length > 0 ? (
                  <optgroup label="Business categories">
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}

                <optgroup label="Useful local places">
                  {amenityTypes.map((type) => (
                    <option key={type} value={`amenity:${type}`}>
                      {type}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Town
              <select
                value={selectedTown}
                onChange={(event) => setSelectedTown(event.target.value)}
                className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-red-700"
              >
                <option value="">All towns</option>

                {towns.map((town) => (
                  <option key={town} value={town}>
                    {town}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-stone-700">
              {filteredListings.length}{' '}
              {filteredListings.length === 1 ? 'listing' : 'listings'} found
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="text-left text-sm font-bold text-red-700 hover:underline sm:text-right"
            >
              Clear filters
            </button>
          </div>
        </section>

        <section>
          {filteredListings.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <h2 className="text-xl font-bold text-stone-950">
                No listings found
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-700">
                Try a different search term, category or town.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredListings.map((listing) => {
                const categoryName = getCategoryName(listing.categories)
                const isCommunity = isCommunityListing(listing)

                return (
                  <Link
                    key={listing.id}
                    href={`/business/${listing.slug}`}
                    className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-200 text-lg font-bold text-stone-700">
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

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="line-clamp-2 text-lg font-bold text-stone-950">
                            {listing.business_name}
                          </h2>

                          {listing.is_featured && !isCommunity ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                              Featured
                            </span>
                          ) : null}

                          {listing.is_premium && !isCommunity ? (
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
                              Premium
                            </span>
                          ) : null}

                          {isCommunity ? (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                              Local info
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-red-700">
                          {getListingLabel(listing)}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
                          {listing.town ? (
                            <span className="rounded-full bg-stone-100 px-3 py-1">
                              {listing.town}
                            </span>
                          ) : null}

                          {categoryName ? (
                            <span className="rounded-full bg-stone-100 px-3 py-1">
                              {categoryName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {listing.description ? (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-700">
                        {listing.description}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-stone-700">
                        View this local listing.
                      </p>
                    )}

                    {listing.service_area ? (
                      <p className="mt-3 text-xs font-semibold text-stone-500">
                        Covers: {listing.service_area}
                      </p>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default function DirectoryPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
          <section className="mx-auto max-w-6xl">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              Loading directory...
            </div>
          </section>
        </main>
      }
    >
      <DirectoryContent />
    </Suspense>
  )
}