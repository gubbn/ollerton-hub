'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    console.log('Signup data:', data)
    console.log('Signup error:', signUpError)

    if (signUpError) {
      setError(signUpError.message || JSON.stringify(signUpError))
      setLoading(false)
      return
    }

    setMessage(
      'Account created. Please check your email to confirm your account.'
    )

    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-red-700 underline">
          ← Back to home
        </Link>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Business account
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Create your Ollerton Hub account
          </h1>

          <p className="mt-3 text-sm text-stone-600">
            Register to create and manage your business listing.
          </p>

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3"
                placeholder="Re-enter your password"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-red-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}