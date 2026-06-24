'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Amenity = {
  id: string
  business_name: string
  slug: string
  description: string | null
  services: string | null
  phone: string | null
  email: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  address_line_1: string | null
  address_line_2: string | null
  town: string | null
  postcode: string | null
  service_area: string | null
  opening_times: string | null
  logo_url: string | null
  cover_image_url: string | null
  listing_type: string | null
  useful_listing_type: string | null
  category_id: string | null
  status: string | null
  is_approved: boolean | null
  created_at: string | null
}

type Category = {
  id: string
  name: string
  slug: string
}

type FormState = {
  business_name: string
  description: string
  services: string
  phone: string
  email: string
  website: string
  facebook: string
  instagram: string
  address_line_1: string
  address_line_2: string
  town: string
  postcode: string
  service_area: string
  opening_times: string
  logo_url: string
  cover_image_url: string
  useful_listing_type: string
  category_id: string
}

const amenityTypes = [
  'School',
  'Place of worship',
  'Council service',
  'MP / Councillor',
  'Recycling centre',
  'Community group',
  'Charity',
  'Health service',
  'Emergency service',
  'Public service',
  'Other',
]

const emptyForm: FormState = {
  business_name: '',
  description: '',
  services: '',
  phone: '',
  email: '',
  website: '',
  facebook: '',
  instagram: '',
  address_line_1: '',
  address_line_2: '',
  town: '',
  postcode: '',
  service_area: '',
  opening_times: '',
  logo_url: '',
  cover_image_url: '',
  useful_listing_type: '',
  category_id: '',
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function cleanUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return null

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return `https://${trimmed}`
}

function normaliseNullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function formatDate(value: string | null) {
  if (!value) return 'Unknown date'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AdminAmenitiesPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null)

  const [form, setForm] = useState<FormState>(emptyForm)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadPage()
  }, [])

  async function loadPage() {
    setLoading(true)
    setError('')
    setSuccess('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)

    const [amenitiesResult, categoriesResult] = await Promise.all([
      supabase
        .from('businesses')
        .select(
          `
          id,
          business_name,
          slug,
          description,
          services,
          phone,
          email,
          website,
          facebook,
          instagram,
          address_line_1,
          address_line_2,
          town,
          postcode,
          service_area,
          opening_times,
          logo_url,
          cover_image_url,
          listing_type,
          useful_listing_type,
          category_id,
          status,
          is_approved,
          created_at
        `
        )
        .in('listing_type', ['community', 'local_info'])
        .order('business_name', { ascending: true }),

      supabase
        .from('categories')
        .select('id, name, slug')
        .order('name', { ascending: true }),
    ])

    if (amenitiesResult.data) setAmenities(amenitiesResult.data)
    if (categoriesResult.data) setCategories(categoriesResult.data)

    setLoading(false)
  }

  const filteredAmenities = useMemo(() => {
    const term = search.trim().toLowerCase()

    return amenities.filter((amenity) => {
      const matchesSearch =
        !term ||
        amenity.business_name.toLowerCase().includes(term) ||
        amenity.town?.toLowerCase().includes(term) ||
        amenity.useful_listing_type?.toLowerCase().includes(term)

      const matchesType =
        typeFilter === 'all' || amenity.useful_listing_type === typeFilter

      return matchesSearch && matchesType
    })
  }, [amenities, search, typeFilter])

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setEditingAmenity(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
  }

  function startEditing(amenity: Amenity) {
    setEditingAmenity(amenity)
    setError('')
    setSuccess('')

    setForm({
      business_name: amenity.business_name || '',
      description: amenity.description || '',
      services: amenity.services || '',
      phone: amenity.phone || '',
      email: amenity.email || '',
      website: amenity.website || '',
      facebook: amenity.facebook || '',
      instagram: amenity.instagram || '',
      address_line_1: amenity.address_line_1 || '',
      address_line_2: amenity.address_line_2 || '',
      town: amenity.town || '',
      postcode: amenity.postcode || '',
      service_area: amenity.service_area || '',
      opening_times: amenity.opening_times || '',
      logo_url: amenity.logo_url || '',
      cover_image_url: amenity.cover_image_url || '',
      useful_listing_type: amenity.useful_listing_type || '',
      category_id: amenity.category_id || '',
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    if (!form.business_name.trim()) {
      setError('Please enter a name for the local amenity.')
      setSaving(false)
      return
    }

    if (!form.useful_listing_type.trim()) {
      setError('Please choose a local amenity type.')
      setSaving(false)
      return
    }

    const baseSlug = slugify(form.business_name)

    const payload = {
      business_name: form.business_name.trim(),
      slug: editingAmenity?.slug || baseSlug,
      description: normaliseNullable(form.description),
      services: normaliseNullable(form.services),
      phone: normaliseNullable(form.phone),
      email: normaliseNullable(form.email),
      website: cleanUrl(form.website),
      facebook: cleanUrl(form.facebook),
      instagram: cleanUrl(form.instagram),
      address_line_1: normaliseNullable(form.address_line_1),
      address_line_2: normaliseNullable(form.address_line_2),
      town: normaliseNullable(form.town),
      postcode: normaliseNullable(form.postcode),
      service_area: normaliseNullable(form.service_area),
      opening_times: normaliseNullable(form.opening_times),
      logo_url: cleanUrl(form.logo_url),
      cover_image_url: cleanUrl(form.cover_image_url),
      listing_type: 'local_info',
      useful_listing_type: form.useful_listing_type,
      category_id: form.category_id || null,
      status: 'approved',
      is_approved: true,
      is_featured: false,
      updated_at: new Date().toISOString(),
    }

    if (editingAmenity) {
      const { error: updateError } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', editingAmenity.id)
        .in('listing_type', ['community', 'local_info'])

      if (updateError) {
        setError('We could not update this local amenity.')
        setSaving(false)
        return
      }

      setSuccess('Local amenity updated.')
    } else {
      const { error: insertError } = await supabase.from('businesses').insert({
        ...payload,
        created_at: new Date().toISOString(),
      })

      if (insertError) {
        setError(
          'We could not add this local amenity. If the name already exists, try making it more specific.'
        )
        setSaving(false)
        return
      }

      setSuccess('Local amenity added.')
    }

    resetForm()
    await loadPage()
    setSaving(false)
  }

  async function deleteAmenity(amenity: Amenity) {
    const confirmed = window.confirm(
      `Delete ${amenity.business_name}? This cannot be undone.`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', amenity.id)
      .in('listing_type', ['community', 'local_info'])

    if (deleteError) {
      setError('We could not delete this local amenity.')
      return
    }

    if (editingAmenity?.id === amenity.id) {
      resetForm()
    }

    setSuccess('Local amenity deleted.')
    await loadPage()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-stone-600">Loading local amenities...</p>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
          >
            Back to admin centre
          </Link>

          <Link
            href="/directory"
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
          >
            View directory
          </Link>
        </div>

        <header className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
            Admin centre
          </p>

          <h1 className="mt-3 text-3xl font-bold text-stone-950 md:text-4xl">
            Local amenities
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">
            Add and amend useful local information such as schools, places of
            worship, council services, recycling centres and community services.
            These are admin-managed and do not go through the business approval
            queue.
          </p>
        </header>

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-950">
                {editingAmenity ? 'Edit local amenity' : 'Add local amenity'}
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                This creates a local information listing, not a business
                listing.
              </p>
            </div>

            {editingAmenity && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                Cancel editing
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Name
                </span>
                <input
                  value={form.business_name}
                  onChange={(event) =>
                    updateField('business_name', event.target.value)
                  }
                  placeholder="Example Primary School"
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Amenity type
                </span>
                <select
                  value={form.useful_listing_type}
                  onChange={(event) =>
                    updateField('useful_listing_type', event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
                  required
                >
                  <option value="">Choose a type</option>
                  {amenityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Directory category
                </span>
                <select
                  value={form.category_id}
                  onChange={(event) =>
                    updateField('category_id', event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Town
                </span>
                <input
                  value={form.town}
                  onChange={(event) => updateField('town', event.target.value)}
                  placeholder="Ollerton"
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-stone-800">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-800">
                Services / useful information
              </span>
              <textarea
                value={form.services}
                onChange={(event) => updateField('services', event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Phone
                </span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Email
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Website
                </span>
                <input
                  value={form.website}
                  onChange={(event) =>
                    updateField('website', event.target.value)
                  }
                  placeholder="https://example.co.uk"
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Facebook
                </span>
                <input
                  value={form.facebook}
                  onChange={(event) =>
                    updateField('facebook', event.target.value)
                  }
                  placeholder="https://facebook.com/page"
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Address line 1
                </span>
                <input
                  value={form.address_line_1}
                  onChange={(event) =>
                    updateField('address_line_1', event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Address line 2
                </span>
                <input
                  value={form.address_line_2}
                  onChange={(event) =>
                    updateField('address_line_2', event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Postcode
                </span>
                <input
                  value={form.postcode}
                  onChange={(event) =>
                    updateField('postcode', event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm uppercase outline-none focus:border-red-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Service area
                </span>
                <input
                  value={form.service_area}
                  onChange={(event) =>
                    updateField('service_area', event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-stone-800">
                Opening times
              </span>
              <textarea
                value={form.opening_times}
                onChange={(event) =>
                  updateField('opening_times', event.target.value)
                }
                rows={3}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Logo URL
                </span>
                <input
                  value={form.logo_url}
                  onChange={(event) =>
                    updateField('logo_url', event.target.value)
                  }
                  placeholder="https://..."
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Cover image URL
                </span>
                <input
                  value={form.cover_image_url}
                  onChange={(event) =>
                    updateField('cover_image_url', event.target.value)
                  }
                  placeholder="https://..."
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {saving
                  ? 'Saving...'
                  : editingAmenity
                    ? 'Save changes'
                    : 'Add local amenity'}
              </button>

              {editingAmenity && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-950">
                Existing local amenities
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                {filteredAmenities.length} shown from {amenities.length} total.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search amenities..."
                className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
              />

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
              >
                <option value="all">All types</option>
                {amenityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredAmenities.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-stone-50 p-5 text-sm text-stone-600">
              No local amenities found.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filteredAmenities.map((amenity) => (
                <article
                  key={amenity.id}
                  className="rounded-2xl border border-stone-200 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-stone-950">
                          {amenity.business_name}
                        </h3>

                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                          {amenity.useful_listing_type || 'Local info'}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-stone-600">
                        {amenity.town || 'No town added'} · Added{' '}
                        {formatDate(amenity.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/business/${amenity.slug}`}
                        className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
                      >
                        View
                      </Link>

                      <button
                        type="button"
                        onClick={() => startEditing(amenity)}
                        className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteAmenity(amenity)}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}