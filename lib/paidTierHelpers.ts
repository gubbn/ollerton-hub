export type PaidTier = 'free' | 'featured'

export function getThirtyDaysFromNow() {
  const now = new Date()
  const expires = new Date(now)

  expires.setDate(expires.getDate() + 30)

  return {
    now: now.toISOString(),
    expiresAt: expires.toISOString(),
  }
}

export function getRenewedExpiryDate(currentExpiry: string | null) {
  const now = new Date()
  const currentExpiryDate = currentExpiry ? new Date(currentExpiry) : null

  const baseDate =
    currentExpiryDate && currentExpiryDate > now ? currentExpiryDate : now

  const renewedExpiry = new Date(baseDate)
  renewedExpiry.setDate(renewedExpiry.getDate() + 30)

  return {
    renewedAt: now.toISOString(),
    expiresAt: renewedExpiry.toISOString(),
  }
}