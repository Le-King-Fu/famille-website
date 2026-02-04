import { EventCategory } from '@prisma/client'
import { RecurrenceRule } from '@/lib/recurrence'

export type RsvpStatusType = 'ATTENDING' | 'MAYBE' | 'NOT_ATTENDING'

export interface EventRsvp {
  id: string
  status: RsvpStatusType
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startDate: Date
  endDate: Date | null
  allDay: boolean
  category: EventCategory
  color: string | null
  imageUrl: string | null
  recurrence: RecurrenceRule | null
  location: string | null
  topicId: string | null
  createdById: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
  rsvps?: EventRsvp[]
  // Added by expansion
  originalDate?: Date
  isRecurring?: boolean
}

export interface EventFormData {
  title: string
  description: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  allDay: boolean
  category: EventCategory
  color: string
  imageUrl: string
  recurrence: RecurrenceRule | null
  location: string
  createForumTopic: boolean
}

export const categoryConfig: Record<
  EventCategory,
  { label: string; color: string; icon: string }
> = {
  BIRTHDAY: { label: 'Anniversaire', color: '#C17767', icon: '🎂' },
  REUNION: { label: 'Réunion', color: '#4A90A4', icon: '👨‍👩‍👧‍👦' },
  VACATION: { label: 'Vacances', color: '#6BBF59', icon: '✈️' },
  HOLIDAY: { label: 'Fête', color: '#F4A261', icon: '🎄' },
  OTHER: { label: 'Autre', color: '#8B8B8B', icon: '📌' },
}

export const defaultEventFormData: EventFormData = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  startTime: '09:00',
  endTime: '10:00',
  allDay: false,
  category: 'OTHER',
  color: '',
  imageUrl: '',
  recurrence: null,
  location: '',
  createForumTopic: false,
}
