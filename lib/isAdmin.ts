import { supabase } from '../lib/supabaseClient'

export async function isAdmin() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (error) return false

  return data?.is_admin === true
}