'use client'

import { useState } from 'react'
import { Check, HelpCircle, X, Loader2, Users } from 'lucide-react'
import { EventRsvp, RsvpStatusType } from './types'

interface RsvpSectionProps {
  eventId: string
  rsvps: EventRsvp[]
  currentUserId: string
  canRsvp: boolean // false for CHILD users
  onRsvpChange: (rsvps: EventRsvp[]) => void
}

const statusConfig: Record<RsvpStatusType, { label: string; icon: typeof Check; color: string; bgColor: string }> = {
  ATTENDING: {
    label: 'Je participe',
    icon: Check,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  },
  MAYBE: {
    label: 'Peut-être',
    icon: HelpCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
  },
  NOT_ATTENDING: {
    label: 'Je ne participe pas',
    icon: X,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  },
}

export function RsvpSection({
  eventId,
  rsvps,
  currentUserId,
  canRsvp,
  onRsvpChange,
}: RsvpSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const currentUserRsvp = rsvps.find((r) => r.userId === currentUserId)

  const handleRsvp = async (status: RsvpStatusType) => {
    if (!canRsvp || isSubmitting) return

    // If clicking the same status, remove RSVP
    if (currentUserRsvp?.status === status) {
      setIsSubmitting(true)
      setError('')
      try {
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erreur lors de la suppression')
        }
        // Remove current user's RSVP from local state
        onRsvpChange(rsvps.filter((r) => r.userId !== currentUserId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // Set new RSVP status
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }
      const data = await res.json()
      // Update local state
      const newRsvps = rsvps.filter((r) => r.userId !== currentUserId)
      newRsvps.push(data.rsvp)
      onRsvpChange(newRsvps)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group RSVPs by status
  const groupedRsvps: Record<RsvpStatusType, EventRsvp[]> = {
    ATTENDING: rsvps.filter((r) => r.status === 'ATTENDING'),
    MAYBE: rsvps.filter((r) => r.status === 'MAYBE'),
    NOT_ATTENDING: rsvps.filter((r) => r.status === 'NOT_ATTENDING'),
  }

  const totalCount = rsvps.length
  const attendingCount = groupedRsvps.ATTENDING.length
  const maybeCount = groupedRsvps.MAYBE.length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <h3 className="font-medium text-gray-900 dark:text-white">Participations</h3>
        {totalCount > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({attendingCount} participant{attendingCount !== 1 ? 's' : ''}
            {maybeCount > 0 && `, ${maybeCount} peut-être`})
          </span>
        )}
      </div>

      {/* RSVP Buttons */}
      {canRsvp && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(statusConfig) as RsvpStatusType[]).map((status) => {
            const config = statusConfig[status]
            const Icon = config.icon
            const isSelected = currentUserRsvp?.status === status

            return (
              <button
                key={status}
                onClick={() => handleRsvp(status)}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  isSelected
                    ? config.bgColor
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting && currentUserRsvp?.status !== status ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className={`h-4 w-4 ${isSelected ? config.color : 'text-gray-500 dark:text-gray-400'}`} />
                )}
                <span className={`text-sm font-medium ${isSelected ? config.color : 'text-gray-700 dark:text-gray-300'}`}>
                  {config.label}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!canRsvp && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Vous ne pouvez pas répondre à cet événement.
        </p>
      )}

      {/* Error message */}
      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Attendee lists */}
      {totalCount > 0 && (
        <div className="space-y-3 pt-2">
          {(Object.keys(statusConfig) as RsvpStatusType[]).map((status) => {
            const attendees = groupedRsvps[status]
            if (attendees.length === 0) return null

            const config = statusConfig[status]
            const Icon = config.icon

            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className={`text-sm font-medium ${config.color}`}>
                    {config.label} ({attendees.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pl-6">
                  {attendees.map((rsvp) => (
                    <span
                      key={rsvp.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {rsvp.user.firstName} {rsvp.user.lastName}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalCount === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune réponse pour le moment.
        </p>
      )}
    </div>
  )
}
