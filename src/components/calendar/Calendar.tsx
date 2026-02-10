'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  View,
  SlotInfo,
} from 'react-big-calendar'
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { EventCategory, UserRole } from '@prisma/client'
import { CalendarEvent, categoryConfig } from './types'
import { EventModal } from './EventModal'
import { CategoryFilter } from './CategoryFilter'
import { ChevronLeft, ChevronRight, Plus, Download, EyeOff } from 'lucide-react'

import 'react-big-calendar/lib/css/react-big-calendar.css'

// Setup date-fns localizer for French
const locales = { fr }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
  getDay,
  locales,
})

// French messages for react-big-calendar
const messages = {
  allDay: 'Journée',
  previous: 'Précédent',
  next: 'Suivant',
  today: "Aujourd'hui",
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucun événement dans cette période.',
  showMore: (total: number) => `+ ${total} de plus`,
}

interface CalendarProps {
  events: CalendarEvent[]
  onEventCreate: (event: Partial<CalendarEvent> & { createForumTopic?: boolean; hiddenFromUserIds?: string[] }) => Promise<void>
  onEventUpdate: (id: string, event: Partial<CalendarEvent> & { hiddenFromUserIds?: string[] }) => Promise<void>
  onEventDelete: (id: string) => Promise<void>
  onRangeChange: (start: Date, end: Date) => void
  isAdmin: boolean
  canCreateEvent: boolean
  currentUserId: string
  userRole?: UserRole
}

export function Calendar({
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onRangeChange,
  isAdmin,
  canCreateEvent,
  currentUserId,
  userRole,
}: CalendarProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<Set<EventCategory>>(
    () => new Set(Object.keys(categoryConfig) as EventCategory[])
  )

  // Convert and filter events for react-big-calendar
  const calendarEvents = useMemo(
    () =>
      events
        .filter((event) => selectedCategories.has(event.category))
        .map((event) => ({
          ...event,
          start: new Date(event.startDate),
          end: event.endDate ? new Date(event.endDate) : new Date(event.startDate),
        })),
    [events, selectedCategories]
  )

  // Handle date navigation
  const handleNavigate = useCallback(
    (newDate: Date) => {
      setDate(newDate)
      const start = startOfMonth(newDate)
      const end = endOfMonth(newDate)
      onRangeChange(start, end)
    },
    [onRangeChange]
  )

  // Handle view change
  const handleViewChange = useCallback((newView: View) => {
    setView(newView)
  }, [])

  // Handle slot selection (clicking on empty space)
  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      if (!canCreateEvent) return
      setSelectedEvent(null)
      setSelectedSlot(slotInfo.start)
      setModalOpen(true)
    },
    [canCreateEvent]
  )

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setSelectedSlot(null)
    setModalOpen(true)
  }, [])

  // Handle event save
  const handleSaveEvent = useCallback(
    async (eventData: Partial<CalendarEvent>) => {
      if (selectedEvent) {
        await onEventUpdate(selectedEvent.id, eventData)
      } else {
        await onEventCreate(eventData)
      }
    },
    [selectedEvent, onEventCreate, onEventUpdate]
  )

  // Handle event delete
  const handleDeleteEvent = useCallback(async () => {
    if (selectedEvent) {
      await onEventDelete(selectedEvent.id)
    }
  }, [selectedEvent, onEventDelete])

  // Check if user can edit the selected event
  const canEditEvent =
    !selectedEvent ||
    isAdmin ||
    selectedEvent.createdById === currentUserId

  // Custom event styling
  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      const config = categoryConfig[event.category]
      const color = event.color || config.color

      return {
        style: {
          backgroundColor: color,
          borderColor: color,
          color: '#fff',
          borderRadius: '4px',
          border: 'none',
          fontSize: '0.75rem',
        },
      }
    },
    []
  )

  // Custom event component
  const EventComponent = useCallback(
    ({ event }: { event: CalendarEvent }) => {
      const config = categoryConfig[event.category]
      const hasSurprise = (event.hiddenFrom?.length ?? 0) > 0
      return (
        <div className="flex items-center gap-1 px-1 overflow-hidden">
          <span className="flex-shrink-0">{config.icon}</span>
          <span className="truncate">{event.title}</span>
          {hasSurprise && <EyeOff className="h-3 w-3 flex-shrink-0 opacity-70" />}
        </div>
      )
    },
    []
  )

  // Handle iCal export
  const handleExport = useCallback(() => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    })

    // Trigger download
    window.location.href = `/api/events/export?${params}`
  }, [date])

  // Custom toolbar
  const CustomToolbar = useCallback(
    () => (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigate(subMonths(date, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {format(date, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button
            onClick={() => handleNavigate(addMonths(date, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleNavigate(new Date())}
            className="ml-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Aujourd&apos;hui
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            {(['month', 'week', 'day'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  view === v
                    ? 'bg-bleu text-white'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Exporter en iCal"
          >
            <Download className="h-4 w-4" />
          </button>

          {canCreateEvent && (
            <button
              onClick={() => {
                setSelectedEvent(null)
                setSelectedSlot(new Date())
                setModalOpen(true)
              }}
              className="btn-primary flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvel événement</span>
            </button>
          )}
        </div>
      </div>
    ),
    [date, view, canCreateEvent, handleNavigate, handleViewChange, handleExport]
  )

  return (
    <div className="calendar-container">
      <CustomToolbar />

      <div className="mb-4">
        <CategoryFilter
          selectedCategories={selectedCategories}
          onChange={setSelectedCategories}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          date={date}
          onView={handleViewChange}
          onNavigate={handleNavigate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable={canCreateEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
            toolbar: () => null, // Use our custom toolbar
          }}
          messages={messages}
          culture="fr"
          style={{ height: 600 }}
          popup
          views={['month', 'week', 'day']}
        />
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedEvent(null)
          setSelectedSlot(null)
        }}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
        event={selectedEvent}
        selectedDate={selectedSlot}
        isAdmin={isAdmin}
        canEdit={canEditEvent}
        userRole={userRole}
        currentUserId={currentUserId}
      />

      <style jsx global>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
        }
        .calendar-container .rbc-header {
          padding: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        .calendar-container .rbc-month-view {
          border: none;
        }
        .calendar-container .rbc-month-row {
          border-color: #e5e7eb;
        }
        .calendar-container .rbc-day-bg {
          border-color: #e5e7eb;
        }
        .calendar-container .rbc-off-range-bg {
          background-color: #f9fafb;
        }
        .calendar-container .rbc-today {
          background-color: #EBF5FF;
        }
        .calendar-container .rbc-date-cell {
          padding: 4px 8px;
          font-size: 0.875rem;
        }
        .calendar-container .rbc-event {
          padding: 2px 4px;
        }
        .calendar-container .rbc-event:focus {
          outline: 2px solid #4A90A4;
          outline-offset: 1px;
        }
        .calendar-container .rbc-show-more {
          color: #4A90A4;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .calendar-container .rbc-time-view {
          border: none;
        }
        .calendar-container .rbc-time-header {
          border-color: #e5e7eb;
        }
        .calendar-container .rbc-time-content {
          border-color: #e5e7eb;
        }
        .calendar-container .rbc-timeslot-group {
          border-color: #e5e7eb;
        }
        .calendar-container .rbc-time-slot {
          border-color: #f3f4f6;
        }
        .calendar-container .rbc-current-time-indicator {
          background-color: #C17767;
        }

        /* Dark mode styles */
        .dark .calendar-container .rbc-header {
          color: #e5e7eb;
          border-bottom-color: #374151;
          background-color: #1f2937;
        }
        .dark .calendar-container .rbc-month-row {
          border-color: #374151;
        }
        .dark .calendar-container .rbc-day-bg {
          border-color: #374151;
        }
        .dark .calendar-container .rbc-off-range-bg {
          background-color: #111827;
        }
        .dark .calendar-container .rbc-today {
          background-color: rgba(74, 144, 164, 0.2);
        }
        .dark .calendar-container .rbc-date-cell {
          color: #e5e7eb;
        }
        .dark .calendar-container .rbc-off-range {
          color: #6b7280;
        }
        .dark .calendar-container .rbc-time-header {
          border-color: #374151;
        }
        .dark .calendar-container .rbc-time-content {
          border-color: #374151;
          background-color: #1f2937;
        }
        .dark .calendar-container .rbc-timeslot-group {
          border-color: #374151;
        }
        .dark .calendar-container .rbc-time-slot {
          border-color: #1f2937;
        }
        .dark .calendar-container .rbc-time-gutter {
          color: #9ca3af;
        }
        .dark .calendar-container .rbc-label {
          color: #9ca3af;
        }
        .dark .calendar-container .rbc-agenda-view table {
          color: #e5e7eb;
        }
        .dark .calendar-container .rbc-agenda-table {
          border-color: #374151;
        }
      `}</style>
    </div>
  )
}
