'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: string
  name: string
}

type PendingChangeValue = string | boolean | null

type PendingChanges = Record<string, PendingChangeValue>

type Business = {
  id: string
  business_name: string
  slug: string
  category_id: string | null
  listing_type: string | null
  useful_listing_type: string | null
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
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  is_premium: boolean | null
  use_external_reviews: boolean | null
  external_review_platform: string | null
  external_review_url: string | null
  pending_changes: PendingChanges | null
  pending_changed_fields: string[] | null
  has_pending_changes: boolean | null
  changes_submitted_at: string | null
  changes_submitted_by: string | null
  changes_reviewed_at: string | null
  changes_reviewed_by: string | null
  change_rejection_reason: string | null
}

type EditableBusinessField =
  | 'business_name'
  | 'slug'
  | 'category_id'
  | 'listing_type'
  | 'useful_listing_type'
  | 'description'
  | 'services'
  | 'phone'
  | 'email'
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'address_line_1'
  | 'address_line_2'
  | 'town'
  | 'postcode'
  | 'service_area'
  | 'opening_times'
  | 'logo_url'
  | 'status'
  | 'is_approved'
  | 'is_featured'
  | 'is_premium'
  | 'use_external_reviews'
  | 'external_review_platform'
  | 'external_review_url'

const BUSINESS_SELECT = `
  id,
  business_name,
  slug,
  category_id,
  listing_type,
  useful_listing_type,
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
  status,
  is_approved,
  is_featured,
  is_premium,
  use_external_reviews,
  external_review_platform,
  external_review_url,
  pending_changes,
  pending_changed_fields,
  has_pending_changes,
  changes_submitted_at,
  changes_submitted_by,
  changes_reviewed_at,
  changes_reviewed_by,
  change_rejection_reason
`

const REVIEWABLE_PENDING_FIELDS = [
  'business_name',
  'category_id',
  'description',
  'services',
  'logo_url',
  'use_external_reviews',
  'external_review_platform',
  'external_review_url',
  'listing_type',
  'useful_listing_type',
] as const

const APPROVABLE_PENDING_FIELDS = [
  ...REVIEWABLE_PENDING_FIELDS,
  'slug',
] as const

const FIELD_LABELS: Record<string, string> = {
  business_name: 'Business name',
  slug: 'Business URL',
  category_id: 'Category',
  listing_type: 'Listing type',
  useful_listing_type: 'Useful listing type',
  description: 'Description',
  services: 'Services',
  logo_url: 'Logo',
  use_external_reviews: 'Review settings',
  external_review_platform: 'External review platform',
  external_review_url: 'External review link',
}

function cleanTextValue(value: string | null | undefined) {
  const trimmedValue = (value ?? '').trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

function normaliseUrl(value: string | null | undefined) {
  const trimmedValue = (value ?? '').trim()

  if (!trimmedValue) return null

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue
  }

  return `https://${trimmedValue}`
}

function getPendingChanges(business: Business | null): PendingChanges {
  if (!business?.pending_changes) return {}
  if (Array.isArray(business.pending_changes)) return {}

  return business.pending_changes
}

function formatFieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field.replace(/_/g, ' ')
}

function formatDate(value: string | null) {
  if (!value) return 'Not recorded'

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusClasses(status: string | null) {
  if (status === 'approved') {
    return 'bg-green-100 text-green-800 ring-green-200'
  }

  if (status === 'rejected') {
    return 'bg-red-100 text-red-800 ring-red-200'
  }

  return 'bg-amber-100 text-amber-800 ring-amber-200'
}

function getCategoryName(categories: Category[], categoryId: string | null) {
  if (!categoryId) return 'No category selected'

  return (
    categories.find((category) => category.id === categoryId)?.name ??
    `Unknown category (${categoryId})`
  )
}

function getDisplayValue({
  field,
  value,
  categories,
}: {
  field: string
  value: PendingChangeValue | undefined
  categories: Category[]
}) {
  if (field === 'category_id') {
    return getCategoryName(categories, typeof value === 'string' ? value : null)
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (value === null || value === undefined || value === '') {
    return 'Empty'
  }

  return String(value)
}

function FieldValue({
  field,
  value,
  categories,
}: {
  field: string
  value: PendingChangeValue | undefined
  categories: Category[]
}) {
  const displayValue = getDisplayValue({ field, value, categories })

  if (field === 'logo_url' && typeof value === 'string' && value.trim()) {
    return (
      <div className="space-y-3">
        <img
          src={value}
          alt="Business logo preview"
          className="h-20 w-20 rounded-xl border border-stone-200 bg-white object-contain p-2"
        />
        <p className="break-words text-sm">{value}</p>
      </div>
    )
  }

  return <p className="whitespace-pre-wrap break-words text-sm">{displayValue}</p>
}

export default function ManageBusinessPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [adminUserId, setAdminUserId] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const pendingChanges = useMemo(() => getPendingChanges(business), [business])

  const pendingFields = useMemo(() => {
    const changedFields = business?.pending_changed_fields ?? []

    return changedFields.filter((field) =>
      REVIEWABLE_PENDING_FIELDS.includes(
        field as (typeof REVIEWABLE_PENDING_FIELDS)[number]
      )
    )
  }, [business])

  const hasPendingChanges =
    business?.has_pending_changes === true && pendingFields.length > 0

  useEffect(() => {
    loadBusiness()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  async function loadBusiness(showLoading = true) {
    if (showLoading) setLoading(true)
    setError('')
    setSuccess('')

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
      router.push('/')
      return
    }

    setAdminUserId(user.id)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (!profile?.is_admin) {
      router.push('/')
      return
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true })

    if (categoryError) {
      setError(categoryError.message)
      setLoading(false)
      return
    }

    setCategories((categoryData as Category[] | null) ?? [])

    const { data, error: businessError } = await supabase
      .from('businesses')
      .select(BUSINESS_SELECT)
      .eq('id', businessId)
      .single()

    if (businessError) {
      setError(businessError.message)
      setBusiness(null)
    } else {
      setBusiness(data as Business)
      setRejectionReason('')
    }

    setLoading(false)
  }

  function updateField(field: EditableBusinessField, value: string | boolean) {
    if (!business) return

    setBusiness({
      ...business,
      [field]: value,
    })
  }

  async function saveBusiness() {
    if (!business) return

    setSaving(true)
    setError('')
    setSuccess('')

    if (!business.business_name.trim()) {
      setError('Business name is required.')
      setSaving(false)
      return
    }

    if (!business.slug.trim()) {
      setError('Slug is required.')
      setSaving(false)
      return
    }

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        business_name: business.business_name.trim(),
        slug: business.slug.trim(),
        category_id: business.category_id || null,
        listing_type: cleanTextValue(business.listing_type),
        useful_listing_type: cleanTextValue(business.useful_listing_type),
        description: cleanTextValue(business.description),
        services: cleanTextValue(business.services),
        phone: cleanTextValue(business.phone),
        email: cleanTextValue(business.email),
        website: normaliseUrl(business.website),
        facebook: normaliseUrl(business.facebook),
        instagram: normaliseUrl(business.instagram),
        address_line_1: cleanTextValue(business.address_line_1),
        address_line_2: cleanTextValue(business.address_line_2),
        town: cleanTextValue(business.town),
        postcode: cleanTextValue(business.postcode),
        service_area: cleanTextValue(business.service_area),
        opening_times: cleanTextValue(business.opening_times),
        logo_url: cleanTextValue(business.logo_url),
        status: business.status || 'pending',
        is_approved: business.is_approved === true,
        is_featured: business.is_featured === true,
        is_premium: business.is_premium === true,
        use_external_reviews: business.use_external_reviews === true,
        external_review_platform: business.use_external_reviews
          ? cleanTextValue(business.external_review_platform)
          : null,
        external_review_url: business.use_external_reviews
          ? normaliseUrl(business.external_review_url)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', business.id)
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setSuccess('Business updated successfully.')
  }

  async function approveBusiness() {
    if (!business) return

    setSaving(true)
    setError('')
    setSuccess('')

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        status: 'approved',
        is_approved: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', business.id)
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setSuccess('Business approved.')
  }

  async function rejectBusiness() {
    if (!business) return

    const confirmed = window.confirm(
      `Reject ${business.business_name}? This will remove it from approved public listings.`
    )

    if (!confirmed) return

    setSaving(true)
    setError('')
    setSuccess('')

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        status: 'rejected',
        is_approved: false,
        pending_changes: {},
        pending_changed_fields: [],
        has_pending_changes: false,
        changes_reviewed_at: new Date().toISOString(),
        changes_reviewed_by: adminUserId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', business.id)
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setSuccess('Business rejected.')
  }

  async function toggleFeatured() {
    if (!business) return

    const newValue = !business.is_featured

    setSaving(true)
    setError('')
    setSuccess('')

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        is_featured: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', business.id)
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setSuccess(
      newValue ? 'Business marked as featured.' : 'Business removed from featured.'
    )
  }

  async function approvePendingChanges() {
    if (!business || !hasPendingChanges) return

    setSaving(true)
    setError('')
    setSuccess('')

    const approvedChanges: Record<string, PendingChangeValue> = {}

    Object.entries(pendingChanges).forEach(([field, value]) => {
      if (
        APPROVABLE_PENDING_FIELDS.includes(
          field as (typeof APPROVABLE_PENDING_FIELDS)[number]
        )
      ) {
        approvedChanges[field] = value as PendingChangeValue
      }
    })

    const now = new Date().toISOString()

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        ...approvedChanges,
        pending_changes: {},
        pending_changed_fields: [],
        has_pending_changes: false,
        changes_reviewed_at: now,
        changes_reviewed_by: adminUserId || null,
        change_rejection_reason: null,
        updated_at: now,
      })
      .eq('id', business.id)
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setRejectionReason('')
    setSuccess('Pending changes approved and published.')
  }

  async function rejectPendingChanges() {
    if (!business || !hasPendingChanges) return

    const confirmed = window.confirm(
      'Reject these pending changes? The currently approved listing will stay live.'
    )

    if (!confirmed) return

    setSaving(true)
    setError('')
    setSuccess('')

    const now = new Date().toISOString()

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        pending_changes: {},
        pending_changed_fields: [],
        has_pending_changes: false,
        changes_reviewed_at: now,
        changes_reviewed_by: adminUserId || null,
        change_rejection_reason: cleanTextValue(rejectionReason),
        updated_at: now,
      })
      .eq('id', business.id)
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setRejectionReason('')
    setSuccess('Pending changes rejected. The approved listing was left unchanged.')
  }

  async function deleteBusiness() {
    if (!business) return

    const confirmed = window.confirm(
      `Delete ${business.business_name}? This cannot be undone.`
    )

    if (!confirmed) return

    setSaving(true)
    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', business.id)

    setSaving(false)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    router.push('/admin/businesses')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <section className="mx-auto max-w-5xl">
          <p>Loading business...</p>
        </section>
      </main>
    )
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
        <section className="mx-auto max-w-5xl">
          <Link
            href="/admin/businesses"
            className="text-sm font-medium text-stone-700 hover:underline"
          >
            ← Back to businesses
          </Link>

          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error || 'Business not found.'}
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/admin/businesses"
          className="text-sm font-medium text-stone-700 hover:underline"
        >
          ← Back to businesses
        </Link>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${getStatusClasses(
                    business.status
                  )}`}
                >
                  {business.status || 'pending'}
                </span>

                {business.is_approved && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 ring-1 ring-green-200">
                    Approved
                  </span>
                )}

                {business.is_featured && (
                  <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white">
                    Featured
                  </span>
                )}

                {business.is_premium && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 ring-1 ring-purple-200">
                    Premium
                  </span>
                )}

                {business.has_pending_changes && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                    Changes pending review
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold text-stone-950">
                Manage {business.business_name}
              </h1>

              <p className="mt-2 text-sm text-stone-600">
                Public URL:{' '}
                <Link
                  href={`/business/${business.slug}`}
                  className="font-medium text-stone-900 underline"
                >
                  /business/{business.slug}
                </Link>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={approveBusiness}
                disabled={saving}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Approve listing
              </button>

              <button
                type="button"
                onClick={rejectBusiness}
                disabled={saving}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Reject listing
              </button>

              <button
                type="button"
                onClick={toggleFeatured}
                disabled={saving}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {business.is_featured ? 'Unfeature' : 'Feature'}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700 ring-1 ring-green-100">
              {success}
            </p>
          )}

          {!hasPendingChanges && business.change_rejection_reason && (
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
              <p className="font-semibold">Last change rejection note</p>
              <p className="mt-1 whitespace-pre-wrap">
                {business.change_rejection_reason}
              </p>
            </div>
          )}

          {hasPendingChanges && (
            <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-amber-950">
                    Changes awaiting review
                  </h2>

                  <p className="mt-1 text-sm text-amber-900">
                    The public listing is still showing the approved version.
                    Review the proposed changes below.
                  </p>

                  <p className="mt-2 text-xs text-amber-800">
                    Submitted: {formatDate(business.changes_submitted_at)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={approvePendingChanges}
                    disabled={saving}
                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Approve changes
                  </button>

                  <button
                    type="button"
                    onClick={rejectPendingChanges}
                    disabled={saving}
                    className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Reject changes
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {pendingFields.map((field) => {
                  const currentValue = business[field as keyof Business] as
                    | PendingChangeValue
                    | undefined
                  const proposedValue = pendingChanges[field]

                  return (
                    <div
                      key={field}
                      className="rounded-xl border border-amber-200 bg-white p-4"
                    >
                      <p className="text-sm font-bold text-stone-950">
                        {formatFieldLabel(field)}
                      </p>

                      {field === 'business_name' && pendingChanges.slug && (
                        <p className="mt-1 text-xs text-stone-500">
                          The public URL will also update to /business/{pendingChanges.slug}
                        </p>
                      )}

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                            Current approved
                          </p>
                          <div className="mt-1 rounded-lg bg-stone-100 p-3 text-stone-800">
                            <FieldValue
                              field={field}
                              value={currentValue}
                              categories={categories}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Proposed change
                          </p>
                          <div className="mt-1 rounded-lg bg-amber-100 p-3 text-amber-950">
                            <FieldValue
                              field={field}
                              value={proposedValue}
                              categories={categories}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <label className="mt-5 block text-sm font-semibold text-amber-950">
                Optional rejection note
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-amber-300 bg-white p-3 text-sm text-stone-900 outline-none focus:border-amber-500"
                  placeholder="Example: Please remove unsupported claims from the description."
                />
              </label>
            </section>
          )}

          <section className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-stone-950">
                  Approved/live listing details
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Edits saved here update the live business record directly. They
                  do not approve or reject owner-submitted pending changes.
                </p>
              </div>

              <button
                type="button"
                onClick={saveBusiness}
                disabled={saving}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save live details'}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-stone-700 md:col-span-2">
                Business name
                <input
                  value={business.business_name}
                  onChange={(event) =>
                    updateField('business_name', event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700 md:col-span-2">
                Slug
                <input
                  value={business.slug}
                  onChange={(event) => updateField('slug', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Category
                <select
                  value={business.category_id ?? ''}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    updateField('category_id', event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Status
                <select
                  value={business.status ?? 'pending'}
                  onChange={(event) => updateField('status', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Listing type
                <input
                  value={business.listing_type ?? ''}
                  onChange={(event) =>
                    updateField('listing_type', event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                  placeholder="business"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Useful listing type
                <input
                  value={business.useful_listing_type ?? ''}
                  onChange={(event) =>
                    updateField('useful_listing_type', event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                  placeholder="School, place of worship, council service..."
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700 md:col-span-2">
                Description
                <textarea
                  value={business.description ?? ''}
                  onChange={(event) =>
                    updateField('description', event.target.value)
                  }
                  rows={5}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700 md:col-span-2">
                Services
                <textarea
                  value={business.services ?? ''}
                  onChange={(event) => updateField('services', event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Phone
                <input
                  value={business.phone ?? ''}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Email
                <input
                  value={business.email ?? ''}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Website
                <input
                  value={business.website ?? ''}
                  onChange={(event) => updateField('website', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Facebook
                <input
                  value={business.facebook ?? ''}
                  onChange={(event) => updateField('facebook', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Instagram
                <input
                  value={business.instagram ?? ''}
                  onChange={(event) => updateField('instagram', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Logo URL
                <input
                  value={business.logo_url ?? ''}
                  onChange={(event) => updateField('logo_url', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              {business.logo_url && (
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-sm font-semibold text-stone-700">Current logo</p>
                  <img
                    src={business.logo_url}
                    alt={`${business.business_name} logo`}
                    className="mt-3 h-24 w-24 rounded-xl border border-stone-200 object-contain p-2"
                  />
                </div>
              )}

              <label className="block text-sm font-semibold text-stone-700">
                Address line 1
                <input
                  value={business.address_line_1 ?? ''}
                  onChange={(event) =>
                    updateField('address_line_1', event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Address line 2
                <input
                  value={business.address_line_2 ?? ''}
                  onChange={(event) =>
                    updateField('address_line_2', event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Town
                <input
                  value={business.town ?? ''}
                  onChange={(event) => updateField('town', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700">
                Postcode
                <input
                  value={business.postcode ?? ''}
                  onChange={(event) => updateField('postcode', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700 md:col-span-2">
                Service area
                <textarea
                  value={business.service_area ?? ''}
                  onChange={(event) =>
                    updateField('service_area', event.target.value)
                  }
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>

              <label className="block text-sm font-semibold text-stone-700 md:col-span-2">
                Opening times
                <textarea
                  value={business.opening_times ?? ''}
                  onChange={(event) =>
                    updateField('opening_times', event.target.value)
                  }
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 md:grid-cols-2">
              <label className="flex items-center gap-3 text-sm font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={business.is_approved === true}
                  onChange={(event) =>
                    updateField('is_approved', event.target.checked)
                  }
                />
                Approved
              </label>

              <label className="flex items-center gap-3 text-sm font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={business.is_featured === true}
                  onChange={(event) =>
                    updateField('is_featured', event.target.checked)
                  }
                />
                Featured
              </label>

              <label className="flex items-center gap-3 text-sm font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={business.is_premium === true}
                  onChange={(event) =>
                    updateField('is_premium', event.target.checked)
                  }
                />
                Premium business
              </label>

              <label className="flex items-center gap-3 text-sm font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={business.use_external_reviews === true}
                  onChange={(event) =>
                    updateField('use_external_reviews', event.target.checked)
                  }
                />
                Use external reviews instead of onsite reviews
              </label>
            </div>

            {business.use_external_reviews && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-stone-700">
                  External review platform
                  <input
                    value={business.external_review_platform ?? ''}
                    onChange={(event) =>
                      updateField('external_review_platform', event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                    placeholder="Trustpilot, Google, Facebook..."
                  />
                </label>

                <label className="block text-sm font-semibold text-stone-700">
                  External review URL
                  <input
                    value={business.external_review_url ?? ''}
                    onChange={(event) =>
                      updateField('external_review_url', event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
                    placeholder="https://..."
                  />
                </label>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={saveBusiness}
                disabled={saving}
                className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save live details'}
              </button>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="text-lg font-bold text-red-800">Danger Zone</h2>

            <p className="mt-1 text-sm text-red-700">
              Delete duplicate, test or spam listings. This cannot be undone.
            </p>

            <button
              type="button"
              onClick={deleteBusiness}
              disabled={saving}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Delete Business
            </button>
          </section>
        </div>
      </section>
    </main>
  )
}
