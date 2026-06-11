'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: string
  name: string
}

type Business = {
  id: string
  business_name: string
  slug: string
  category_id: string | null
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
  is_approved: boolean
  is_featured: boolean
}

type BusinessStat = {
  event_type: string
}

const emptyBusiness: Business = {
  id: '',
  business_name: '',
  slug: '',
  category_id: null,
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
  is_approved: false,
  is_featured: false,
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: string
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <div className="text-2xl">{icon}</div>
      <p className="mt-3 text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-stone-900">{value}</p>
    </div>
  )
}

export default function DashboardBusinessPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [business, setBusiness] = useState<Business>(emptyBusiness)

  const [stats, setStats] = useState({
    profile_view: 0,
    website_click: 0,
    phone_click: 0,
    email_click: 0,
    facebook_click: 0,
    instagram_click: 0,
  })

  const publicListingUrl = useMemo(() => {
    if (!business.slug) return null
    return `/business/${business.slug}`
  }, [business.slug])

  useEffect(() => {
    loadPage()
  }, [])

  async function loadPage() {
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUserId(user.id)

    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true })

    setCategories((categoryData as Category[] | null) ?? [])

    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id,
        business_name,
        slug,
        category_id,
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
        is_approved,
        is_featured
      `)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (businessError) {
      setError(businessError.message)
      setLoading(false)
      return
    }

    if (businessData) {
      const loadedBusiness = businessData as Business
      setBusiness(loadedBusiness)
      await loadStats(loadedBusiness.id)
    }

    setLoading(false)
  }

  async function loadStats(businessId: string) {
    const { data } = await supabase
      .from('business_stats')
      .select('event_type')
      .eq('business_id', businessId)

    const statsData = (data as BusinessStat[] | null) ?? []

    const nextStats = {
      profile_view: 0,
      website_click: 0,
      phone_click: 0,
      email_click: 0,
      facebook_click: 0,
      instagram_click: 0,
    }

    statsData.forEach((item) => {
      if (item.event_type in nextStats) {
        nextStats[item.event_type as keyof typeof nextStats] += 1
      }
    })

    setStats(nextStats)
  }

  function updateField(field: keyof Business, value: string) {
    setBusiness((current) => ({
      ...current,
      [field]: value,
      ...(field === 'business_name' && !current.id
        ? { slug: makeSlug(value) }
        : {}),
    }))
  }

  async function uploadLogo(file: File) {
    if (!userId) return

    setUploading(true)
    setError('')
    setMessage('')

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `business-logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('logos').getPublicUrl(filePath)

    setBusiness((current) => ({
      ...current,
      logo_url: data.publicUrl,
    }))

    setMessage('Logo uploaded. Remember to save your business.')
    setUploading(false)
  }

  async function saveBusiness() {
    if (!userId) return

    setSaving(true)
    setError('')
    setMessage('')

    const slug = business.slug || makeSlug(business.business_name)

    const payload = {
      owner_id: userId,
      business_name: business.business_name.trim(),
      slug,
      category_id: business.category_id || null,
      description: business.description || null,
      services: business.services || null,
      phone: business.phone || null,
      email: business.email || null,
      website: business.website || null,
      facebook: business.facebook || null,
      instagram: business.instagram || null,
      address_line_1: business.address_line_1 || null,
      address_line_2: business.address_line_2 || null,
      town: business.town || null,
      postcode: business.postcode || null,
      service_area: business.service_area || null,
      opening_times: business.opening_times || null,
      logo_url: business.logo_url || null,
    }

    if (!payload.business_name) {
      setError('Business name is required.')
      setSaving(false)
      return
    }

    const query = business.id
      ? supabase.from('businesses').update(payload).eq('id', business.id)
      : supabase.from('businesses').insert(payload).select().single()

    const { data, error: saveError } = await query

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    if (data) {
      setBusiness(data as Business)
    } else {
      setBusiness((current) => ({
        ...current,
        slug,
      }))
    }

    setMessage('Business saved successfully.')
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-5xl">
          <p>Loading business dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Link href="/dashboard" className="text-sm text-red-700 underline">
            ← Back to dashboard
          </Link>

          <div className="mt-6 rounded-3xl bg-stone-900 p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
              Business owner area
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Manage your business listing
            </h1>

            <p className="mt-3 max-w-2xl text-stone-200">
              Update your public profile, contact details, opening times and
              logo.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {publicListingUrl && business.is_approved && (
                <Link
                  href={publicListingUrl}
                  className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                >
                  View public listing
                </Link>
              )}

              {!business.is_approved && business.id && (
                <span className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
                  Awaiting approval
                </span>
              )}

              {business.is_featured && (
                <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-stone-900">
                  Featured listing
                </span>
              )}
            </div>
          </div>
        </div>

{business.id && (
  <section className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
          Listing performance
        </p>

        <h2 className="mt-1 text-lg font-bold text-stone-900">
          How your listing is doing
        </h2>
      </div>

      {publicListingUrl && (
        <Link
          href={publicListingUrl}
          className="text-sm font-medium text-red-700 hover:underline"
        >
          View public listing →
        </Link>
      )}
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <div className="rounded-xl bg-white px-3 py-4 text-center ring-1 ring-stone-200">
        <p className="text-2xl font-bold">{stats.profile_view}</p>
        <p className="mt-1 text-xs text-stone-500">Views</p>
      </div>

      <div className="rounded-xl bg-white px-3 py-4 text-center ring-1 ring-stone-200">
        <p className="text-2xl font-bold">{stats.website_click}</p>
        <p className="mt-1 text-xs text-stone-500">Website</p>
      </div>

      <div className="rounded-xl bg-white px-3 py-4 text-center ring-1 ring-stone-200">
        <p className="text-2xl font-bold">{stats.phone_click}</p>
        <p className="mt-1 text-xs text-stone-500">Calls</p>
      </div>

      <div className="rounded-xl bg-white px-3 py-4 text-center ring-1 ring-stone-200">
        <p className="text-2xl font-bold">{stats.email_click}</p>
        <p className="mt-1 text-xs text-stone-500">Emails</p>
      </div>

      <div className="rounded-xl bg-white px-3 py-4 text-center ring-1 ring-stone-200">
        <p className="text-2xl font-bold">{stats.facebook_click}</p>
        <p className="mt-1 text-xs text-stone-500">Facebook</p>
      </div>

      <div className="rounded-xl bg-white px-3 py-4 text-center ring-1 ring-stone-200">
        <p className="text-2xl font-bold">{stats.instagram_click}</p>
        <p className="mt-1 text-xs text-stone-500">Instagram</p>
      </div>
    </div>
  </section>
)}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Business name</label>
              <input
                value={business.business_name}
                onChange={(event) =>
                  updateField('business_name', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Slug</label>
              <input
                value={business.slug}
                onChange={(event) => updateField('slug', makeSlug(event.target.value))}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Category</label>
              <select
                value={business.category_id ?? ''}
                onChange={(event) =>
                  updateField('category_id', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) uploadLogo(file)
                }}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />

              {business.logo_url && (
                <img
                  src={business.logo_url}
                  alt="Business logo preview"
                  className="mt-4 h-20 w-20 rounded-2xl object-cover ring-1 ring-stone-200"
                />
              )}

              {uploading && (
                <p className="mt-2 text-sm text-stone-500">Uploading...</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold">Description</label>
              <textarea
                value={business.description ?? ''}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                rows={5}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold">Services</label>
              <textarea
                value={business.services ?? ''}
                onChange={(event) => updateField('services', event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Phone</label>
              <input
                value={business.phone ?? ''}
                onChange={(event) => updateField('phone', event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Email</label>
              <input
                value={business.email ?? ''}
                onChange={(event) => updateField('email', event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Website</label>
              <input
                value={business.website ?? ''}
                onChange={(event) => updateField('website', event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Facebook</label>
              <input
                value={business.facebook ?? ''}
                onChange={(event) => updateField('facebook', event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Instagram</label>
              <input
                value={business.instagram ?? ''}
                onChange={(event) =>
                  updateField('instagram', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Address line 1</label>
              <input
                value={business.address_line_1 ?? ''}
                onChange={(event) =>
                  updateField('address_line_1', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Address line 2</label>
              <input
                value={business.address_line_2 ?? ''}
                onChange={(event) =>
                  updateField('address_line_2', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Town</label>
              <input
                value={business.town ?? ''}
                onChange={(event) => updateField('town', event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Postcode</label>
              <input
                value={business.postcode ?? ''}
                onChange={(event) => updateField('postcode', event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold">Service area</label>
              <input
                value={business.service_area ?? ''}
                onChange={(event) =>
                  updateField('service_area', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold">Opening times</label>
              <textarea
                value={business.opening_times ?? ''}
                onChange={(event) =>
                  updateField('opening_times', event.target.value)
                }
                rows={5}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
                placeholder={`Monday: 9am - 5pm
Tuesday: 9am - 5pm
Wednesday: 9am - 5pm`}
              />
            </div>
          </div>

          {error && (
            <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
              {message}
            </p>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={saveBusiness}
              disabled={saving}
              className="rounded-xl bg-red-700 px-6 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save business'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}