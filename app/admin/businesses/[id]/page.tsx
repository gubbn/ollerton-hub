'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Business = {
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
  status: string | null
  is_approved: boolean | null
  is_featured: boolean | null
  is_premium: boolean | null
}

export default function ManageBusinessPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadBusiness() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('businesses')
        .select(`
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
          status,
          is_approved,
          is_featured,
          is_premium
        `)
        .eq('id', businessId)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setBusiness(data)
      }

      setLoading(false)
    }

    loadBusiness()
  }, [businessId, router])

  function updateField(field: keyof Business, value: string | boolean) {
    if (!business) return
    setBusiness({ ...business, [field]: value })
  }

  async function saveBusiness() {
    if (!business) return

    setSaving(true)
    setError('')
    setSuccess('')

    const { error } = await supabase
      .from('businesses')
      .update({
        business_name: business.business_name,
        slug: business.slug,
        description: business.description,
        services: business.services,
        phone: business.phone,
        email: business.email,
        website: business.website,
        facebook: business.facebook,
        instagram: business.instagram,
        address_line_1: business.address_line_1,
        address_line_2: business.address_line_2,
        town: business.town,
        postcode: business.postcode,
        service_area: business.service_area,
        opening_times: business.opening_times,
        status: business.status,
        is_approved: business.is_approved,
        is_featured: business.is_featured,
        is_premium: business.is_premium,
      })
      .eq('id', business.id)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('Business updated successfully.')
  }

  async function approveBusiness() {
    if (!business) return

    const { error } = await supabase
      .from('businesses')
      .update({
        status: 'approved',
        is_approved: true,
      })
      .eq('id', business.id)

    if (error) {
      setError(error.message)
      return
    }

    setBusiness({ ...business, status: 'approved', is_approved: true })
    setSuccess('Business approved.')
  }

  async function rejectBusiness() {
    if (!business) return

    const { error } = await supabase
      .from('businesses')
      .update({
        status: 'rejected',
        is_approved: false,
      })
      .eq('id', business.id)

    if (error) {
      setError(error.message)
      return
    }

    setBusiness({ ...business, status: 'rejected', is_approved: false })
    setSuccess('Business rejected.')
  }

  async function toggleFeatured() {
    if (!business) return

    const newValue = !business.is_featured

    const { error } = await supabase
      .from('businesses')
      .update({ is_featured: newValue })
      .eq('id', business.id)

    if (error) {
      setError(error.message)
      return
    }

    setBusiness({ ...business, is_featured: newValue })
    setSuccess(newValue ? 'Business marked as featured.' : 'Business removed from featured.')
  }

  async function deleteBusiness() {
    if (!business) return

    const confirmed = window.confirm(
      `Delete ${business.business_name}? This cannot be undone.`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', business.id)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/admin/businesses')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <p className="text-gray-700">Loading business...</p>
      </main>
    )
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <Link href="/admin/businesses" className="text-sm text-gray-600 hover:underline">
          ← Back to businesses
        </Link>

        <p className="mt-6 text-red-600">{error || 'Business not found.'}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <section className="mx-auto max-w-4xl">
        <Link href="/admin/businesses" className="text-sm text-gray-600 hover:underline">
          ← Back to businesses
        </Link>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage {business.business_name}
              </h1>

              <p className="mt-2 text-sm text-gray-600">
                Status: {business.status || 'pending'} · Approved:{' '}
                {business.is_approved ? 'Yes' : 'No'} · Featured:{' '}
                {business.is_featured ? 'Yes' : 'No'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={approveBusiness}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white"
              >
                Approve
              </button>

              <button
                onClick={rejectBusiness}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                Reject
              </button>

              <button
                onClick={toggleFeatured}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                {business.is_featured ? 'Unfeature' : 'Feature'}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </p>
          )}

          <div className="mt-6 grid gap-4">
            <input value={business.business_name} onChange={(e) => updateField('business_name', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Business name" />
            <input value={business.slug} onChange={(e) => updateField('slug', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Slug" />

            <textarea value={business.description || ''} onChange={(e) => updateField('description', e.target.value)} rows={5} className="rounded-lg border p-3 text-gray-900" placeholder="Description" />

            <textarea value={business.services || ''} onChange={(e) => updateField('services', e.target.value)} rows={3} className="rounded-lg border p-3 text-gray-900" placeholder="Services" />

            <input value={business.phone || ''} onChange={(e) => updateField('phone', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Phone" />
            <input value={business.email || ''} onChange={(e) => updateField('email', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Email" />
            <input value={business.website || ''} onChange={(e) => updateField('website', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Website" />
            <input value={business.facebook || ''} onChange={(e) => updateField('facebook', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Facebook" />
            <input value={business.instagram || ''} onChange={(e) => updateField('instagram', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Instagram" />

            <input value={business.address_line_1 || ''} onChange={(e) => updateField('address_line_1', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Address line 1" />
            <input value={business.address_line_2 || ''} onChange={(e) => updateField('address_line_2', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Address line 2" />
            <input value={business.town || ''} onChange={(e) => updateField('town', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Town" />
            <input value={business.postcode || ''} onChange={(e) => updateField('postcode', e.target.value)} className="rounded-lg border p-3 text-gray-900" placeholder="Postcode" />

            <textarea value={business.service_area || ''} onChange={(e) => updateField('service_area', e.target.value)} rows={3} className="rounded-lg border p-3 text-gray-900" placeholder="Service area" />

            <textarea value={business.opening_times || ''} onChange={(e) => updateField('opening_times', e.target.value)} rows={4} className="rounded-lg border p-3 text-gray-900" placeholder="Opening times" />

            <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={business.is_premium === true}
                onChange={(e) => updateField('is_premium', e.target.checked)}
              />
              Premium business
            </label>
          </div>

          <div className="mt-8">
            <button
              onClick={saveBusiness}
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save full business details'}
            </button>
          </div>

          <div className="mt-10 border-t pt-6">
            <h2 className="text-lg font-bold text-red-700">Danger Zone</h2>

            <p className="mt-1 text-sm text-gray-600">
              Delete duplicate, test or spam listings.
            </p>

            <button
              onClick={deleteBusiness}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-medium text-white"
            >
              Delete Business
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}