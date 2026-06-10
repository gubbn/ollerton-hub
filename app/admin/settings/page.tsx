'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type SiteSetting = {
  id: string
  setting_key: string
  setting_value: string | null
}

export default function AdminSettingsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadSettings() {
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
        .from('site_settings')
        .select('id, setting_key, setting_value')
        .order('setting_key', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setSettings(data || [])
      }

      setLoading(false)
    }

    loadSettings()
  }, [router])

  function updateLocalSetting(id: string, value: string) {
    setSettings((current) =>
      current.map((setting) =>
        setting.id === id ? { ...setting, setting_value: value } : setting
      )
    )
  }

  async function saveSettings() {
    setSaving(true)
    setError('')
    setSuccess('')

    for (const setting of settings) {
      const { error } = await supabase
        .from('site_settings')
        .update({
          setting_value: setting.setting_value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', setting.id)

      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setSuccess('Settings saved.')
  }

  function labelFor(key: string) {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <p className="text-gray-700">Loading settings...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <section className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-gray-600 hover:underline">
          ← Back to admin
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Site Settings
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Manage global wording and launch settings.
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

        <div className="mt-8 grid gap-4">
          {settings.map((setting) => (
            <label
              key={setting.id}
              className="grid gap-2 rounded-2xl bg-white p-5 shadow"
            >
              <span className="text-sm font-bold text-gray-900">
                {labelFor(setting.setting_key)}
              </span>

              {setting.setting_key.includes('moderation') ||
              setting.setting_key.includes('approval') ? (
                <select
                  value={setting.setting_value || 'true'}
                  onChange={(e) =>
                    updateLocalSetting(setting.id, e.target.value)
                  }
                  className="rounded-lg border p-3 text-gray-900"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : setting.setting_key.includes('intro') ? (
                <textarea
                  value={setting.setting_value || ''}
                  onChange={(e) =>
                    updateLocalSetting(setting.id, e.target.value)
                  }
                  rows={4}
                  className="rounded-lg border p-3 text-gray-900"
                />
              ) : (
                <input
                  value={setting.setting_value || ''}
                  onChange={(e) =>
                    updateLocalSetting(setting.id, e.target.value)
                  }
                  className="rounded-lg border p-3 text-gray-900"
                />
              )}

              <span className="text-xs text-gray-500">
                Key: {setting.setting_key}
              </span>
            </label>
          ))}
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="mt-8 rounded-lg bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </section>
    </main>
  )
}