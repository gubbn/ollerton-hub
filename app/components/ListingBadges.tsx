type ListingBadgesProps = {
  isFeatured?: boolean | null
  isPremium?: boolean | null
  listingType?: string | null
  usefulListingType?: string | null
  className?: string
}

function isLocalInfoListing(
  listingType?: string | null,
  usefulListingType?: string | null
) {
  return (
    listingType === 'community' ||
    listingType === 'local_info' ||
    Boolean(usefulListingType)
  )
}

export default function ListingBadges({
  isFeatured,
  isPremium,
  listingType,
  usefulListingType,
  className = '',
}: ListingBadgesProps) {
  const showLocalInfo = isLocalInfoListing(listingType, usefulListingType)

  if (!isFeatured && !isPremium && !showLocalInfo) {
    return null
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {showLocalInfo ? (
        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold leading-none text-red-800">
          Local info
        </span>
      ) : null}

      {isPremium ? (
        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold leading-none text-amber-800 ring-1 ring-amber-300">
          Premium
        </span>
      ) : null}

      {isFeatured ? (
        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold leading-none text-emerald-800 ring-1 ring-emerald-300">
          Featured
        </span>
      ) : null}
    </div>
  )
}