'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
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
  listing_type: string | null
  status: string | null
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
  is_premium: boolean
  use_external_reviews: boolean | null
  external_review_platform: string | null
  external_review_url: string | null
}

type FormState = {
  business_name: string
  category_id: string
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
  is_featured: boolean
  is_premium: boolean
  use_external_reviews: boolean
  external_review_platform: string
  external_review_url: string
}

type ListingTier = 'free' | 'featured' | 'premium'

const WORD_LIMITS: Record<
  ListingTier,
  {
    description: number
    services: number
  }
> = {
  free: {
    description: 50,
    services: 40,
  },
  featured: {
    description: 120,
    services: 100,
  },
  premium: {
    description: 250,
    services: 200,
  },
}

const emptyForm: FormState = {
  business_name: '',
  category_id: '',
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
  is_featured: false,
  is_premium: false,
  use_external_reviews: false,
  external_review_platform: '',
  external_review_url: '',
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normaliseUrl(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) return ''

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue
  }

  return `https://${trimmedValue}`
}

function countWords(value: string | null | undefined) {
  if (!value) return 0

  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function getListingTier(
  form: Pick<FormState, 'is_featured' | 'is_premium'>
): ListingTier {
  if (form.is_premium) return 'premium'
  if (form.is_featured) return 'featured'
  return 'free'
}

function getTierLabel(tier: ListingTier) {
  if (tier === 'premium') return 'Premium'
  if (tier === 'featured') return 'Featured'
  return 'Free'
}

export default function BusinessDashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [business, setBusiness] = useState<Business | null>(null)
  const [ownedBusinesses, setOwnedBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notice, setNotice] = useState('')

  const isBusinessListing = (business?.listing_type ?? 'business') === 'business'

  const tier = isBusinessListing ? getListingTier(form) : 'free'
  const tierLabel = getTierLabel(tier)

  const descriptionWords = countWords(form.description)
  const servicesWords = countWords(form.services)

  const descriptionLimit = WORD_LIMITS[tier].description
  const servicesLimit = WORD_LIMITS[tier].services

  const descriptionOverLimit = descriptionWords > descriptionLimit
  const servicesOverLimit = servicesWords > servicesLimit

  useEffect(() => {
    loadPage()
  }, [])

  function loadBusinessIntoForm(loadedBusiness: Business) {
    setBusiness(loadedBusiness)
    setSelectedBusinessId(loadedBusiness.id)

    setForm({
      business_name: loadedBusiness.business_name ?? '',
      category_id: loadedBusiness.category_id ?? '',
      description: loadedBusiness.description ?? '',
      services: loadedBusiness.services ?? '',
      phone: loadedBusiness.phone ?? '',
      email: loadedBusiness.email ?? '',
      website: loadedBusiness.website ?? '',
      facebook: loadedBusiness.facebook ?? '',
      instagram: loadedBusiness.instagram ?? '',
      address_line_1: loadedBusiness.address_line_1 ?? '',
      address_line_2: loadedBusiness.address_line_2 ?? '',
      town: loadedBusiness.town ?? '',
      postcode: loadedBusiness.postcode ?? '',
      service_area: loadedBusiness.service_area ?? '',
      opening_times: loadedBusiness.opening_times ?? '',
      logo_url: loadedBusiness.logo_url ?? '',
      is_featured: loadedBusiness.is_featured ?? false,
      is_premium: loadedBusiness.is_premium ?? false,
      use_external_reviews: loadedBusiness.use_external_reviews ?? false,
      external_review_platform: loadedBusiness.external_review_platform ?? '',
      external_review_url: loadedBusiness.external_review_url ?? '',
    })
  }

  async function loadPage() {
    setLoading(true)
    setError('')
    setSuccess('')
    setNotice('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setError(userError.message)
      setLoading(false)
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true })

    if (categoryError) {
      setError(`Could not load categories: ${categoryError.message}`)
      setLoading(false)
      return
    }

    setCategories((categoryData as Category[] | null) ?? [])

    const { data: businessRows, error: businessError } = await supabase
      .from('businesses')
      .select(
        `
        id,
        business_name,
        slug,
        category_id,
        listing_type,
        status,
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
        is_featured,
        is_premium,
        use_external_reviews,
        external_review_platform,
        external_review_url
      `
      )
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (businessError) {
      setError(`Could not load your business listings: ${businessError.message}`)
      setLoading(false)
      return
    }

    const rows = (businessRows as Business[] | null) ?? []

    setOwnedBusinesses(rows)

    if (rows.length === 0) {
      setBusiness(null)
      setSelectedBusinessId('')
      setForm(emptyForm)
      setNotice(
        'No existing business listing was found for this signed-in account. You can create one below.'
      )
      setLoading(false)
      return
    }

    loadBusinessIntoForm(rows[0])

    if (rows.length > 1) {
      setNotice(
        'More than one business listing is assigned to this account. Use the dropdown below to choose which listing to edit.'
      )
    }

    setLoading(false)
  }

  function changeSelectedBusiness(event: ChangeEvent<HTMLSelectElement>) {
    const businessId = event.target.value
    const selectedBusiness = ownedBusinesses.find((item) => item.id === businessId)

    setError('')
    setSuccess('')
    setNotice('')

    if (!selectedBusiness) {
      setSelectedBusinessId(businessId)
      setError('Could not find the selected business listing.')
      return
    }

    loadBusinessIntoForm(selectedBusiness)
  }

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function updateCheckbox(event: ChangeEvent<HTMLInputElement>) {
    const { name, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: checked,
    }))
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    setError('')
    setSuccess('')
    setNotice('')
    setUploadingLogo(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setError(userError.message)
      setUploadingLogo(false)
      return
    }

    if (!user) {
      setUploadingLogo(false)
      router.push('/login')
      return
    }

    const fileExt = file.name.split('.').pop()
    const safeFileName = `${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${safeFileName}`

    const { error: uploadError } = await supabase.storage
      .from('business-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      setError(uploadError.message)
      setUploadingLogo(false)
      return
    }

    const { data } = supabase.storage
      .from('business-logos')
      .getPublicUrl(filePath)

    setForm((current) => ({
      ...current,
      logo_url: data.publicUrl,
    }))

    setUploadingLogo(false)
    setSuccess('Logo uploaded. Remember to save your listing.')
  }

  async function saveBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')
    setNotice('')

    if (!form.business_name.trim()) {
      setError('Business name is required.')
      return
    }

    if (!form.category_id) {
      setError('Please choose a category.')
      return
    }

    if (descriptionOverLimit) {
      setError(
        `${tierLabel} listings can use up to ${descriptionLimit} words in the description. Your description is currently ${descriptionWords} words.`
      )
      return
    }

    if (servicesOverLimit) {
      setError(
        `${tierLabel} listings can use up to ${servicesLimit} words in the services section. Your services section is currently ${servicesWords} words.`
      )
      return
    }

    const useExternalReviews = isBusinessListing && form.use_external_reviews
    const externalReviewUrl = normaliseUrl(form.external_review_url)

    if (useExternalReviews && !form.external_review_platform.trim()) {
      setError('Please choose the external review platform.')
      return
    }

    if (useExternalReviews && !externalReviewUrl) {
      setError('Please add your external review link, or turn external reviews off.')
      return
    }

    setSaving(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setError(userError.message)
      setSaving(false)
      return
    }

    if (!user) {
      setSaving(false)
      router.push('/login')
      return
    }

    const slug = makeSlug(form.business_name)

    if (!slug) {
      setError('Please enter a valid business name.')
      setSaving(false)
      return
    }

    const payload = {
      owner_id: user.id,
      business_name: form.business_name.trim(),
      slug,
      category_id: form.category_id || null,
      listing_type: business?.listing_type ?? 'business',
      description: form.description.trim() || null,
      services: form.services.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: normaliseUrl(form.website) || null,
      facebook: normaliseUrl(form.facebook) || null,
      instagram: normaliseUrl(form.instagram) || null,
      address_line_1: form.address_line_1.trim() || null,
      address_line_2: form.address_line_2.trim() || null,
      town: form.town.trim() || null,
      postcode: form.postcode.trim() || null,
      service_area: form.service_area.trim() || null,
      opening_times: form.opening_times.trim() || null,
      logo_url: form.logo_url.trim() || null,
      use_external_reviews: useExternalReviews,
      external_review_platform: useExternalReviews
        ? form.external_review_platform.trim()
        : null,
      external_review_url: useExternalReviews ? externalReviewUrl : null,
      is_approved: false,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }

    if (business) {
      const { data: updatedBusiness, error: updateError } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', business.id)
        .eq('owner_id', user.id)
        .select(
          `
          id,
          business_name,
          slug,
          category_id,
          listing_type,
          status,
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
          is_featured,
          is_premium,
          use_external_reviews,
          external_review_platform,
          external_review_url
        `
        )
        .single()

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      const updated = updatedBusiness as Business

      setOwnedBusinesses((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      )

      loadBusinessIntoForm(updated)
      setSuccess('Business listing saved. Changes are now awaiting approval.')
      setSaving(false)
      return
    }

    const { data: insertedBusiness, error: insertError } = await supabase
      .from('businesses')
      .insert({
        ...payload,
        is_featured: false,
        is_premium: false,
        created_at: new Date().toISOString(),
      })
      .select(
        `
        id,
        business_name,
        slug,
        category_id,
        listing_type,
        status,
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
        is_featured,
        is_premium,
        use_external_reviews,
        external_review_platform,
        external_review_url
      `
      )
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    const inserted = insertedBusiness as Business

    setOwnedBusinesses((current) => [inserted, ...current])
    loadBusinessIntoForm(inserted)

    setSuccess('Business listing created. It is now awaiting approval.')
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <div className="mx-auto max-w-5xl">
          <p>Loading business listing...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-stone-900 p-6 text-white">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-red-300 hover:text-red-200"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
                Business listing
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                {business ? 'Edit your listing' : 'Create your listing'}
              </h1>

              <p className="mt-3 max-w-2xl text-stone-200">
                Add your business details so local people can find your services
                in Ollerton Hub.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isBusinessListing && (
                <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-stone-900">
                  {tierLabel} listing
                </span>
              )}

              <StatusBadge business={business} />
            </div>
          </div>
        </section>

        {ownedBusinesses.length > 1 && (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <label className="block text-sm font-semibold uppercase tracking-wide text-red-700">
              Choose listing to edit
            </label>

            <select
              value={selectedBusinessId}
              onChange={changeSelectedBusiness}
              className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
            >
              {ownedBusinesses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.business_name || 'Unnamed listing'}
                </option>
              ))}
            </select>

            <p className="mt-2 text-sm text-stone-600">
              Select the business you want to update. The status badge above
              shows the approval status for the selected listing.
            </p>
          </section>
        )}

        {isBusinessListing && (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
                  Word limits
                </p>

                <h2 className="mt-1 text-xl font-bold text-stone-950">
                  Your current plan: {tierLabel}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                  Free listings have shorter descriptions. Featured and Premium
                  listings allow more space to describe your business and services.
                </p>
              </div>

              {!form.is_premium && (
                <Link
                  href="/contact"
                  className="inline-flex justify-center rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                >
                  Ask about upgrading
                </Link>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <LimitCard
                title="Description"
                used={descriptionWords}
                limit={descriptionLimit}
                overLimit={descriptionOverLimit}
              />

              <LimitCard
                title="Services"
                used={servicesWords}
                limit={servicesLimit}
                overLimit={servicesOverLimit}
              />
            </div>
          </section>
        )}

        <form
          onSubmit={saveBusiness}
          className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200"
        >
          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800 ring-1 ring-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-800 ring-1 ring-green-200">
              {success}
            </div>
          )}

          {notice && (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
              {notice}
            </div>
          )}

          <section className="grid gap-5 md:grid-cols-2">
            <TextInput
              label="Business name"
              name="business_name"
              value={form.business_name}
              onChange={updateField}
              required
            />

            <div>
              <label className="block text-sm font-semibold text-stone-800">
                Category
              </label>

              <select
                name="category_id"
                value={form.category_id}
                onChange={updateField}
                required
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
              >
                <option value="">Choose a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <TextInput
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={updateField}
            />

            <TextInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
            />

            <TextInput
              label="Website"
              name="website"
              value={form.website}
              onChange={updateField}
              placeholder="https://example.co.uk"
            />

            <TextInput
              label="Facebook"
              name="facebook"
              value={form.facebook}
              onChange={updateField}
              placeholder="https://facebook.com/your-page"
            />

            <TextInput
              label="Instagram"
              name="instagram"
              value={form.instagram}
              onChange={updateField}
              placeholder="https://instagram.com/your-page"
            />
          </section>

          <section>
            <label className="block text-sm font-semibold text-stone-800">
              Business description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows={5}
              className={`mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:ring-2 ${
                descriptionOverLimit
                  ? 'border-red-500 focus:border-red-600 focus:ring-red-100'
                  : 'border-stone-300 focus:border-red-600 focus:ring-red-100'
              }`}
              placeholder="Tell people what your business does."
            />

            <WordCounter
              used={descriptionWords}
              limit={descriptionLimit}
              overLimit={descriptionOverLimit}
            />
          </section>

          <section>
            <label className="block text-sm font-semibold text-stone-800">
              Services
            </label>

            <textarea
              name="services"
              value={form.services}
              onChange={updateField}
              rows={5}
              className={`mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:ring-2 ${
                servicesOverLimit
                  ? 'border-red-500 focus:border-red-600 focus:ring-red-100'
                  : 'border-stone-300 focus:border-red-600 focus:ring-red-100'
              }`}
              placeholder="List your main services."
            />

            <WordCounter
              used={servicesWords}
              limit={servicesLimit}
              overLimit={servicesOverLimit}
            />
          </section>

          {isBusinessListing && (
            <section className="rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200">
              <h2 className="text-lg font-bold text-stone-950">Reviews</h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
                You can collect reviews directly through Ollerton Hub, or send
                visitors to an existing review page such as Google, Trustpilot or
                Facebook.
              </p>

              <label className="mt-5 flex items-start gap-3">
                <input
                  type="checkbox"
                  name="use_external_reviews"
                  checked={form.use_external_reviews}
                  onChange={updateCheckbox}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-red-700 focus:ring-red-600"
                />

                <span>
                  <span className="block text-sm font-semibold text-stone-900">
                    Use an external review page
                  </span>

                  <span className="mt-1 block text-sm text-stone-600">
                    This will show a button to your chosen review platform on your
                    public listing.
                  </span>
                </span>
              </label>

              {form.use_external_reviews && (
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-stone-800">
                      Review platform
                    </label>

                    <select
                      name="external_review_platform"
                      value={form.external_review_platform}
                      onChange={updateField}
                      className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="">Choose a platform</option>
                      <option value="Google">Google</option>
                      <option value="Trustpilot">Trustpilot</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <TextInput
                    label="External review link"
                    name="external_review_url"
                    value={form.external_review_url}
                    onChange={updateField}
                    placeholder="https://..."
                  />
                </div>
              )}
            </section>
          )}

          <section className="grid gap-5 md:grid-cols-2">
            <TextInput
              label="Address line 1"
              name="address_line_1"
              value={form.address_line_1}
              onChange={updateField}
            />

            <TextInput
              label="Address line 2"
              name="address_line_2"
              value={form.address_line_2}
              onChange={updateField}
            />

            <TextInput
              label="Town"
              name="town"
              value={form.town}
              onChange={updateField}
            />

            <TextInput
              label="Postcode"
              name="postcode"
              value={form.postcode}
              onChange={updateField}
            />
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-stone-800">
                Service area
              </label>

              <textarea
                name="service_area"
                value={form.service_area}
                onChange={updateField}
                rows={4}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                placeholder="Example: Ollerton, Boughton, Edwinstowe and surrounding villages."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-800">
                Opening times
              </label>

              <textarea
                name="opening_times"
                value={form.opening_times}
                onChange={updateField}
                rows={4}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                placeholder="Example: Monday to Friday, 9am to 5pm."
              />
            </div>
          </section>

          <section className="rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200">
            <label className="block text-sm font-semibold text-stone-800">
              Business logo
            </label>

            <p className="mt-1 text-sm text-stone-600">
              Upload a clear square or landscape logo. JPG, PNG or WEBP works
              best.
            </p>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={uploadLogo}
              className="mt-4 block w-full text-sm text-stone-700 file:mr-4 file:rounded-xl file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-stone-800"
            />

            {uploadingLogo && (
              <p className="mt-3 text-sm text-stone-600">Uploading logo...</p>
            )}

            {form.logo_url && (
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={form.logo_url}
                  alt="Business logo preview"
                  className="h-20 w-20 rounded-2xl object-contain ring-1 ring-stone-200"
                />

                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      logo_url: '',
                    }))
                  }
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
                >
                  Remove logo
                </button>
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-stone-600">
              Saving changes will send your listing back for approval.
            </p>

            <button
              type="submit"
              disabled={saving || uploadingLogo}
              className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save listing'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function TextInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string
  name: keyof FormState
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-800">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
      />
    </div>
  )
}

function WordCounter({
  used,
  limit,
  overLimit,
}: {
  used: number
  limit: number
  overLimit: boolean
}) {
  return (
    <p
      className={`mt-2 text-xs font-medium ${
        overLimit ? 'text-red-700' : 'text-stone-500'
      }`}
    >
      {used} / {limit} words
    </p>
  )
}

function LimitCard({
  title,
  used,
  limit,
  overLimit,
}: {
  title: string
  used: number
  limit: number
  overLimit: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-4 ring-1 ${
        overLimit ? 'bg-red-50 ring-red-200' : 'bg-stone-50 ring-stone-200'
      }`}
    >
      <p className="text-sm font-semibold text-stone-900">{title}</p>

      <p
        className={`mt-1 text-sm ${
          overLimit ? 'text-red-700' : 'text-stone-600'
        }`}
      >
        {used} of {limit} words used
      </p>
    </div>
  )
}

function StatusBadge({ business }: { business: Business | null }) {
  if (!business) {
    return (
      <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
        New listing
      </span>
    )
  }

  const status = business.status?.toLowerCase()

  if (status === 'approved' || business.is_approved) {
    return (
      <span className="rounded-xl bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
        Approved
      </span>
    )
  }

  if (status === 'rejected') {
    return (
      <span className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-800">
        Rejected
      </span>
    )
  }

  return (
    <span className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
      Awaiting approval
    </span>
  )
}