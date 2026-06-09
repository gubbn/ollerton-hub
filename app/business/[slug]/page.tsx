import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type BusinessPageProps = {
  params: Promise<{
    slug: string
  }>
}

type Business = {
  id: string
  business_name: string
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
  logo_url: string | null
  cover_image_url: string | null
  is_featured: boolean
  categories: {
    name: string
  } | null
}

type Review = {
  id: string
  reviewer_name: string
  rating: number
  review_text: string
  created_at: string
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params

  const { data: business } = await supabase
    .from('businesses')
    .select(`
      id,
      business_name,
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
      logo_url,
      cover_image_url,
      is_featured,
      categories (
        name
      )
    `)
    .eq('slug', slug)
    .eq('is_approved', true)
    .single()

  if (!business) {
    notFound()
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, review_text, created_at')
    .eq('business_id', business.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  const approvedReviews = (reviews as Review[] | null) ?? []

  const averageRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((total, review) => total + review.rating, 0) /
        approvedReviews.length
      : null

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="bg-stone-900 px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <Link href="/directory" className="text-sm text-amber-300 underline">
            Back to directory
          </Link>

          <div className="mt-8 rounded-3xl bg-white/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">
              {business.categories?.name ?? 'Local business'}
            </p>

            <h1 className="mt-3 text-4xl font-bold">{business.business_name}</h1>

            {business.is_featured && (
              <span className="mt-4 inline-block rounded-full bg-amber-300 px-3 py-1 text-sm font-semibold text-stone-950">
                Featured business
              </span>
            )}

            {averageRating && (
              <p className="mt-4 text-stone-100">
                ⭐ {averageRating.toFixed(1)} from {approvedReviews.length}{' '}
                review{approvedReviews.length === 1 ? '' : 's'}
              </p>
            )}
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
                  className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
                >
                  Leave a review
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {approvedReviews.length ? (
                  approvedReviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-stone-200 p-4"
                    >
                      <p className="font-semibold">{review.reviewer_name}</p>
                      <p className="mt-1 text-sm text-amber-600">
                        {'⭐'.repeat(review.rating)}
                      </p>
                      <p className="mt-3 text-stone-700">{review.review_text}</p>
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

              <div className="mt-4 space-y-3 text-sm">
                {business.phone && <p>📞 {business.phone}</p>}

                {business.email && (
                  <p>
                    ✉️{' '}
                    <a className="underline" href={`mailto:${business.email}`}>
                      {business.email}
                    </a>
                  </p>
                )}

                {business.website && (
                  <p>
                    🌐{' '}
                    <a
                      className="underline"
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Website
                    </a>
                  </p>
                )}

                {business.facebook && (
                  <p>
                    Facebook:{' '}
                    <a
                      className="underline"
                      href={business.facebook}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View page
                    </a>
                  </p>
                )}

                {business.instagram && (
                  <p>
                    Instagram:{' '}
                    <a
                      className="underline"
                      href={business.instagram}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View profile
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <h2 className="text-xl font-bold">Location</h2>

              <div className="mt-4 text-sm text-stone-700">
                {business.address_line_1 && <p>{business.address_line_1}</p>}
                {business.address_line_2 && <p>{business.address_line_2}</p>}
                {business.town && <p>{business.town}</p>}
                {business.postcode && <p>{business.postcode}</p>}

                {business.service_area && (
                  <p className="mt-4">
                    <span className="font-semibold">Service area:</span>{' '}
                    {business.service_area}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}