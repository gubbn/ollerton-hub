'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

function cleanSearch(value: string) {
  return value.trim()
}

export default function HomeSearch() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanedSearch = cleanSearch(search)

    if (!cleanedSearch) {
      router.push('/directory')
      return
    }

    router.push(`/directory?q=${encodeURIComponent(cleanedSearch)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search businesses, services or local info..."
        className="min-w-0 flex-1 rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900"
      />

      <button
        type="submit"
        className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800"
      >
        Search
      </button>
    </form>
  )
}