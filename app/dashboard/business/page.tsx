'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type PendingChangeValue = string | null
type PendingChanges = Record<string, PendingChangeValue>

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
  listing_type: string | null
  useful_listing_type: string | null
  pending_changes: PendingChanges | null
  pending_changed_fields: string[] | null
  has_pending_changes: boolean | null
  changes_submitted_at: string | null
  changes_submitted_by: string | null
  changes_reviewed_at: string | null
  changes_reviewed_by: string | null
  change_rejection_reason: string | null
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

const businessSelect = `
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
  listing_type,
  useful_listing_type,
  pending_changes,
  pending_changed_fields,
  has_pending_changes,
  changes_submitted_at,
  changes_submitted_by,
  changes_reviewed_at,
  changes_reviewed_by,
  change_rejection_reason
`

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

const fieldLabels: Record<keyof FormState, string> = {
  business_name: 'Business name',
  description: 'Description',
  services: 'Services',
  phone: 'Phone',
  email: 'Email',
  website: 'Website',
  facebook: 'Facebook',
  instagram: 'Instagram',
  address_line_1: 'Address line 1',
  address_line_2: 'Address line 2',
  town: 'Town',
  postcode: 'Postcode',
  service_area: 'Service area',
  opening_times: 'Opening times',
  logo_url: 'Logo URL',
  cover_image_url: 'Cover image URL',
}

const formFields = Object.keys(fieldLabels) as (keyof FormState)[]

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

function createSlug(value: string) {
  const base =
    value
      .toLowerCase()
      .trim()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'business'

  const suffix = Date.now().toString(36).slice(-6)

  return `${base}-${suffix}`
}

function getPendingChanges(business: Business | null): PendingChanges {
  if (!business?.pending_changes) return {}
  if (Array.isArray(business.pending_changes)) return {}

  return business.pending_changes
}

function businessToForm(data: Business): FormState {
  const pendingChanges = getPendingChanges(data)

  return {
    business_name:
      pendingChanges.business_name ?? data.business_name ?? '',
    description: pendingChanges.description ?? data.description ?? '',
    services: pendingChanges.services ?? data.services ?? '',
    phone: pendingChanges.phone ?? data.phone ?? '',
    email: pendingChanges.email ?? data.email ?? '',
    website: pendingChanges.website ?? data.website ?? '',
    facebook: pendingChanges.facebook ?? data.facebook ?? '',
    instagram: pendingChanges.instagram ?? data.instagram ?? '',
    address_line_1:
      pendingChanges.address_line_1 ?? data.address_line_1 ?? '',
    address_line_2:
      pendingChanges.address_line_2 ?? data.address_line_2 ?? '',
    town: pendingChanges.town ?? data.town ?? '',
    postcode: pendingChanges.postcode ?? data.postcode ?? '',
    service_area: pendingChanges.service_area ?? data.service_area ?? '',
    opening_times:
      pendingChanges.opening_times ?? data.opening_times ?? '',
    logo_url: pendingChanges.logo_url ?? data.logo_url ?? '',
    cover_image_url:
      pendingChanges.cover_image_url ?? data.cover_image_url ?? '',
  }
}

function isApprovedBusiness(business: Business) {
  return business.status === 'approved' || business.is_approved === true
}

function formatDate(value: string | null) {
  if (!value) return null

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function normaliseFormForSave(form: FormState): Record<keyof FormState, string | null> {
  return {
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
    postcode: form.postcode.trim() ? form.postcode.trim().toUpperCase() : null,
    service_area: normaliseNullable(form.service_area),
    opening_times: normaliseNullable(form.opening_times),
    logo_url: form.logo_url.trim() ? cleanUrl(form.logo_url) : null,
    cover_image_url: form.cover_image_url.trim()
      ? cleanUrl(form.cover_image_url)
      : null,
  }
}

function getCurrentBusinessValue(
  business: Business,
  field: keyof FormState
): string | null {
  const value = business[field]

  if (value === undefined || value === '') return null

  if (field === 'postcode' && typeof value === 'string') {
    return value.trim().toUpperCase()
  }

  return value
}

function buildPendingChanges(
  business: Business,
  saveData: Record<keyof FormState, string | null>
) {
  const pendingChanges: PendingChanges = {}
  const changedFields: string[] = []

  formFields.forEach((field) => {
    const currentValue = getCurrentBusinessValue(business, field)
    const proposedValue = saveData[field]

    if ((currentValue || null) !== (proposedValue || null)) {
      pendingChanges[field] = proposedValue
      changedFields.push(field)
    }
  })

  return {
    pendingChanges,
    changedFields,
  }
}

function getChangedFieldLabels(fields: string[] | null | undefined) {
  if (!fields?.length) return []

  return fields
    .filter((field): field is keyof FormState => field in fieldLabels)
    .map((field) => fieldLabels[field])
}

export default function BusinessEditPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isCreateMode = !business
  const pendingFieldLabels = getChangedFieldLabels(
    business?.pending_changed_fields
  )

  useEffect(() => {
    loadBusiness()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadBusiness() {
    setLoading(true)
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
      router.replace('/login')
      return
    }

    setUserId(user.id)

    const { data, error: businessError } = await supabase
      .from('businesses')
      .select(businessSelect)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (businessError) {
      setError('We could not load your business listing.')
      setLoading(false)
      return
    }

    const businessRows = (data as Business[] | null) ?? []
    const editableBusiness = businessRows.find((item) => !isAmenityListing(item))

    if (!editableBusiness) {
      setBusiness(null)
      setForm({ ...emptyForm })
      setLoading(false)
      return
    }

    setBusiness(editableBusiness)
    setForm(businessToForm(editableBusiness))
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

    if (!userId) {
      setError('You need to be logged in to manage a business listing.')
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

    const now = new Date().toISOString()
    const saveData = normaliseFormForSave(form)

    const baseListingData = {
      listing_type: 'business',
      useful_listing_type: null,
      updated_at: now,
    }

    if (business) {
      if (isAmenityListing(business)) {
        setError('Local amenities cannot be edited from this page.')
        setSaving(false)
        return
      }

      if (isApprovedBusiness(business)) {
        const { pendingChanges, changedFields } = buildPendingChanges(
          business,
          saveData
        )

        if (changedFields.length === 0) {
          const { data, error: clearError } = await supabase
            .from('businesses')
            .update({
              ...baseListingData,
              status: 'approved',
              is_approved: true,
              pending_changes: {},
              pending_changed_fields: [],
              has_pending_changes: false,
              changes_submitted_at: null,
              changes_submitted_by: null,
              changes_reviewed_at: null,
              changes_reviewed_by: null,
              change_rejection_reason: null,
            })
            .eq('id', business.id)
            .eq('owner_id', userId)
            .select(businessSelect)
            .single()

          if (clearError) {
            setError('We could not clear your pending changes. Please try again.')
            setSaving(false)
            return
          }

          const updatedBusiness = data as Business
          setBusiness(updatedBusiness)
          setForm(businessToForm(updatedBusiness))
          setSuccess('There are no changes waiting for review.')
          setSaving(false)
          return
        }

        const { data, error: pendingError } = await supabase
          .from('businesses')
          .update({
            ...baseListingData,
            status: 'pending',
            is_approved: true,
            pending_changes: pendingChanges,
            pending_changed_fields: changedFields,
            has_pending_changes: true,
            changes_submitted_at: now,
            changes_submitted_by: userId,
            changes_reviewed_at: null,
            changes_reviewed_by: null,
            change_rejection_reason: null,
          })
          .eq('id', business.id)
          .eq('owner_id', userId)
          .select(businessSelect)
          .single()

        if (pendingError) {
          setError('We could not submit your changes. Please try again.')
          setSaving(false)
          return
        }

        const updatedBusiness = data as Business

        setBusiness(updatedBusiness)
        setForm(businessToForm(updatedBusiness))
        setSuccess(
          'Your changes have been submitted for review. Your current approved listing is still live.'
        )
        setSaving(false)
        return
      }

      const { data, error: updateError } = await supabase
        .from('businesses')
        .update({
          ...saveData,
          ...baseListingData,
          status: 'pending',
          is_approved: false,
          pending_changes: {},
          pending_changed_fields: [],
          has_pending_changes: false,
          changes_submitted_at: null,
          changes_submitted_by: null,
          changes_reviewed_at: null,
          changes_reviewed_by: null,
          change_rejection_reason: null,
        })
        .eq('id', business.id)
        .eq('owner_id', userId)
        .select(businessSelect)
        .single()

      if (updateError) {
        setError('We could not save your listing. Please try again.')
        setSaving(false)
        return
      }

      const updatedBusiness = data as Business

      setBusiness(updatedBusiness)
      setForm(businessToForm(updatedBusiness))
      setSuccess(
        'Your listing has been saved and is waiting for approval.'
      )
      setSaving(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('businesses')
      .insert({
        ...saveData,
        ...baseListingData,
        owner_id: userId,
        slug: createSlug(form.business_name),
        status: 'pending',
        is_approved: false,
        is_featured: false,
        pending_changes: {},
        pending_changed_fields: [],
        has_pending_changes: false,
        changes_submitted_at: null,
        changes_submitted_by: null,
        changes_reviewed_at: null,
        changes_reviewed_by: null,
        change_rejection_reason: null,
        created_at: now,
      })
      .select(businessSelect)
      .single()

    if (insertError) {
      setError('We could not create your listing. Please try again.')
      setSaving(false)
      return
    }

    const createdBusiness = data as Business

    setBusiness(createdBusiness)
    setForm(businessToForm(createdBusiness))
    setSuccess(
      'Your business listing has been created and is now waiting for approval.'
    )
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

          {business && isApprovedBusiness(business) ? (
            <Link
              href={`/business/${business.slug}`}
              className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
            >
              View public listing
            </Link>
          ) : null}
        </div>

        <header className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
                {isCreateMode
                  ? 'Create business listing'
                  : 'Edit business listing'}
              </p>

              <h1 className="mt-3 text-3xl font-bold text-stone-950 md:text-4xl">
                {isCreateMode
                  ? 'Add your business to Ollerton Hub'
                  : business.business_name}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">
                {isCreateMode
                  ? 'Complete the form below to create your business listing. Once submitted, it will be reviewed before appearing in the directory.'
                  : isApprovedBusiness(business)
                    ? 'Update your business details below. Your current approved listing will stay live while your changes are reviewed.'
                    : 'Update your business details below. Your listing will be reviewed before appearing in the public directory.'}
              </p>
            </div>

            <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm">
              <p className="font-semibold text-stone-950">
                {limits.label} listing
              </p>

              <p className="mt-1 text-xs text-stone-500">
                Status:{' '}
                <span className="font-semibold capitalize text-stone-700">
                  {business?.status || 'pending'}
                </span>
              </p>
            </div>
          </div>
        </header>

        {business?.has_pending_changes ? (
          <section className="rounded-2xl bg-blue-50 p-5 shadow-sm ring-1 ring-blue-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Changes awaiting review
            </p>

            <h2 className="mt-1 text-lg font-bold text-blue-950">
              Your approved listing is still live
            </h2>

            <p className="mt-2 text-sm leading-6 text-blue-900">
              The form below is showing your proposed edits. These changes will
              not appear publicly until they have been approved.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-blue-900">
              {business.changes_submitted_at ? (
                <span className="rounded-full bg-white px-3 py-1 ring-1 ring-blue-200">
                  Submitted {formatDate(business.changes_submitted_at)}
                </span>
              ) : null}

              {pendingFieldLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-white px-3 py-1 ring-1 ring-blue-200"
                >
                  {label}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {business?.change_rejection_reason ? (
          <section className="rounded-2xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Admin note
            </p>

            <h2 className="mt-1 text-lg font-bold text-amber-950">
              Your last submitted changes were not approved
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-900">
              {business.change_rejection_reason}
            </p>
          </section>
        ) : null}

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-stone-950">
              Business details
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextInput
                label="Business name"
                value={form.business_name}
                onChange={(value) => updateField('business_name', value)}
                required
              />

              <TextInput
                label="Town"
                value={form.town}
                onChange={(value) => updateField('town', value)}
              />
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
              <TextInput
                label="Phone"
                value={form.phone}
                onChange={(value) => updateField('phone', value)}
              />

              <TextInput
                label="Email"
                value={form.email}
                onChange={(value) => updateField('email', value)}
                type="email"
              />

              <TextInput
                label="Website"
                value={form.website}
                onChange={(value) => updateField('website', value)}
                placeholder="https://example.co.uk"
              />

              <TextInput
                label="Facebook"
                value={form.facebook}
                onChange={(value) => updateField('facebook', value)}
                placeholder="https://facebook.com/your-page"
              />

              <TextInput
                label="Instagram"
                value={form.instagram}
                onChange={(value) => updateField('instagram', value)}
                placeholder="https://instagram.com/your-page"
                fullWidth
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-stone-950">
              Location and opening times
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextInput
                label="Address line 1"
                value={form.address_line_1}
                onChange={(value) => updateField('address_line_1', value)}
              />

              <TextInput
                label="Address line 2"
                value={form.address_line_2}
                onChange={(value) => updateField('address_line_2', value)}
              />

              <TextInput
                label="Postcode"
                value={form.postcode}
                onChange={(value) => updateField('postcode', value)}
                uppercase
              />

              <TextInput
                label="Service area"
                value={form.service_area}
                onChange={(value) => updateField('service_area', value)}
                placeholder="Ollerton, Newark, Mansfield..."
              />
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
            <h2 className="text-xl font-bold text-stone-950">Images</h2>

            <p className="mt-2 text-sm text-stone-600">
              Paste image URLs for now. Logo uploads can be added later if
              needed.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextInput
                label="Logo URL"
                value={form.logo_url}
                onChange={(value) => updateField('logo_url', value)}
                placeholder="https://..."
              />

              <TextInput
                label="Cover image URL"
                value={form.cover_image_url}
                onChange={(value) => updateField('cover_image_url', value)}
                placeholder="https://..."
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-stone-950">
                  {isCreateMode ? 'Submit listing' : 'Submit changes'}
                </h2>

                <p className="mt-1 text-sm text-stone-600">
                  {isCreateMode
                    ? 'Your listing will be reviewed before it appears in the public directory.'
                    : business && isApprovedBusiness(business)
                      ? 'Your approved listing will stay live while these changes are reviewed.'
                      : 'Your listing will be reviewed before it appears in the public directory.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {saving
                  ? isCreateMode
                    ? 'Creating...'
                    : 'Submitting...'
                  : isCreateMode
                    ? 'Create listing'
                    : 'Submit changes'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  fullWidth = false,
  uppercase = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  fullWidth?: boolean
  uppercase?: boolean
}) {
  return (
    <label className={`block ${fullWidth ? 'md:col-span-2' : ''}`}>
      <span className="text-sm font-semibold text-stone-800">{label}</span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className={`mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-red-500 ${
          uppercase ? 'uppercase' : ''
        }`}
      />
    </label>
  )
}