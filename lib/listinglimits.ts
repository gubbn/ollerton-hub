export type ListingTier = 'free' | 'featured'

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
  paid_tier,
}: {
  is_featured?: boolean | null
  paid_tier?: string | null
}): ListingTier {
  if (paid_tier === 'featured') return 'featured'
  if (is_featured) return 'featured'

  return 'free'
}

export function getTierLabel(tier: ListingTier) {
  if (tier === 'featured') return 'Featured'

  return 'Free'
}

export function getWordLimit(
  tier: ListingTier,
  field: 'description' | 'services'
) {
  return WORD_LIMITS[tier][field]
}