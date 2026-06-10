'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminDebugPage() {
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setResult({
          loggedIn: false,
          userError: userError?.message || null,
        })
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, is_admin')
        .eq('id', user.id)
        .single()

      setResult({
        loggedIn: true,
        userId: user.id,
        userEmail: user.email,
        profile,
        profileError: profileError?.message || null,
      })
    }

    checkAdmin()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Debug</h1>

      <pre className="mt-6 overflow-auto rounded-xl bg-white p-4 text-sm text-gray-900 shadow">
        {JSON.stringify(result, null, 2)}
      </pre>
    </main>
  )
}