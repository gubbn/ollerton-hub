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
  website_url: string | null
  phone: string | null
  email: string | null
  town: string | null
  address: string | null
  opening_times: string | null
  status: string | null
  is_featured: boolean | null
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
        .select(
          'id, business_name, slug, description, website_url, phone, email, town, address, opening_times, status, is_featured'
        )
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
        website_url: business.website_url,
        phone: business.phone,
        email: business.email,
        town: business.town,
        address: business.address,
        opening_times: business.opening_times,
        status: business.status,
        is_featured: business.is_featured,
      })
      .eq('id', business.id)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('Business updated successfully.')
  }

  async function quickStatus(status: 'approved' | 'rejected' | 'pending') {
    if (!business) return

    const updatedBusiness = { ...business, status }
    setBusiness(updatedBusiness)
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

        <p className="mt-6 text-red-600">
          {error || 'Business not found.'}
        </p>
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
          <h1 className="text-3xl font-bold text-gray-900">
            Manage {business.business_name}
          </h1>

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
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Business name</span>
              <input
                value={business.business_name}
                onChange={(e) => updateField('business_name', e.target.value)}
                className="rounded-lg border p-3 text-gray-900"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Slug</span>
              <input
                value={business.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                className="rounded-lg border p-3 text-gray-900"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea
                value={business.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={5}
                className="rounded-lg border p-3 text-gray-900"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Website URL</span>
              <input
                value={business.website_url || ''}
                onChange={(e) => updateField('website_url', e.target.value)}
                className="rounded-lg border p-3 text-gray-900"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Phone</span>
                <input
                  value={business.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="rounded-lg border p-3 text-gray-900"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  value={business.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="rounded-lg border p-3 text-gray-900"
                />
              </label>
            </div>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Town</span>
              <input
                value={business.town || ''}
                onChange={(e) => updateField('town', e.target.value)}
                className="rounded-lg border p-3 text-gray-900"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Address</span>
              <textarea
                value={business.address || ''}
                onChange={(e) => updateField('address', e.target.value)}
                rows={3}
                className="rounded-lg border p-3 text-gray-900"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Opening times</span>
              <textarea
                value={business.opening_times || ''}
                onChange={(e) => updateField('opening_times', e.target.value)}
                rows={4}
                className="rounded-lg border p-3 text-gray-900"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <select
                  value={business.status || 'pending'}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="rounded-lg border p-3 text-gray-900"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label className="flex items-center gap-3 pt-6 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={business.is_featured === true}
                  onChange={(e) => updateField('is_featured', e.target.checked)}
                />
                Featured business
              </label>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => quickStatus('approved')}
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white"
            >
              Approve
            </button>

            <button
              onClick={() => quickStatus('rejected')}
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white"
            >
              Reject
            </button>

            <button
              onClick={saveBusiness}
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}