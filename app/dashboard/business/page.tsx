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
  town: string | null
  postcode: string | null
  service_area: string | null
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
  const [town, setTown] = useState('Ollerton')
  const [postcode, setPostcode] = useState('')
  const [serviceArea, setServiceArea] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
          town,
          postcode,
          service_area
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
        setTown(business.town ?? 'Ollerton')
        setPostcode(business.postcode ?? '')
        setServiceArea(business.service_area ?? '')
      }

      setLoading(false)
    }

    loadPage()
  }, [router])

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
      town,
      postcode,
      service_area: serviceArea,
      is_approved: false,
      updated_at: new Date().toISOString(),
    }

    const { error } = businessId
      ? await supabase.from('businesses').update(payload).eq('id', businessId)
      : await supabase.from('businesses').insert(payload)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(
        businessId
          ? 'Business listing updated. It may need approval before public changes show.'
          : 'Business listing created. It will appear publicly after approval.'
      )
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
        <div className="mx-auto max-w-4xl">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="font-semibold text-stone-900 underline"
        >
          Back to dashboard
        </Link>

        <div className="mt-6 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
          <h1 className="text-3xl font-bold text-stone-900">
            {businessId ? 'Edit business listing' : 'Create business listing'}
          </h1>

          <p className="mt-2 text-stone-700">
            Add the details customers need to find, trust and contact your
            business.
          </p>

          <form onSubmit={handleSave} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block font-semibold">Business name</label>
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Fixing IT"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">Category</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 focus:border-stone-900 focus:outline-none"
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
              <label className="mb-2 block font-semibold">
                Business description
              </label>
              <textarea
                className="min-h-32 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers what you do, who you help and why they should choose you."
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">Services</label>
              <textarea
                className="min-h-28 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="List your main services, one per line if helpful."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold">Phone</label>
                <input
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">Email</label>
                <input
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Business email"
                  type="email"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-semibold">Website</label>
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.co.uk"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold">Facebook</label>
                <input
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="Facebook page URL"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">Instagram</label>
                <input
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-900 focus:border-stone-900 focus:outline-none"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram profile URL"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold">Town</label>
                <input
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">Postcode</label>
                <input
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="NG22..."
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-semibold">Service area</label>
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g. Ollerton, Boughton, Edwinstowe and surrounding villages"
              />
            </div>

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