type ListingBadgesProps = {
  listingType: string | null
  isPremium?: boolean | null
  isFeatured?: boolean | null
}

export default function ListingBadges({
  listingType,
  isPremium,
  isFeatured,
}: ListingBadgesProps) {
  const isBusinessListing = listingType === 'business'

  if (!isBusinessListing) return null
  if (!isPremium && !isFeatured) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {isPremium ? (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
          Premium listing
        </span>
      ) : null}

      {isFeatured ? (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-300">
          Featured listing
        </span>
      ) : null}
    </div>
  )
}