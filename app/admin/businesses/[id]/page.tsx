'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  getRenewedExpiryDate,
  getThirtyDaysFromNow,
} from '@/lib/paidTierHelpers'

type ListingTier = 'free' | 'featured'

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
  paid_tier: ListingTier | null
  paid_tier_started_at: string | null
  paid_tier_expires_at: string | null
  paid_tier_renewed_at: string | null
  paid_tier_last_downgraded_at: string | null
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
  rejection_reason: string | null
  rejected_at: string | null
  rejected_by: string | null
}

type EditableBusinessField =
  | 'business_name'
  | 'slug'
  | 'category_id'
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
  paid_tier,
  paid_tier_started_at,
  paid_tier_expires_at,
  paid_tier_renewed_at,
  paid_tier_last_downgraded_at,
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
  change_rejection_reason,
  rejection_reason,
  rejected_at,
  rejected_by
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
] as const

const APPROVABLE_PENDING_FIELDS = [
  ...REVIEWABLE_PENDING_FIELDS,
  'slug',
] as const

const FIELD_LABELS: Record<string, string> = {
  business_name: 'Business name',
  slug: 'Business URL',
  category_id: 'Category',
  description: 'Description',
  services: 'Services',
  logo_url: 'Logo',
  use_external_reviews: 'Review settings',
  external_review_platform: 'External review platform',
  external_review_url: 'External review link',
}

function cleanTextValue(value: string | null | undefined) {
  const trimmed = (value ?? '').trim()
  return trimmed.length > 0 ? trimmed : null
}

function normaliseUrl(value: string | null | undefined) {
  const trimmed = (value ?? '').trim()

  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

function isLocalAmenity(listing: Business) {
  return (
    listing.listing_type === 'community' ||
    listing.listing_type === 'local_info' ||
    !!listing.useful_listing_type
  )
}

function getPendingChanges(business: Business | null): PendingChanges {
  if (!business?.pending_changes) return {}
  if (Array.isArray(business.pending_changes)) return {}

  return business.pending_changes
}

function formatDate(value: string | null) {
  if (!value) return 'Not recorded'

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatFieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field.replace(/_/g, ' ')
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

function getListingTierLabel(business: Business) {
  if (business.paid_tier === 'featured' || business.is_featured === true) {
    return 'Featured'
  }

  return 'Free'
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

function getBusinessPendingValue(
  business: Business,
  field: string
): PendingChangeValue {
  if (field === 'business_name') return business.business_name
  if (field === 'slug') return business.slug
  if (field === 'category_id') return business.category_id
  if (field === 'description') return business.description
  if (field === 'services') return business.services
  if (field === 'logo_url') return business.logo_url
  if (field === 'use_external_reviews') return business.use_external_reviews

  if (field === 'external_review_platform') {
    return business.external_review_platform
  }

  if (field === 'external_review_url') return business.external_review_url

  return null
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Business logo preview"
          className="h-20 w-20 rounded-xl border border-stone-200 bg-white object-contain p-2"
        />

        <p className="break-words text-sm">{value}</p>
      </div>
    )
  }

  return (
    <p className="whitespace-pre-wrap break-words text-sm">{displayValue}</p>
  )
}

export default function ManageBusinessPage() {
  const params = useParams()
  const router = useRouter()

  const rawBusinessId = params.id
  const businessId = Array.isArray(rawBusinessId)
    ? rawBusinessId[0]
    : String(rawBusinessId)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [adminUserId, setAdminUserId] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [changeRejectionReason, setChangeRejectionReason] = useState('')
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
      router.push('/login')
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
      router.push('/dashboard')
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

    setCategories(categoryData ?? [])

    const { data, error: businessError } = await supabase
      .from('businesses')
      .select(BUSINESS_SELECT)
      .eq('id', businessId)
      .single()

    if (businessError) {
      setError(businessError.message)
      setBusiness(null)
      setLoading(false)
      return
    }

    const loadedBusiness = data as Business

    if (isLocalAmenity(loadedBusiness)) {
      router.push('/admin/amenities')
      return
    }

    setBusiness(loadedBusiness)
    setRejectionReason(loadedBusiness.rejection_reason || '')
    setChangeRejectionReason(loadedBusiness.change_rejection_reason || '')
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

    const now = new Date().toISOString()

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        business_name: business.business_name.trim(),
        slug: business.slug.trim(),
        category_id: business.category_id || null,
        listing_type: 'business',
        useful_listing_type: null,
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
        use_external_reviews: business.use_external_reviews === true,
        external_review_platform: business.use_external_reviews
          ? cleanTextValue(business.external_review_platform)
          : null,
        external_review_url: business.use_external_reviews
          ? normaliseUrl(business.external_review_url)
          : null,
        updated_at: now,
      })
      .eq('id', business.id)
      .not('listing_type', 'eq', 'community')
      .not('listing_type', 'eq', 'local_info')
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
        listing_type: 'business',
        useful_listing_type: null,
        rejection_reason: null,
        rejected_at: null,
        rejected_by: null,
        change_rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', business.id)
      .not('listing_type', 'eq', 'community')
      .not('listing_type', 'eq', 'local_info')
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setRejectionReason('')
    setChangeRejectionReason('')
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

    const now = new Date().toISOString()
    const feedback =
      cleanTextValue(rejectionReason) ||
      'Your listing was not approved. Please check your details and submit it again.'

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        status: 'rejected',
        is_approved: false,
        rejection_reason: feedback,
        rejected_at: now,
        rejected_by: adminUserId || null,
        pending_changes: {},
        pending_changed_fields: [],
        has_pending_changes: false,
        changes_reviewed_at: now,
        changes_reviewed_by: adminUserId || null,
        change_rejection_reason: null,
        updated_at: now,
      })
      .eq('id', business.id)
      .not('listing_type', 'eq', 'community')
      .not('listing_type', 'eq', 'local_info')
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setRejectionReason(feedback)
    setChangeRejectionReason('')
    setSuccess('Business rejected and feedback saved.')
  }

  async function updateListingTier(tier: ListingTier) {
    if (!business) return

    setSaving(true)
    setError('')
    setSuccess('')

    const { now, expiresAt } = getThirtyDaysFromNow()

    const payload =
      tier === 'free'
        ? {
            paid_tier: 'free',
            is_featured: false,
            paid_tier_started_at: null,
            paid_tier_expires_at: null,
            paid_tier_renewed_at: null,
            updated_at: now,
          }
        : {
            paid_tier: 'featured',
            is_featured: true,
            paid_tier_started_at: now,
            paid_tier_expires_at: expiresAt,
            paid_tier_renewed_at: null,
            updated_at: now,
          }

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update(payload)
      .eq('id', business.id)
      .not('listing_type', 'eq', 'community')
      .not('listing_type', 'eq', 'local_info')
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setSuccess(
      tier === 'free'
        ? 'Listing changed back to Free.'
        : 'Listing changed to Featured for 30 days.'
    )
  }

  async function renewFeaturedListing() {
    if (!business) return

    setSaving(true)
    setError('')
    setSuccess('')

    const { renewedAt, expiresAt } = getRenewedExpiryDate(
      business.paid_tier_expires_at
    )

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        paid_tier: 'featured',
        is_featured: true,
        paid_tier_renewed_at: renewedAt,
        paid_tier_expires_at: expiresAt,
        updated_at: renewedAt,
      })
      .eq('id', business.id)
      .eq('paid_tier', 'featured')
      .not('listing_type', 'eq', 'community')
      .not('listing_type', 'eq', 'local_info')
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setSuccess('Featured listing renewed for another 30 days.')
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
        approvedChanges[field] = value
      }
    })

    const now = new Date().toISOString()

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        ...approvedChanges,
        listing_type: 'business',
        useful_listing_type: null,
        pending_changes: {},
        pending_changed_fields: [],
        has_pending_changes: false,
        changes_reviewed_at: now,
        changes_reviewed_by: adminUserId || null,
        change_rejection_reason: null,
        updated_at: now,
      })
      .eq('id', business.id)
      .not('listing_type', 'eq', 'community')
      .not('listing_type', 'eq', 'local_info')
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setChangeRejectionReason('')
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
        change_rejection_reason: cleanTextValue(changeRejectionReason),
        updated_at: now,
      })
      .eq('id', business.id)
      .not('listing_type', 'eq', 'community')
      .not('listing_type', 'eq', 'local_info')
      .select(BUSINESS_SELECT)
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBusiness(data as Business)
    setChangeRejectionReason('')
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
      .not('listing_type', 'eq', 'community')
      .not('listing_type', 'eq', 'local_info')

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
          <p className="text-sm text-stone-600">Loading business...</p>
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

  const isFeatured =
    business.paid_tier === 'featured' || business.is_featured === true

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

                {business.is_approved ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 ring-1 ring-green-200">
                    Approved
                  </span>
                ) : null}

                {isFeatured ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    Featured
                  </span>
                ) : (
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 ring-1 ring-stone-200">
                    Free
                  </span>
                )}

                {business.has_pending_changes ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                    Changes pending review
                  </span>
                ) : null}
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
            </div>
          </div>

          {error ? (
            <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-700 ring-1 ring-green-100">
              {success}
            </p>
          ) : null}

          <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-red-950">
                  Listing rejection feedback
                </h2>

                <p className="mt-2 text-sm leading-6 text-red-800">
                  Add a clear reason before rejecting a full business listing.
                  This message will be shown to the business owner on their edit
                  listing page.
                </p>
              </div>

              {business.status === 'rejected' ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200">
                  Currently rejected
                </span>
              ) : null}
            </div>

            <label className="mt-5 block text-sm font-semibold text-red-950">
              Feedback for business owner
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-red-200 bg-white p-3 text-sm text-stone-900 outline-none focus:border-red-500"
                placeholder="Example: Please add a clearer description, include a valid contact email, or remove unsupported claims."
              />
            </label>

            {business.rejection_reason ? (
              <div className="mt-4 rounded-xl bg-white p-4 text-sm text-red-800 ring-1 ring-red-200">
                <p className="font-semibold">Current saved feedback</p>
                <p className="mt-1 whitespace-pre-wrap leading-6">
                  {business.rejection_reason}
                </p>
              </div>
            ) : null}
          </section>

          <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-950">
                  Featured listing
                </h2>

                <p className="mt-2 text-sm text-stone-600">
                  Featured listings run for 30 days from purchase or renewal.
                  Free listings remain in the alphabetical directory.
                </p>
              </div>

              <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm">
                <p className="font-semibold text-stone-950">
                  {getListingTierLabel(business)}
                </p>
                <p className="mt-1 text-xs text-stone-500">Current listing</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => updateListingTier('free')}
                disabled={saving}
                className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Free
              </button>

              <button
                type="button"
                onClick={() => updateListingTier('featured')}
                disabled={saving}
                className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Featured for 30 days
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-stone-50 p-4 text-sm text-stone-700 md:grid-cols-3">
              <p>
                <span className="block text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Started
                </span>
                {formatDate(business.paid_tier_started_at)}
              </p>

              <p>
                <span className="block text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Expires
                </span>
                {formatDate(business.paid_tier_expires_at)}
              </p>

              <p>
                <span className="block text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Last renewed
                </span>
                {formatDate(business.paid_tier_renewed_at)}
              </p>
            </div>

            {isFeatured ? (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Renew Featured listing
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    Add another 30 days onto the current expiry date.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={renewFeaturedListing}
                  disabled={saving}
                  className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  Renew for 30 days
                </button>
              </div>
            ) : null}
          </section>

          {hasPendingChanges ? (
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
                  const currentValue = getBusinessPendingValue(business, field)
                  const proposedValue = pendingChanges[field]

                  return (
                    <div
                      key={field}
                      className="rounded-xl border border-amber-200 bg-white p-4"
                    >
                      <p className="text-sm font-bold text-stone-950">
                        {formatFieldLabel(field)}
                      </p>

                      {field === 'business_name' && pendingChanges.slug ? (
                        <p className="mt-1 text-xs text-stone-500">
                          The public URL will also update to /business/
                          {pendingChanges.slug}
                        </p>
                      ) : null}

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
                  value={changeRejectionReason}
                  onChange={(event) =>
                    setChangeRejectionReason(event.target.value)
                  }
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-amber-300 bg-white p-3 text-sm text-stone-900 outline-none focus:border-amber-500"
                  placeholder="Example: Please remove unsupported claims from the description."
                />
              </label>
            </section>
          ) : null}

          <section className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-stone-950">
                  Approved/live listing details
                </h2>

                <p className="mt-1 text-sm text-stone-600">
                  Edits saved here update the live business record directly.
                  Featured status is managed separately above.
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
              <TextInput
                label="Business name"
                value={business.business_name}
                onChange={(value) => updateField('business_name', value)}
                fullWidth
              />

              <TextInput
                label="Slug"
                value={business.slug}
                onChange={(value) => updateField('slug', value)}
                fullWidth
              />

              <label className="block text-sm font-semibold text-stone-700">
                Category
                <select
                  value={business.category_id ?? ''}
                  onChange={(event) =>
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

              <TextAreaInput
                label="Description"
                value={business.description ?? ''}
                onChange={(value) => updateField('description', value)}
                rows={5}
                fullWidth
              />

              <TextAreaInput
                label="Services"
                value={business.services ?? ''}
                onChange={(value) => updateField('services', value)}
                rows={4}
                fullWidth
              />

              <TextInput
                label="Phone"
                value={business.phone ?? ''}
                onChange={(value) => updateField('phone', value)}
              />

              <TextInput
                label="Email"
                value={business.email ?? ''}
                onChange={(value) => updateField('email', value)}
              />

              <TextInput
                label="Website"
                value={business.website ?? ''}
                onChange={(value) => updateField('website', value)}
              />

              <TextInput
                label="Facebook"
                value={business.facebook ?? ''}
                onChange={(value) => updateField('facebook', value)}
              />

              <TextInput
                label="Instagram"
                value={business.instagram ?? ''}
                onChange={(value) => updateField('instagram', value)}
              />

              <TextInput
                label="Logo URL"
                value={business.logo_url ?? ''}
                onChange={(value) => updateField('logo_url', value)}
              />

              {business.logo_url ? (
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-sm font-semibold text-stone-700">
                    Current logo
                  </p>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={business.logo_url}
                    alt={`${business.business_name} logo`}
                    className="mt-3 h-24 w-24 rounded-xl border border-stone-200 object-contain p-2"
                  />
                </div>
              ) : null}

              <TextInput
                label="Address line 1"
                value={business.address_line_1 ?? ''}
                onChange={(value) => updateField('address_line_1', value)}
              />

              <TextInput
                label="Address line 2"
                value={business.address_line_2 ?? ''}
                onChange={(value) => updateField('address_line_2', value)}
              />

              <TextInput
                label="Town"
                value={business.town ?? ''}
                onChange={(value) => updateField('town', value)}
              />

              <TextInput
                label="Postcode"
                value={business.postcode ?? ''}
                onChange={(value) => updateField('postcode', value)}
              />

              <TextAreaInput
                label="Service area"
                value={business.service_area ?? ''}
                onChange={(value) => updateField('service_area', value)}
                rows={3}
                fullWidth
              />

              <TextAreaInput
                label="Opening times"
                value={business.opening_times ?? ''}
                onChange={(value) => updateField('opening_times', value)}
                rows={4}
                fullWidth
              />
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
                  checked={business.use_external_reviews === true}
                  onChange={(event) =>
                    updateField('use_external_reviews', event.target.checked)
                  }
                />
                Use external reviews instead of onsite reviews
              </label>
            </div>

            {business.use_external_reviews ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextInput
                  label="External review platform"
                  value={business.external_review_platform ?? ''}
                  onChange={(value) =>
                    updateField('external_review_platform', value)
                  }
                  placeholder="Trustpilot, Google, Facebook..."
                />

                <TextInput
                  label="External review URL"
                  value={business.external_review_url ?? ''}
                  onChange={(value) =>
                    updateField('external_review_url', value)
                  }
                  placeholder="https://..."
                />
              </div>
            ) : null}

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
            <h2 className="text-lg font-bold text-red-800">Danger zone</h2>

            <p className="mt-1 text-sm text-red-700">
              Delete duplicate, test or spam business listings. This cannot be
              undone.
            </p>

            <button
              type="button"
              onClick={deleteBusiness}
              disabled={saving}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Delete business
            </button>
          </section>
        </div>
      </section>
    </main>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  fullWidth = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  fullWidth?: boolean
}) {
  return (
    <label
      className={`block text-sm font-semibold text-stone-700 ${
        fullWidth ? 'md:col-span-2' : ''
      }`}
    >
      {label}

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
      />
    </label>
  )
}

function TextAreaInput({
  label,
  value,
  onChange,
  rows,
  fullWidth = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows: number
  fullWidth?: boolean
}) {
  return (
    <label
      className={`block text-sm font-semibold text-stone-700 ${
        fullWidth ? 'md:col-span-2' : ''
      }`}
    >
      {label}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 outline-none focus:border-stone-500"
      />
    </label>
  )
}