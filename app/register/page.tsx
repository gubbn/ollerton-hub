'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    setMessage(
      error
        ? error.message
        : 'Account created. Please check your email to confirm your sign up.'
    )

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-red-700">Ollerton Connect</h1>
          <p className="mt-2 text-stone-700">
            Helping local businesses connect with local customers
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-lg ring-1 ring-stone-200">
          <h2 className="text-3xl font-bold text-stone-900">
            Create your account
          </h2>

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <input
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

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
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-stone-700">{message}</p>}

          <p className="mt-6 text-sm text-stone-700">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-stone-900 underline hover:text-stone-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}