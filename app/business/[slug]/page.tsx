import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import BusinessStatTracker from './BusinessStatTracker'

type BusinessPageProps = {
  params: Promise<{ slug: string }>
}

type CategoryRelation = { name: string } | { name: string }[] | null

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
  logo_url: string | null
  is_featured: boolean
  categories: CategoryRelation
}

type Review = {
  id: string
  reviewer_name: string
  rating: number
  review_text: string
}

function getCategoryName(categories: CategoryRelation) {
  if (!categories) return 'Local business'
  if (Array.isArray(categories)) return categories[0]?.name ?? 'Local business'
  return categories.name
}

function cleanWebsiteUrl(url: string) {
  return url.startsWith('http') ? url : `https://${url}`
}

function displayWebsiteUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params

  const { data: businessData } = await supabase
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
      logo_url,
      is_featured,
      categories (
        name
      )
    `)
    .eq('slug', slug)
    .eq('is_approved', true)
    .single()

  if (!businessData) notFound()

  const business = businessData as Business

  const { data: reviewData } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, review_text')
    .eq('business_id', business.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  const reviews = (reviewData as Review[] | null) ?? []

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : null

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <BusinessStatTracker businessId={business.id} eventType="profile_view" />

      <section className="bg-stone-900 px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <Link href="/directory" className="text-sm text-red-300 underline">
            ← Back to directory
          </Link>

          <div className="mt-8 rounded-3xl bg-white/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
              {getCategoryName(business.categories)}
            </p>

            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={`${business.business_name} logo`}
                  className="h-20 w-20 rounded-3xl bg-white object-cover ring-1 ring-white/20"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-3xl font-bold text-white ring-1 ring-white/20">
                  {business.business_name.charAt(0)}
                </div>
              )}

              <div>
                <h1 className="text-4xl font-bold">
                  {business.business_name}
                </h1>

                <div className="mt-3 flex flex-wrap gap-2">
                  {business.is_featured && (
                    <span className="inline-block rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
                      Featured listing
                    </span>
                  )}
                </div>

                {averageRating !== null && (
                  <p className="mt-3 text-stone-100">
                    ⭐ {averageRating.toFixed(1)} from {reviews.length} review
                    {reviews.length === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <h2 className="text-xl font-bold">About</h2>
              <p className="mt-3 whitespace-pre-line text-stone-700">
                {business.description ?? 'No description added yet.'}
              </p>
            </div>

            {business.services && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
                <h2 className="text-xl font-bold">Services</h2>
                <p className="mt-3 whitespace-pre-line text-stone-700">
                  {business.services}
                </p>
              </div>
            )}

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Reviews</h2>

                <Link
                  href={`/business/${slug}/review`}
                  className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                >
                  Leave a review
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {reviews.length ? (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-stone-200 p-4"
                    >
                      <p className="font-semibold">{review.reviewer_name}</p>
                      <p className="mt-1 text-sm text-amber-600">
                        {'⭐'.repeat(review.rating)}
                      </p>
                      <p className="mt-3 text-stone-700">
                        {review.review_text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-stone-600">
                    No approved reviews yet. Be the first to leave one.
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <h2 className="text-xl font-bold">Contact</h2>

              <div className="mt-4 space-y-3 text-sm text-stone-700">
                {business.phone && (
                  <p>
                    📞{' '}
                    <BusinessStatTracker
                      businessId={business.id}
                      eventType="phone_click"
                      href={`tel:${business.phone}`}
                      className="underline"
                    >
                      {business.phone}
                    </BusinessStatTracker>
                  </p>
                )}

                {business.email && (
                  <p>
                    ✉️{' '}
                    <BusinessStatTracker
                      businessId={business.id}
                      eventType="email_click"
                      href={`mailto:${business.email}`}
                      className="underline"
                    >
                      {business.email}
                    </BusinessStatTracker>
                  </p>
                )}

                {business.website && (
                  <p>
                    🌐{' '}
                    <BusinessStatTracker
                      businessId={business.id}
                      eventType="website_click"
                      href={cleanWebsiteUrl(business.website)}
                      className="break-all underline"
                      target="_blank"
                    >
                      {displayWebsiteUrl(business.website)}
                    </BusinessStatTracker>
                  </p>
                )}

                {business.facebook && (
                  <p>
                    Facebook:{' '}
                    <BusinessStatTracker
                      businessId={business.id}
                      eventType="facebook_click"
                      href={cleanWebsiteUrl(business.facebook)}
                      className="break-all underline"
                      target="_blank"
                    >
                      View page
                    </BusinessStatTracker>
                  </p>
                )}

                {business.instagram && (
                  <p>
                    Instagram:{' '}
                    <BusinessStatTracker
                      businessId={business.id}
                      eventType="instagram_click"
                      href={cleanWebsiteUrl(business.instagram)}
                      className="break-all underline"
                      target="_blank"
                    >
                      View profile
                    </BusinessStatTracker>
                  </p>
                )}
              </div>
            </div>

            {business.opening_times && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
                <h2 className="text-xl font-bold">Opening times</h2>
                <p className="mt-4 whitespace-pre-line text-sm text-stone-700">
                  {business.opening_times}
                </p>
              </div>
            )}

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <h2 className="text-xl font-bold">Address</h2>

              <div className="mt-4 text-sm text-stone-700">
                {business.address_line_1 && <p>{business.address_line_1}</p>}
                {business.address_line_2 && <p>{business.address_line_2}</p>}
                {business.town && <p>{business.town}</p>}
                {business.postcode && <p>{business.postcode}</p>}

                {!business.address_line_1 &&
                  !business.address_line_2 &&
                  !business.town &&
                  !business.postcode && <p>No address added yet.</p>}

                {business.service_area && (
                  <p className="mt-4">
                    <span className="font-semibold">Service area:</span>{' '}
                    {business.service_area}
                  </p>
                )}

                <div className="mt-8 border-t pt-4">
                  <Link
                    href={`/contact?subject=Report Listing&business=${business.slug}`}
                    className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                  >
                    Report this listing
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}