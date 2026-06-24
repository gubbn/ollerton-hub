import { supabase } from '@/lib/supabaseClient'

export async function expireOldPaidListings() {
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('businesses')
    .update({
      paid_tier: 'free',
      is_featured: false,
      paid_tier_last_downgraded_at: now,
      updated_at: now,
    })
    .in('paid_tier', ['featured'])
    .lt('paid_tier_expires_at', now)

  return { error }
}