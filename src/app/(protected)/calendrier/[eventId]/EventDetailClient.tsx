'use client'

import { useState } from 'react'
import { RsvpSection } from '@/components/calendar/RsvpSection'
import { EventRsvp } from '@/components/calendar/types'

interface EventDetailClientProps {
  eventId: string
  initialRsvps: EventRsvp[]
  currentUserId: string
  canRsvp: boolean
  canEdit: boolean
}

export function EventDetailClient({
  eventId,
  initialRsvps,
  currentUserId,
  canRsvp,
}: EventDetailClientProps) {
  const [rsvps, setRsvps] = useState<EventRsvp[]>(initialRsvps)

  return (
    <RsvpSection
      eventId={eventId}
      rsvps={rsvps}
      currentUserId={currentUserId}
      canRsvp={canRsvp}
      onRsvpChange={setRsvps}
    />
  )
}
