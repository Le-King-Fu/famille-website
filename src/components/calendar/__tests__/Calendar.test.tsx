import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Calendar } from '../Calendar'
import { CalendarEvent } from '../types'

// Create a mock event for today's month
const today = new Date()
const eventDate = new Date(today.getFullYear(), today.getMonth(), 15, 10, 0, 0)
const eventEndDate = new Date(today.getFullYear(), today.getMonth(), 15, 12, 0, 0)

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Test Event',
    description: 'Test description',
    startDate: eventDate,
    endDate: eventEndDate,
    allDay: false,
    category: 'REUNION',
    color: '#4A90A4',
    imageUrl: null,
    recurrence: null,
    location: null,
    topicId: null,
    createdById: 'user1',
    createdBy: {
      id: 'user1',
      firstName: 'Marie',
      lastName: 'Landry',
    },
  },
]

// Mock handlers
const mockHandlers = {
  onEventCreate: vi.fn(),
  onEventUpdate: vi.fn(),
  onEventDelete: vi.fn(),
  onRangeChange: vi.fn(),
}

describe('Calendar', () => {
  it('renders the calendar component', () => {
    render(
      <Calendar
        events={[]}
        onEventCreate={mockHandlers.onEventCreate}
        onEventUpdate={mockHandlers.onEventUpdate}
        onEventDelete={mockHandlers.onEventDelete}
        onRangeChange={mockHandlers.onRangeChange}
        isAdmin={false}
        canCreateEvent={true}
        currentUserId="user1"
      />
    )

    // Check for today button (French)
    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument()
  })

  it('renders events on the calendar', () => {
    render(
      <Calendar
        events={mockEvents}
        onEventCreate={mockHandlers.onEventCreate}
        onEventUpdate={mockHandlers.onEventUpdate}
        onEventDelete={mockHandlers.onEventDelete}
        onRangeChange={mockHandlers.onRangeChange}
        isAdmin={false}
        canCreateEvent={true}
        currentUserId="user1"
      />
    )

    expect(screen.getByText('Test Event')).toBeInTheDocument()
  })

  it('shows "Nouvel événement" button when user can create events', () => {
    render(
      <Calendar
        events={[]}
        onEventCreate={mockHandlers.onEventCreate}
        onEventUpdate={mockHandlers.onEventUpdate}
        onEventDelete={mockHandlers.onEventDelete}
        onRangeChange={mockHandlers.onRangeChange}
        isAdmin={false}
        canCreateEvent={true}
        currentUserId="user1"
      />
    )

    expect(screen.getByText('Nouvel événement')).toBeInTheDocument()
  })

  it('hides "Nouvel événement" button when user cannot create events', () => {
    render(
      <Calendar
        events={[]}
        onEventCreate={mockHandlers.onEventCreate}
        onEventUpdate={mockHandlers.onEventUpdate}
        onEventDelete={mockHandlers.onEventDelete}
        onRangeChange={mockHandlers.onRangeChange}
        isAdmin={false}
        canCreateEvent={false}
        currentUserId="user1"
      />
    )

    expect(screen.queryByText('Nouvel événement')).not.toBeInTheDocument()
  })

  it('displays view toggle buttons', () => {
    render(
      <Calendar
        events={[]}
        onEventCreate={mockHandlers.onEventCreate}
        onEventUpdate={mockHandlers.onEventUpdate}
        onEventDelete={mockHandlers.onEventDelete}
        onRangeChange={mockHandlers.onRangeChange}
        isAdmin={false}
        canCreateEvent={true}
        currentUserId="user1"
      />
    )

    expect(screen.getByText('Mois')).toBeInTheDocument()
    expect(screen.getByText('Semaine')).toBeInTheDocument()
    expect(screen.getByText('Jour')).toBeInTheDocument()
  })
})
