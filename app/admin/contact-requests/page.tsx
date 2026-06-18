'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type ContactRequestStatus = 'new' | 'read' | 'actioned' | 'closed'

type ContactRequest = {
  id: string
  request_type: string | null
  subject: string
  name: string
  email: string
  phone: string | null
  message: string
  listing_id: string | null
  listing_slug: string | null
  status: ContactRequestStatus
  admin_notes: string | null
  source_url: string | null
  created_at: string
  updated_at: string
}

const statusOptions = ['all', 'new', 'read', 'actioned', 'closed'] as const

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusLabel(status: ContactRequestStatus) {
  if (status === 'new') return 'New'
  if (status === 'read') return 'Read'
  if (status === 'actioned') return 'Actioned'
  return 'Closed'
}

function statusClasses(status: ContactRequestStatus) {
  if (status === 'new') {
    return 'border-amber-200 bg-amber-100 text-amber-900'
  }

  if (status === 'read') {
    return 'border-sky-200 bg-sky-100 text-sky-900'
  }

  if (status === 'actioned') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-900'
  }

  return 'border-stone-300 bg-stone-200 text-stone-800'
}

function normaliseRequestStatus(value: string | null): ContactRequestStatus {
  if (
    value === 'new' ||
    value === 'read' ||
    value === 'actioned' ||
    value === 'closed'
  ) {
    return value
  }

  return 'new'
}

export default function AdminContactRequestsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusOptions)[number]>('all')
  const [search, setSearch] = useState('')
  const [selectedRequest, setSelectedRequest] =
    useState<ContactRequest | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    checkAdminAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedRequest) {
      setAdminNotes(selectedRequest.admin_notes ?? '')
    }
  }, [selectedRequest])

  async function checkAdminAndLoad() {
    setLoading(true)
    setErrorMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setErrorMessage(userError.message)
      setLoading(false)
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    setIsAdmin(true)
    await loadRequests()
    setLoading(false)
  }

  async function loadRequests() {
    setErrorMessage('')

    const { data, error } = await supabase
      .from('contact_requests')
      .select(
        'id, request_type, subject, name, email, phone, message, listing_id, listing_slug, status, admin_notes, source_url, created_at, updated_at'
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      setRequests([])
      return
    }

    const cleanData = (data ?? []).map((item) => ({
      ...item,
      status: normaliseRequestStatus(item.status),
    })) as ContactRequest[]

    setRequests(cleanData)

    if (selectedRequest) {
      const refreshedSelectedRequest = cleanData.find(
        (request) => request.id === selectedRequest.id
      )

      setSelectedRequest(refreshedSelectedRequest ?? null)
    }
  }

  async function updateRequestStatus(
    request: ContactRequest,
    status: ContactRequestStatus
  ) {
    setSavingId(request.id)
    setErrorMessage('')

    const { error } = await supabase
      .from('contact_requests')
      .update({ status })
      .eq('id', request.id)

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      setSavingId(null)
      return
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status } : item
      )
    )

    if (selectedRequest?.id === request.id) {
      setSelectedRequest({ ...selectedRequest, status })
    }

    setSavingId(null)
  }

  async function selectRequest(request: ContactRequest) {
    setSelectedRequest(request)

    if (request.status === 'new') {
      await updateRequestStatus(request, 'read')
    }
  }

  async function saveAdminNotes() {
    if (!selectedRequest) return

    setSavingId(selectedRequest.id)
    setErrorMessage('')

    const { error } = await supabase
      .from('contact_requests')
      .update({ admin_notes: adminNotes.trim() || null })
      .eq('id', selectedRequest.id)

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      setSavingId(null)
      return
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === selectedRequest.id
          ? { ...item, admin_notes: adminNotes.trim() || null }
          : item
      )
    )

    setSelectedRequest({
      ...selectedRequest,
      admin_notes: adminNotes.trim() || null,
    })

    setSavingId(null)
  }

  async function deleteRequest(request: ContactRequest) {
    const confirmed = window.confirm(
      `Delete the request from ${request.name}? This cannot be undone.`
    )

    if (!confirmed) return

    setSavingId(request.id)
    setErrorMessage('')

    const { error } = await supabase
      .from('contact_requests')
      .delete()
      .eq('id', request.id)

    if (error) {
      console.error(error)
      setErrorMessage(error.message)
      setSavingId(null)
      return
    }

    setRequests((current) => current.filter((item) => item.id !== request.id))

    if (selectedRequest?.id === request.id) {
      setSelectedRequest(null)
    }

    setSavingId(null)
  }

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase()

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === 'all' || request.status === statusFilter

      const searchText = [
        request.name,
        request.email,
        request.phone,
        request.subject,
        request.message,
        request.request_type,
        request.listing_slug,
        request.source_url,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = !term || searchText.includes(term)

      return matchesStatus && matchesSearch
    })
  }, [requests, statusFilter, search])

  const counts = useMemo(() => {
    return {
      all: requests.length,
      new: requests.filter((request) => request.status === 'new').length,
      read: requests.filter((request) => request.status === 'read').length,
      actioned: requests.filter((request) => request.status === 'actioned')
        .length,
      closed: requests.filter((request) => request.status === 'closed').length,
    }
  }, [requests])

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
        <div className="mx-auto max-w-6xl">
          <p>Loading contact requests...</p>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="mt-2 text-stone-700">
            You do not have permission to view this page.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
          >
            Back to homepage
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-stone-600 hover:text-stone-900"
            >
              ← Back to admin
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Contact requests
            </h1>

            <p className="mt-2 max-w-2xl text-stone-700">
              View enquiries from the contact form, including subscriptions,
              advert enquiries, listing reports and general messages.
            </p>
          </div>

          <button
            onClick={loadRequests}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50"
          >
            Refresh
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                statusFilter === status
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 bg-white text-stone-900 hover:bg-stone-50'
              }`}
            >
              <p className="text-sm font-semibold capitalize">
                {status === 'all' ? 'All' : statusLabel(status)}
              </p>
              <p className="mt-1 text-2xl font-bold">{counts[status]}</p>
            </button>
          ))}
        </section>

        <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <label className="text-sm font-semibold text-stone-700">
            Search requests
          </label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, subject, message, request type or listing slug..."
            className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-900"
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-stone-700 shadow-sm">
                No contact requests found.
              </div>
            ) : (
              filteredRequests.map((request) => (
                <article
                  key={request.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${
                    selectedRequest?.id === request.id
                      ? 'border-stone-900'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                            request.status
                          )}`}
                        >
                          {statusLabel(request.status)}
                        </span>

                        {request.request_type ? (
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                            {request.request_type}
                          </span>
                        ) : null}

                        {request.listing_slug ? (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
                            Listing: {request.listing_slug}
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-3 text-xl font-bold">
                        {request.subject}
                      </h2>

                      <p className="mt-1 text-sm text-stone-600">
                        From {request.name} · {formatDate(request.created_at)}
                      </p>

                      <p className="mt-3 line-clamp-3 text-stone-700">
                        {request.message}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        onClick={() => selectRequest(request)}
                        className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
                      >
                        View
                      </button>

                      {request.status === 'new' ? (
                        <button
                          onClick={() => updateRequestStatus(request, 'read')}
                          disabled={savingId === request.id}
                          className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                        >
                          Mark read
                        </button>
                      ) : null}

                      {request.status !== 'actioned' &&
                      request.status !== 'closed' ? (
                        <button
                          onClick={() =>
                            updateRequestStatus(request, 'actioned')
                          }
                          disabled={savingId === request.id}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Actioned
                        </button>
                      ) : null}

                      {request.status !== 'closed' ? (
                        <button
                          onClick={() => updateRequestStatus(request, 'closed')}
                          disabled={savingId === request.id}
                          className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                        >
                          Close
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          <aside className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
            {!selectedRequest ? (
              <div>
                <h2 className="text-xl font-bold">Request details</h2>
                <p className="mt-2 text-sm text-stone-700">
                  Select a request to view the full message, contact details and
                  admin notes.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                        selectedRequest.status
                      )}`}
                    >
                      {statusLabel(selectedRequest.status)}
                    </span>

                    <h2 className="mt-3 text-xl font-bold">
                      {selectedRequest.subject}
                    </h2>

                    <p className="mt-1 text-sm text-stone-600">
                      {formatDate(selectedRequest.created_at)}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="rounded-lg px-2 py-1 text-sm font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-stone-500">Name</p>
                    <p className="text-stone-900">{selectedRequest.name}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-stone-500">Email</p>
                    <a
                      href={`mailto:${selectedRequest.email}?subject=Re: ${encodeURIComponent(
                        selectedRequest.subject
                      )}`}
                      className="font-semibold text-red-700 hover:text-red-900"
                    >
                      {selectedRequest.email}
                    </a>
                  </div>

                  {selectedRequest.phone ? (
                    <div>
                      <p className="font-semibold text-stone-500">Phone</p>
                      <a
                        href={`tel:${selectedRequest.phone}`}
                        className="font-semibold text-red-700 hover:text-red-900"
                      >
                        {selectedRequest.phone}
                      </a>
                    </div>
                  ) : null}

                  {selectedRequest.request_type ? (
                    <div>
                      <p className="font-semibold text-stone-500">
                        Request type
                      </p>
                      <p className="text-stone-900">
                        {selectedRequest.request_type}
                      </p>
                    </div>
                  ) : null}

                  {selectedRequest.listing_slug ? (
                    <div>
                      <p className="font-semibold text-stone-500">
                        Related listing
                      </p>
                      <Link
                        href={`/business/${selectedRequest.listing_slug}`}
                        className="font-semibold text-red-700 hover:text-red-900"
                      >
                        View listing
                      </Link>
                    </div>
                  ) : null}

                  {selectedRequest.source_url ? (
                    <div>
                      <p className="font-semibold text-stone-500">
                        Source URL
                      </p>
                      <p className="break-words text-stone-900">
                        {selectedRequest.source_url}
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <p className="font-semibold text-stone-500">Message</p>
                    <p className="mt-1 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 text-stone-800">
                      {selectedRequest.message}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-semibold text-stone-700">
                    Admin notes
                  </label>

                  <textarea
                    value={adminNotes}
                    onChange={(event) => setAdminNotes(event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-900"
                    placeholder="Add internal notes here..."
                  />

                  <button
                    onClick={saveAdminNotes}
                    disabled={savingId === selectedRequest.id}
                    className="mt-3 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
                  >
                    {savingId === selectedRequest.id ? 'Saving...' : 'Save notes'}
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-200 pt-5">
                  <button
                    onClick={() => updateRequestStatus(selectedRequest, 'new')}
                    disabled={savingId === selectedRequest.id}
                    className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"
                  >
                    New
                  </button>

                  <button
                    onClick={() => updateRequestStatus(selectedRequest, 'read')}
                    disabled={savingId === selectedRequest.id}
                    className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"
                  >
                    Read
                  </button>

                  <button
                    onClick={() =>
                      updateRequestStatus(selectedRequest, 'actioned')
                    }
                    disabled={savingId === selectedRequest.id}
                    className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"
                  >
                    Actioned
                  </button>

                  <button
                    onClick={() =>
                      updateRequestStatus(selectedRequest, 'closed')
                    }
                    disabled={savingId === selectedRequest.id}
                    className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50"
                  >
                    Closed
                  </button>

                  <button
                    onClick={() => deleteRequest(selectedRequest)}
                    disabled={savingId === selectedRequest.id}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}