'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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
  town: string | null
  postcode: string | null
  service_area: string | null
  logo_url: string | null
  is_approved: boolean
  is_featured: boolean
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AdminEditBusinessPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [businessName, setBusinessName] = useState('')
  const [slug, setSlug] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [services, setServices] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')
  const [town, setTown] = useState('Ollerton')
  const [postcode, setPostcode] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [isApproved, setIsApproved] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)

  useEffect(() => {
    async function loadPage() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')

      setCategories((categoryData as Category[] | null) ?? [])

      const { data: businessData, error } = await supabase
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
          town,
          postcode,
          service_area,
          logo_url,
          is_approved,
          is_featured
        `)
        .eq('id', businessId)
        .single()

      if (error || !businessData) {
        setMessage(error?.message ?? 'Business not found.')
        setLoading(false)
        return
      }

      const business = businessData as Business

      setBusinessName(business.business_name ?? '')
      setSlug(business.slug ?? '')
      setCategoryId(business.category_id ?? '')
      setDescription(business.description ?? '')
      setServices(business.services ?? '')
      setPhone(business.phone ?? '')
      setEmail(business.email ?? '')
      setWebsite(business.website ?? '')
      setFacebook(business.facebook ?? '')
      setInstagram(business.instagram ?? '')
      setTown(business.town ?? 'Ollerton')
      setPostcode(business.postcode ?? '')
      setServiceArea(business.service_area ?? '')
      setLogoUrl(business.logo_url ?? '')
      setIsApproved(business.is_approved ?? false)
      setIsFeatured(business.is_featured ?? false)

      setLoading(false)
    }

    loadPage()
  }, [businessId, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const cleanSlug = slug || makeSlug(businessName)

    const { error } = await supabase
      .from('businesses')
      .update({
        business_name: businessName,
        slug: cleanSlug,
        category_id: categoryId || null,
        description,
        services,
        phone,
        email,
        website,
        facebook,
        instagram,
        town,
        postcode,
        service_area: serviceArea,
        logo_url: logoUrl || null,
        is_approved: isApproved,
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    setMessage(error ? error.message : 'Business updated successfully.')
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
        Loading business...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="font-semibold underline">
          Back to admin
        </Link>

        <div className="mt-6 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
          <h1 className="text-3xl font-bold">Edit business</h1>

          {message && <p className="mt-4 text-sm text-red-700">{message}</p>}

          <form onSubmit={handleSave} className="mt-8 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 p-4">
                <input
                  type="checkbox"
                  checked={isApproved}
                  onChange={(e) => setIsApproved(e.target.checked)}
                />
                Approved
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-stone-200 p-4">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Featured
              </label>
            </div>

            <input
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value)
                setSlug(makeSlug(e.target.value))
              }}
              placeholder="Business name"
              required
            />

            <input
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
              value={slug}
              onChange={(e) => setSlug(makeSlug(e.target.value))}
              placeholder="business-slug"
              required
            />

            <select
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <textarea
              className="min-h-32 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />

            <textarea
              className="min-h-28 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="Services"
            />

            <input
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Logo URL"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
              />

              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
              />
            </div>

            <input
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="Facebook"
              />

              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="Instagram"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="Town"
              />

              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Postcode"
              />
            </div>

            <input
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="Service area"
            />

            <button
              disabled={saving}
              className="w-full rounded-xl bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}