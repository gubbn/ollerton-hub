'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
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

export default function AdminCategoriesPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    async function loadCategories() {
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
        .from('categories')
        .select('id, name, slug, description, created_at')
        .order('name', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setCategories(data || [])
      }

      setLoading(false)
    }

    loadCategories()
  }, [router])

  async function addCategory() {
    setError('')
    setSuccess('')

    const name = newName.trim()

    if (!name) {
      setError('Category name is required.')
      return
    }

    const slug = makeSlug(name)

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description: newDescription.trim() || null,
      })
      .select('id, name, slug, description, created_at')
      .single()

    if (error) {
      setError(error.message)
      return
    }

    setCategories((current) =>
      [...current, data as Category].sort((a, b) => a.name.localeCompare(b.name))
    )

    setNewName('')
    setNewDescription('')
    setSuccess('Category added.')
  }

  async function updateCategory(category: Category) {
    setError('')
    setSuccess('')

    const name = category.name.trim()

    if (!name) {
      setError('Category name cannot be blank.')
      return
    }

    const { error } = await supabase
      .from('categories')
      .update({
        name,
        slug: category.slug.trim() || makeSlug(name),
        description: category.description?.trim() || null,
      })
      .eq('id', category.id)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('Category updated.')
  }

  async function deleteCategory(category: Category) {
    const confirmed = window.confirm(
      `Delete ${category.name}? Only do this if no businesses use this category.`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (error) {
      setError(error.message)
      return
    }

    setCategories((current) =>
      current.filter((item) => item.id !== category.id)
    )

    setSuccess('Category deleted.')
  }

  function updateLocalCategory(
    id: string,
    field: keyof Category,
    value: string
  ) {
    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, [field]: value } : category
      )
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <p className="text-gray-700">Loading categories...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-gray-600 hover:underline">
          ← Back to admin
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Category Management
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Add, edit and remove directory categories.
        </p>

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

        <div className="mt-8 rounded-2xl bg-white p-5 shadow">
          <h2 className="text-xl font-bold text-gray-900">Add category</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name"
              className="rounded-lg border p-3 text-gray-900"
            />

            <input
              value={makeSlug(newName)}
              readOnly
              placeholder="Auto slug"
              className="rounded-lg border bg-gray-50 p-3 text-gray-600"
            />
          </div>

          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="mt-4 w-full rounded-lg border p-3 text-gray-900"
          />

          <button
            onClick={addCategory}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 font-medium text-white"
          >
            Add category
          </button>
        </div>

        <div className="mt-8 grid gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl bg-white p-5 shadow"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-gray-700">
                    Name
                  </span>
                  <input
                    value={category.name}
                    onChange={(e) =>
                      updateLocalCategory(category.id, 'name', e.target.value)
                    }
                    className="rounded-lg border p-3 text-gray-900"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm font-medium text-gray-700">
                    Slug
                  </span>
                  <input
                    value={category.slug}
                    onChange={(e) =>
                      updateLocalCategory(category.id, 'slug', e.target.value)
                    }
                    className="rounded-lg border p-3 text-gray-900"
                  />
                </label>
              </div>

              <label className="mt-4 grid gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Description
                </span>
                <textarea
                  value={category.description || ''}
                  onChange={(e) =>
                    updateLocalCategory(
                      category.id,
                      'description',
                      e.target.value
                    )
                  }
                  rows={3}
                  className="rounded-lg border p-3 text-gray-900"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => updateCategory(category)}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Save
                </button>

                <button
                  onClick={() =>
                    updateLocalCategory(
                      category.id,
                      'slug',
                      makeSlug(category.name)
                    )
                  }
                  className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900"
                >
                  Regenerate slug
                </button>

                <button
                  onClick={() => deleteCategory(category)}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow">
              No categories found.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}