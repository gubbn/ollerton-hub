'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomeSearch() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const query = search.trim()

    if (!query) {
      router.push('/directory')
      return
    }

    router.push(`/directory?search=${encodeURIComponent(query)}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="mb-2 block text-sm font-semibold text-stone-700">
        Search local businesses
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, service or category..."
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
        />

        <button
          type="submit"
          className="rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white hover:bg-stone-800"
        >
          Search
        </button>
      </div>
    </form>
  )
}