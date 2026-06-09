'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    setMessage(error ? error.message : 'Password reset email sent.')

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-red-700">Ollerton Connect</h1>
          <p className="mt-2 text-stone-700">
            Reset your password and get back into your account
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
          <h2 className="text-3xl font-bold text-stone-900">Reset password</h2>

          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <input
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              disabled={loading}
              className="w-full rounded-xl bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send reset email'}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-stone-700">{message}</p>}

          <Link
            href="/login"
            className="mt-6 block text-sm font-semibold text-stone-900 underline hover:text-stone-700"
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  )
}