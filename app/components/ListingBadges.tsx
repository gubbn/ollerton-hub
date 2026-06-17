type ListingBadgesProps = {
  listingType: string | null
  isPremium?: boolean | null
  isFeatured?: boolean | null
  compact?: boolean
}

export default function ListingBadges({
  listingType,
  isPremium,
  isFeatured,
  compact = false,
}: ListingBadgesProps) {
  const isBusinessListing = listingType === 'business'

  if (!isBusinessListing) return null
  if (!isPremium && !isFeatured) return null

  const wrapperClass = compact
    ? 'mt-2 flex flex-wrap gap-1.5'
    : 'mt-3 flex flex-wrap gap-2'

  const badgeClass = compact
    ? 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold'
    : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold'

  return (
    <div className={wrapperClass}>
      {isPremium ? (
        <span className={`${badgeClass} bg-amber-100 text-amber-900 ring-1 ring-amber-300`}>
          Premium
        </span>
      ) : null}

      {isFeatured ? (
        <span className={`${badgeClass} bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300`}>
          Featured
        </span>
      ) : null}
    </div>
  )
}