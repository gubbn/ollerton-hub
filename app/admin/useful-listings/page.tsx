'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: string
  name: string
}

type UsefulListing = {
  id: string
  business_name: string
  slug: string
  description: string | null
  phone: string | null
  email: string | null
  website: string | null
  address_line_1: string | null
  address_line_2: string | null
  town: string | null
  postcode: string | null
  service_area: string | null
  opening_times: string | null
  category_id: string | null
  useful_listing_type: string | null
  is_approved: boolean | null
  status: string | null
  created_at: string
}

const usefulTypes = [
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

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ensureWebsiteUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return null

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return `https://${trimmed}`
}

export default function UsefulListingsAdminPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [listings, setListings] = useState<UsefulListing[]>([])

  const [form, setForm] = useState({
    business_name: '',
    useful_listing_type: 'Local information',
    category_id: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    address_line_1: '',
    address_line_2: '',
    town: '',
    postcode: '',
    service_area: '',
    opening_times: '',
  })

  const previewSlug = useMemo(() => {
    return makeSlug(form.business_name)
  }, [form.business_name])

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    setLoading(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      setMessage(profileError.message)
      setLoading(false)
      return
    }

    if (!profile?.is_admin) {
      router.push('/dashboard')
      return
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .neq('name', 'Other')
      .order('name')

    if (categoryError) {
      setMessage(categoryError.message)
      setLoading(false)
      return
    }

    setCategories(categoryData ?? [])

    await loadListings()
    setLoading(false)
  }

  async function loadListings() {
    const { data, error } = await supabase
      .from('businesses')
      .select(
        `
        id,
        business_name,
        slug,
        description,
        phone,
        email,
        website,
        address_line_1,
        address_line_2,
        town,
        postcode,
        service_area,
        opening_times,
        category_id,
        useful_listing_type,
        is_approved,
        status,
        created_at
      `
      )
      .eq('listing_type', 'community')
      .order('business_name', { ascending: true })

    if (error) {
      setMessage(error.message)
      setListings([])
      return
    }

    setListings((data ?? []) as UsefulListing[])
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setForm({
      business_name: '',
      useful_listing_type: 'Local information',
      category_id: '',
      description: '',
      phone: '',
      email: '',
      website: '',
      address_line_1: '',
      address_line_2: '',
      town: '',
      postcode: '',
      service_area: '',
      opening_times: '',
    })
  }

  async function createListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setMessage('')

    if (!form.business_name.trim()) {
      setMessage('Please enter a name for the listing.')
      return
    }

    const baseSlug = makeSlug(form.business_name)

    if (!baseSlug) {
      setMessage('Please enter a valid listing name.')
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('You need to be logged in to add a useful listing.')
      setSaving(false)
      return
    }

    const slug = `${baseSlug}-${Date.now().toString().slice(-5)}`

    const { error } = await supabase.from('businesses').insert({
      owner_id: user.id,
      business_name: form.business_name.trim(),
      slug,
      listing_type: 'community',
      useful_listing_type: form.useful_listing_type || null,
      category_id: form.category_id || null,
      description: form.description.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: ensureWebsiteUrl(form.website),
      address_line_1: form.address_line_1.trim() || null,
      address_line_2: form.address_line_2.trim() || null,
      town: form.town.trim() || null,
      postcode: form.postcode.trim() || null,
      service_area: form.service_area.trim() || null,
      opening_times: form.opening_times.trim() || null,
      is_approved: true,
      status: 'approved',
      is_featured: false,
      is_premium: false,
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    resetForm()
    setMessage('Useful listing added.')
    await loadListings()
    setSaving(false)
  }

  async function deleteListing(id: string) {
    const confirmed = window.confirm('Delete this useful listing?')

    if (!confirmed) return

    setMessage('')

    const { error } = await supabase.from('businesses').delete().eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Useful listing deleted.')
    await loadListings()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            Loading useful listings...
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-stone-950">
              Useful local listings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">
              Add non-business information such as schools, places of worship,
              council services, recycling centres, community venues and local
              public services.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-800 shadow-sm hover:bg-stone-50"
          >
            Back to admin
          </Link>
        </div>

        {message ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm font-semibold text-stone-800 shadow-sm">
            {message}
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-stone-950">
            Add useful listing
          </h2>

          <form onSubmit={createListing} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Listing name
                <input
                  value={form.business_name}
                  onChange={(event) =>
                    updateField('business_name', event.target.value)
                  }
                  placeholder="Example: Ollerton Recycling Centre"
                  className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Useful listing type
                <select
                  value={form.useful_listing_type}
                  onChange={(event) =>
                    updateField('useful_listing_type', event.target.value)
                  }
                  className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                >
                  {usefulTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Directory category
                <select
                  value={form.category_id}
                  onChange={(event) =>
                    updateField('category_id', event.target.value)
                  }
                  className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                >
                  <option value="">No category selected</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                <p className="font-bold text-stone-900">Preview URL</p>
                <p className="mt-1 break-all">
                  /business/{previewSlug || 'listing-name'}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  A short unique number is added when saved.
                </p>
              </div>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                rows={5}
                placeholder="Add useful information for residents. Include what it is, who it helps, and anything people need to know before visiting or contacting them."
                className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Phone
                <input
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="Telephone number"
                  className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="Email address"
                  className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Website
                <input
                  value={form.website}
                  onChange={(event) =>
                    updateField('website', event.target.value)
                  }
                  placeholder="https://example.co.uk"
                  className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Address line 1
                <input
                  value={form.address_line_1}
                  onChange={(event) =>
                    updateField('address_line_1', event.target.value)
                  }
                  placeholder="Building / street"
                  className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Address line 2
                <input
                  value={form.address_line_2}
                  onChange={(event) =>
                    updateField('address_line_2', event.target.value)
                  }
                  placeholder="Area / extra address info"
                  className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Town
                <input
                  value={form.town}
                  onChange={(event) => updateField('town', event.target.value)}
                  placeholder="Ollerton"
                  className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Postcode
                <input
                  value={form.postcode}
                  onChange={(event) =>
                    updateField('postcode', event.target.value)
                  }
                  placeholder="Postcode"
                  className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Service area
                <input
                  value={form.service_area}
                  onChange={(event) =>
                    updateField('service_area', event.target.value)
                  }
                  placeholder="Ollerton, Boughton, Edwinstowe..."
                  className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Opening times / availability
              <textarea
                value={form.opening_times}
                onChange={(event) =>
                  updateField('opening_times', event.target.value)
                }
                rows={4}
                placeholder="Example: Monday to Friday, 9am to 5pm. Closed bank holidays."
                className="rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-red-700"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-stone-400 sm:w-fit"
            >
              {saving ? 'Adding listing...' : 'Add useful listing'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-950">
                Existing useful listings
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Manage community and public information entries.
              </p>
            </div>

            <p className="text-sm font-bold text-stone-700">
              {listings.length} total
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {listings.length === 0 ? (
              <p className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
                No useful listings have been added yet.
              </p>
            ) : (
              listings.map((listing) => (
                <article
                  key={listing.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-stone-950">
                          {listing.business_name}
                        </h3>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                          {listing.useful_listing_type || 'Useful listing'}
                        </span>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                          {listing.status || 'approved'}
                        </span>
                      </div>

                      <p className="mt-1 break-all text-sm text-stone-600">
                        /business/{listing.slug}
                      </p>

                      {listing.description ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-700">
                          {listing.description}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
                        {listing.town ? <span>{listing.town}</span> : null}
                        {listing.postcode ? <span>{listing.postcode}</span> : null}
                        {listing.website ? <span>Website added</span> : null}
                        {listing.phone ? <span>Phone added</span> : null}
                        {listing.email ? <span>Email added</span> : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/business/${listing.slug}`}
                        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-800 hover:bg-stone-100"
                      >
                        View
                      </Link>

                      <button
                        type="button"
                        onClick={() => deleteListing(listing.id)}
                        className="rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}