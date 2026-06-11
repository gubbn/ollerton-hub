'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Suggestion = {
  id: string
  business_id: string | null
  suggestion: string
  reviewed: boolean | null
  created_at: string
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AdminCategorySuggestionsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    async function loadSuggestions() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('category_suggestions')
        .select('id, business_id, suggestion, reviewed, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setSuggestions((data as Suggestion[]) || [])
      }

      setLoading(false)
    }

    loadSuggestions()
  }, [router])

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((item) => {
      if (filter === 'all') return true
      if (filter === 'reviewed') return item.reviewed === true
      return item.reviewed !== true
    })
  }, [suggestions, filter])

  async function approveSuggestion(item: Suggestion) {
    setError('')
    setSuccess('')

    const name = item.suggestion.trim()
    const slug = makeSlug(name)

    if (!name || !slug) {
      setError('Suggestion is not valid.')
      return
    }

    const { error: categoryError } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description: null,
      })

    if (categoryError) {
      setError(categoryError.message)
      return
    }

    const { error: suggestionError } = await supabase
      .from('category_suggestions')
      .update({ reviewed: true })
      .eq('id', item.id)

    if (suggestionError) {
      setError(suggestionError.message)
      return
    }

    setSuggestions((current) =>
      current.map((suggestion) =>
        suggestion.id === item.id
          ? { ...suggestion, reviewed: true }
          : suggestion
      )
    )

    setSuccess(`Category "${name}" created.`)
  }

  async function rejectSuggestion(item: Suggestion) {
    setError('')
    setSuccess('')

    const { error } = await supabase
      .from('category_suggestions')
      .update({ reviewed: true })
      .eq('id', item.id)

    if (error) {
      setError(error.message)
      return
    }

    setSuggestions((current) =>
      current.map((suggestion) =>
        suggestion.id === item.id
          ? { ...suggestion, reviewed: true }
          : suggestion
      )
    )

    setSuccess('Suggestion marked as reviewed.')
  }

  async function deleteSuggestion(item: Suggestion) {
    const confirmed = window.confirm('Delete this suggestion?')
    if (!confirmed) return

    setError('')
    setSuccess('')

    const { error } = await supabase
      .from('category_suggestions')
      .delete()
      .eq('id', item.id)

    if (error) {
      setError(error.message)
      return
    }

    setSuggestions((current) =>
      current.filter((suggestion) => suggestion.id !== item.id)
    )

    setSuccess('Suggestion deleted.')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <p className="text-gray-700">Loading category suggestions...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-gray-600 hover:underline">
          ← Back to admin
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Category Suggestions
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Review new category ideas submitted by businesses.
            </p>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border bg-white p-3 text-gray-900"
          >
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="all">All</option>
          </select>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
          </p>
        )}

        <div className="mt-8 grid gap-4">
          {filteredSuggestions.map((item) => (
            <article key={item.id} className="rounded-2xl bg-white p-5 shadow">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {item.suggestion}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Suggested on{' '}
                    {new Date(item.created_at).toLocaleDateString('en-GB')}
                  </p>

                  {item.business_id && (
                    <p className="mt-1 break-all text-xs text-gray-500">
                      Business ID: {item.business_id}
                    </p>
                  )}
                </div>

                <span
                  className={`h-fit rounded-full px-3 py-1 text-xs font-medium ${
                    item.reviewed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.reviewed ? 'Reviewed' : 'Pending'}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {!item.reviewed && (
                  <>
                    <button
                      onClick={() => approveSuggestion(item)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      Approve and create category
                    </button>

                    <button
                      onClick={() => rejectSuggestion(item)}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
                    >
                      Mark reviewed
                    </button>
                  </>
                )}

                <button
                  onClick={() => deleteSuggestion(item)}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}

          {filteredSuggestions.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow">
              No category suggestions found.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}