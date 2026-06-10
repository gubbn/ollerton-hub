'use client'

import { useEffect, useState } from 'react'
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
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function BusinessDashboardPage() {
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)

  const [businessName, setBusinessName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [services, setServices] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [town, setTown] = useState('Ollerton')
  const [postcode, setPostcode] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [openingTimes, setOpeningTimes] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadPage() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      setUserId(userData.user.id)

      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')

      setCategories((categoryData as Category[] | null) ?? [])

      const { data: businessData } = await supabase
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
          logo_url
        `)
        .eq('owner_id', userData.user.id)
        .maybeSingle()

      if (businessData) {
        const business = businessData as Business

        setBusinessId(business.id)
        setBusinessName(business.business_name ?? '')
        setCategoryId(business.category_id ?? '')
        setDescription(business.description ?? '')
        setServices(business.services ?? '')
        setPhone(business.phone ?? '')
        setEmail(business.email ?? '')
        setWebsite(business.website ?? '')
        setFacebook(business.facebook ?? '')
        setInstagram(business.instagram ?? '')
        setAddressLine1(business.address_line_1 ?? '')
        setAddressLine2(business.address_line_2 ?? '')
        setTown(business.town ?? 'Ollerton')
        setPostcode(business.postcode ?? '')
        setServiceArea(business.service_area ?? '')
        setOpeningTimes(business.opening_times ?? '')
        setLogoUrl(business.logo_url ?? '')
      }

      setLoading(false)
    }

    loadPage()
  }, [router])

  async function handleLogoUpload(file: File) {
    if (!userId) return

    setUploadingLogo(true)
    setMessage('')

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('business-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      setMessage(uploadError.message)
      setUploadingLogo(false)
      return
    }

    const { data } = supabase.storage
      .from('business-logos')
      .getPublicUrl(filePath)

    setLogoUrl(data.publicUrl)
    setUploadingLogo(false)
    setMessage('Logo uploaded. Remember to save your business listing.')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!userId) return

    setSaving(true)
    setMessage('')

    const slug = makeSlug(businessName)

    const payload = {
      owner_id: userId,
      business_name: businessName,
      slug,
      category_id: categoryId || null,
      description,
      services,
      phone,
      email,
      website,
      facebook,
      instagram,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      town,
      postcode,
      service_area: serviceArea,
      opening_times: openingTimes,
      logo_url: logoUrl || null,
      is_approved: false,
      updated_at: new Date().toISOString(),
    }

    const { error } = businessId
      ? await supabase.from('businesses').update(payload).eq('id', businessId)
      : await supabase.from('businesses').insert(payload)

    setMessage(
      error
        ? error.message
        : businessId
          ? 'Business listing updated. It may need approval before public changes show.'
          : 'Business listing created. It will appear publicly after approval.'
    )

    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
        Loading...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="font-semibold underline">
          Back to dashboard
        </Link>

        <div className="mt-6 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
          <h1 className="text-3xl font-bold">
            {businessId ? 'Edit business listing' : 'Create business listing'}
          </h1>

          <form onSubmit={handleSave} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block font-semibold">Business logo</label>

              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Business logo preview"
                  className="mb-4 h-24 w-24 rounded-2xl object-cover ring-1 ring-stone-200"
                />
              ) : (
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-stone-100 text-sm text-stone-500 ring-1 ring-stone-200">
                  No logo
                </div>
              )}

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleLogoUpload(file)
                }}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
              />

              {uploadingLogo && (
                <p className="mt-2 text-sm text-stone-600">Uploading logo...</p>
              )}
            </div>

            <div>
              <label className="mb-2 block font-semibold">Business name</label>
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">Category</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">Business description</label>
              <textarea
                className="min-h-32 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">Services</label>
              <textarea
                className="min-h-28 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={services}
                onChange={(e) => setServices(e.target.value)}
              />
            </div>

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
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Address line 1"
              />

              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Address line 2"
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

            <textarea
              className="min-h-28 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900"
              value={openingTimes}
              onChange={(e) => setOpeningTimes(e.target.value)}
              placeholder={`Opening times, e.g.
Monday: 9am - 5pm
Tuesday: 9am - 5pm
Wednesday: Closed`}
            />

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
              {saving ? 'Saving...' : 'Save business listing'}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-stone-700">{message}</p>}
        </div>
      </div>
    </main>
  )
}