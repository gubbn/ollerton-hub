'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-red-700">Ollerton Hub</h1>
          <p className="mt-2 text-stone-700">
            Sign in to manage your business listing
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
          <h2 className="text-3xl font-bold text-stone-900">Sign in</h2>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              disabled={loading}
              className="w-full rounded-xl bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-red-700">{message}</p>}

          <div className="mt-6 flex justify-between text-sm">
            <Link
              href="/register"
              className="font-semibold text-stone-900 underline hover:text-stone-700"
            >
              Register
            </Link>

            <Link
              href="/reset-password"
              className="font-semibold text-stone-900 underline hover:text-stone-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}