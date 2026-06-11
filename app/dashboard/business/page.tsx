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
      setBusiness(businessData as Business)
    }

    setLoading(false)
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
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/dashboard" className="text-sm text-red-700 underline">
          ← Back to dashboard
        </Link>

        <section className="rounded-3xl bg-stone-900 p-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
            Business owner area
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Manage your business listing
          </h1>

          <p className="mt-3 max-w-2xl text-stone-200">
            Update your profile, contact details, logo, address and opening
            times.
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
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold text-stone-900">
            Business details
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormInput
              label="Business name"
              value={business.business_name}
              onChange={(value) => updateField('business_name', value)}
            />

            <FormInput
              label="Slug"
              value={business.slug}
              onChange={(value) => updateField('slug', makeSlug(value))}
            />

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

            <FormTextarea
              label="Description"
              value={business.description ?? ''}
              onChange={(value) => updateField('description', value)}
            />

            <FormTextarea
              label="Services"
              value={business.services ?? ''}
              onChange={(value) => updateField('services', value)}
            />

            <FormInput
              label="Phone"
              value={business.phone ?? ''}
              onChange={(value) => updateField('phone', value)}
            />

            <FormInput
              label="Email"
              value={business.email ?? ''}
              onChange={(value) => updateField('email', value)}
            />

            <FormInput
              label="Website"
              value={business.website ?? ''}
              onChange={(value) => updateField('website', value)}
            />

            <FormInput
              label="Facebook"
              value={business.facebook ?? ''}
              onChange={(value) => updateField('facebook', value)}
            />

            <FormInput
              label="Instagram"
              value={business.instagram ?? ''}
              onChange={(value) => updateField('instagram', value)}
            />

            <FormInput
              label="Address line 1"
              value={business.address_line_1 ?? ''}
              onChange={(value) => updateField('address_line_1', value)}
            />

            <FormInput
              label="Address line 2"
              value={business.address_line_2 ?? ''}
              onChange={(value) => updateField('address_line_2', value)}
            />

            <FormInput
              label="Town"
              value={business.town ?? ''}
              onChange={(value) => updateField('town', value)}
            />

            <FormInput
              label="Postcode"
              value={business.postcode ?? ''}
              onChange={(value) => updateField('postcode', value)}
            />

            <FormInput
              label="Service area"
              value={business.service_area ?? ''}
              onChange={(value) => updateField('service_area', value)}
              fullWidth
            />

            <FormTextarea
              label="Opening times"
              value={business.opening_times ?? ''}
              onChange={(value) => updateField('opening_times', value)}
              placeholder={`Monday: 9am - 5pm
Tuesday: 9am - 5pm
Wednesday: 9am - 5pm`}
            />
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

function FormInput({
  label,
  value,
  onChange,
  fullWidth = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <label className="text-sm font-semibold">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
      />
    </div>
  )
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="md:col-span-2">
      <label className="text-sm font-semibold">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
      />
    </div>
  )
}