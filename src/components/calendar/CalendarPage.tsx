'use client'

import { useState, useEffect, useCallback } from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { Calendar } from './Calendar'
import { CalendarEvent } from './types'
import { Loader2 } from 'lucide-react'

interface CalendarPageProps {
  userId: string
  userRole: string
}

export function CalendarPage({ userId, userRole }: CalendarPageProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = userRole === 'ADMIN'
  const canCreateEvent = userRole !== 'CHILD'

  // Fetch events for a date range
  const fetchEvents = useCallback(async (start: Date, end: Date) => {
    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      })

      const response = await fetch(`/api/events?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      // Parse dates from JSON
      const parsedEvents = data.events.map((e: CalendarEvent) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : null,
      }))

      setEvents(parsedEvents)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const now = new Date()
    fetchEvents(startOfMonth(now), endOfMonth(now))
  }, [fetchEvents])

  // Handle range change
  const handleRangeChange = useCallback(
    (start: Date, end: Date) => {
      fetchEvents(start, end)
    },
    [fetchEvents]
  )

  // Create event
  const handleCreateEvent = useCallback(
    async (eventData: Partial<CalendarEvent>) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      // Add the new event to the list
      const newEvent = {
        ...data.event,
        startDate: new Date(data.event.startDate),
        endDate: data.event.endDate ? new Date(data.event.endDate) : null,
      }
      setEvents((prev) => [...prev, newEvent])
    },
    []
  )

  // Update event
  const handleUpdateEvent = useCallback(
    async (id: string, eventData: Partial<CalendarEvent>) => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      // Update the event in the list
      const updatedEvent = {
        ...data.event,
        startDate: new Date(data.event.startDate),
        endDate: data.event.endDate ? new Date(data.event.endDate) : null,
      }
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? updatedEvent : e))
      )
    },
    []
  )

  // Delete event
  const handleDeleteEvent = useCallback(async (id: string) => {
    const response = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erreur lors de la suppression')
    }

    // Remove the event from the list
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-bleu" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200 text-red-700">
        <p>Erreur: {error}</p>
        <button
          onClick={() => {
            setLoading(true)
            const now = new Date()
            fetchEvents(startOfMonth(now), endOfMonth(now))
          }}
          className="mt-2 text-sm underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <Calendar
      events={events}
      onEventCreate={handleCreateEvent}
      onEventUpdate={handleUpdateEvent}
      onEventDelete={handleDeleteEvent}
      onRangeChange={handleRangeChange}
      isAdmin={isAdmin}
      canCreateEvent={canCreateEvent}
      currentUserId={userId}
    />
  )
}
