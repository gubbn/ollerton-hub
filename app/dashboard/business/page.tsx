'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Business = {
  id: string
  owner_id: string | null
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
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  is_premium: boolean | null
  listing_type: string | null
  useful_listing_type: string | null
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
}

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
}

function isAmenityListing(listing: Business) {
  return (
    listing.listing_type === 'community' ||
    listing.listing_type === 'local_info' ||
    !!listing.useful_listing_type
  )
}

function getWordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function getListingLimits(business: Business | null) {
  if (business?.is_premium) {
    return {
      description: 250,
      services: 200,
      label: 'Premium',
    }
  }

  if (business?.is_featured) {
    return {
      description: 120,
      services: 100,
      label: 'Featured',
    }
  }

  return {
    description: 50,
    services: 40,
    label: 'Free',
  }
}

function cleanUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return ''

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return `https://${trimmed}`
}

function normaliseNullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export default function BusinessEditPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadBusiness()
  }, [])

  async function loadBusiness() {
    setLoading(true)
    setError('')
    setSuccess('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.push('/login')
      return
    }

    const { data, error: businessError } = await supabase
      .from('businesses')
      .select(
        `
        id,
        owner_id,
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
        status,
        is_approved,
        is_featured,
        is_premium,
        listing_type,
        useful_listing_type
      `
      )
      .eq('owner_id', user.id)
      .or('listing_type.is.null,listing_type.eq.business')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (businessError) {
      setError('We could not load your business listing.')
      setLoading(false)
      return
    }

    if (!data) {
      setBusiness(null)
      setLoading(false)
      return
    }

    if (isAmenityListing(data)) {
      setBusiness(null)
      setError(
        'This page is only for editing business listings. Local amenities cannot be edited here.'
      )
      setLoading(false)
      return
    }

    setBusiness(data)

    setForm({
      business_name: data.business_name || '',
      description: data.description || '',
      services: data.services || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      address_line_1: data.address_line_1 || '',
      address_line_2: data.address_line_2 || '',
      town: data.town || '',
      postcode: data.postcode || '',
      service_area: data.service_area || '',
      opening_times: data.opening_times || '',
      logo_url: data.logo_url || '',
      cover_image_url: data.cover_image_url || '',
    })

    setLoading(false)
  }

  const limits = useMemo(() => getListingLimits(business), [business])

  const descriptionWordCount = useMemo(
    () => getWordCount(form.description),
    [form.description]
  )

  const servicesWordCount = useMemo(
    () => getWordCount(form.services),
    [form.services]
  )

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    if (!business) {
      setError('No business listing was found to update.')
      setSaving(false)
      return
    }

    if (isAmenityListing(business)) {
      setError('Local amenities cannot be edited from this page.')
      setSaving(false)
      return
    }

    if (!form.business_name.trim()) {
      setError('Please enter your business name.')
      setSaving(false)
      return
    }

    if (descriptionWordCount > limits.description) {
      setError(
        `Your description is too long. ${limits.label} listings can use up to ${limits.description} words.`
      )
      setSaving(false)
      return
    }

    if (servicesWordCount > limits.services) {
      setError(
        `Your services section is too long. ${limits.label} listings can use up to ${limits.services} words.`
      )
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        business_name: form.business_name.trim(),
        description: normaliseNullable(form.description),
        services: normaliseNullable(form.services),
        phone: normaliseNullable(form.phone),
        email: normaliseNullable(form.email),
        website: form.website.trim() ? cleanUrl(form.website) : null,
        facebook: form.facebook.trim() ? cleanUrl(form.facebook) : null,
        instagram: form.instagram.trim() ? cleanUrl(form.instagram) : null,
        address_line_1: normaliseNullable(form.address_line_1),
        address_line_2: normaliseNullable(form.address_line_2),
        town: normaliseNullable(form.town),
        postcode: normaliseNullable(form.postcode),
        service_area: normaliseNullable(form.service_area),
        opening_times: normaliseNullable(form.opening_times),
        logo_url: form.logo_url.trim() ? cleanUrl(form.logo_url) : null,
        cover_image_url: form.cover_image_url.trim()
          ? cleanUrl(form.cover_image_url)
          : null,

        // Keep this page business-only.
        listing_type: 'business',
        useful_listing_type: null,

        // Send edited listings back for review.
        status: 'pending',
        is_approved: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', business.id)
      .eq('owner_id', business.owner_id)
      .or('listing_type.is.null,listing_type.eq.business')

    if (updateError) {
      setError('We could not save your changes. Please try again.')
      setSaving(false)
      return
    }

    setSuccess(
      'Your changes have been saved and your listing is now waiting for approval.'
    )

    await loadBusiness()

    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-stone-600">Loading your listing...</p>
        </div>
      </main>
    )
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl space-y-6">
          <Link
            href="/dashboard"
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
          >
            Back to dashboard
          </Link>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
              No editable business found
            </p>

            <h1 className="mt-3 text-3xl font-bold text-stone-950">
              Business listing not found
            </h1>

            <p className="mt-4 text-sm leading-6 text-stone-600">
              We could not find a business listing linked to your account. This
              page is only for editing business listings. Local amenities and
              useful local information cannot be edited here.
            </p>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Create a business listing
              </Link>

              <Link
                href="/contact"
                className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                Contact support
              </Link>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
          >
            Back to dashboard
          </Link>

          <Link
            href={`/business/${business.slug}`}
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
          >
            View public listing
          </Link>
        </div>

        <header className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
                Edit business listing
              </p>

              <h1 className="mt-3 text-3xl font-bold text-stone-950 md:text-4xl">
                {business.business_name}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">
                Update your business details below. This page is for business
                listings only and cannot be used to edit local amenities.
              </p>
            </div>

            <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm">
              <p className="font-semibold text-stone-950">
                {limits.label} listing
              </p>

              <p className="mt-1 text-xs text-stone-500">
                Status:{' '}
                <span className="font-semibold capitalize text-stone-700">
                  {business.status || 'pending'}
                </span>
              </p>
            </div>
          </div>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-stone-950">
              Business details
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Business name
                </span>
                <input
                  value={form.business_name}
                  onChange={(event) =>
                    updateField('business_name', event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-800">
                  Town
                </span>
                <input
                  value={form.town}
                  onChange={(event) => updateField('town', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-stone-800">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                rows={5}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
              />
              <span
                className={`mt-1 block text-xs ${
                  descriptionWordCount > limits.description
                    ? 'text-red-600'
                    : 'text-stone-500'
                }`}
              >
                {descriptionWordCount}/{limits.description} words
              </span>
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-stone-800">
                Services
              </span>
              <textarea
                value={form.services}
                onChange={(event) => updateField('services', event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
              />
              <span
                className={`mt-1 block text-xs ${
                  servicesWordCount > limits.services
                    ? 'text-red-600'
                    : 'text-stone-500'
                }`}
              >
                {servicesWordCount}/{limits.services} words
              </span>
            </label>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-stone-950">
              Contact details
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
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
                  placeholder="https://facebook.com/your-page"
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-stone-800">
                  Instagram
                </span>
                <input
                  value={form.instagram}
                  onChange={(event) =>
                    updateField('instagram', event.target.value)
                  }
                  placeholder="https://instagram.com/your-page"
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-stone-950">
              Location and opening times
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
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
                  placeholder="Ollerton, Newark, Mansfield..."
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-stone-800">
                Opening times
              </span>
              <textarea
                value={form.opening_times}
                onChange={(event) =>
                  updateField('opening_times', event.target.value)
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500"
              />
            </label>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-stone-950">
              Images
            </h2>

            <p className="mt-2 text-sm text-stone-600">
              Paste image URLs for now. Logo uploads can be added later if
              needed.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
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
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-stone-950">
                  Save changes
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Saving changes will return your business listing to pending
                  approval.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  )
}