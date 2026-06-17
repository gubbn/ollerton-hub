// lib/listingLimits.ts

export const FREE_LISTING_WORD_LIMIT = 80

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