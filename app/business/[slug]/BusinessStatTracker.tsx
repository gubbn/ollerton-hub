'use client'

import { ReactNode, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

type BusinessStatTrackerProps = {
  businessId: string
  eventType:
    | 'profile_view'
    | 'website_click'
    | 'phone_click'
    | 'email_click'
    | 'facebook_click'
    | 'instagram_click'
  href?: string
  children?: ReactNode
  className?: string
  target?: '_blank'
}

export default function BusinessStatTracker({
  businessId,
  eventType,
  href,
  children,
  className,
  target,
}: BusinessStatTrackerProps) {
  async function trackEvent() {
    await supabase.from('business_stats').insert({
      business_id: businessId,
      event_type: eventType,
    })
  }

  useEffect(() => {
    if (!href) {
      trackEvent()
    }
  }, [])

  if (!href) return null

  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={target === '_blank' ? 'noreferrer' : undefined}
      onClick={trackEvent}
    >
      {children}
    </a>
  )
}