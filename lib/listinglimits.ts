export type ListingTier = 'free' | 'featured' | 'premium'

export const WORD_LIMITS: Record<
  ListingTier,
  {
    description: number
    services: number
  }
> = {
  free: {
    description: 50,
    services: 40,
  },
  featured: {
    description: 120,
    services: 100,
  },
  premium: {
    description: 250,
    services: 200,
  },
}

export function countWords(value: string | null | undefined) {
  if (!value) return 0

  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function trimToWordLimit(value: string, limit: number) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, limit)
    .join(' ')
}

export function getListingTier({
  is_featured,
  is_premium,
}: {
  is_featured?: boolean | null
  is_premium?: boolean | null
}): ListingTier {
  if (is_premium) return 'premium'
  if (is_featured) return 'featured'
  return 'free'
}

export function getTierLabel(tier: ListingTier) {
  if (tier === 'premium') return 'Premium'
  if (tier === 'featured') return 'Featured'
  return 'Free'
}

export function getWordLimit(
  tier: ListingTier,
  field: 'description' | 'services'
) {
  return WORD_LIMITS[tier][field]
}