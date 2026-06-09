'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
        return
      }

      setEmail(data.user.email ?? null)
    }

    loadUser()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h1 className="text-2xl font-bold">Business dashboard</h1>
          <p className="mt-2 text-stone-600">Signed in as {email}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/business"
              className="rounded-xl bg-stone-900 p-5 font-semibold text-white"
            >
              Create or edit business listing
            </Link>

            <Link
              href="/directory"
              className="rounded-xl bg-white p-5 font-semibold ring-1 ring-stone-200"
            >
              View public directory
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 rounded-xl border px-4 py-2 font-semibold"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  )
}