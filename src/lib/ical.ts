import { format } from 'date-fns'
import { EventCategory } from '@prisma/client'

// Category to French label mapping
export const categoryLabels: Record<EventCategory, string> = {
  BIRTHDAY: 'Anniversaire',
  REUNION: 'Réunion',
  VACATION: 'Vacances',
  HOLIDAY: 'Fête',
  OTHER: 'Autre',
}

// Format date for iCal (YYYYMMDD or YYYYMMDDTHHmmssZ)
export function formatICalDate(date: Date, allDay: boolean): string {
  if (allDay) {
    return format(date, 'yyyyMMdd')
  }
  // Convert to UTC
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Escape special characters in iCal text
export function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// Fold long lines (iCal spec requires lines < 75 chars)
export function foldLine(line: string): string {
  const maxLength = 75
  if (line.length <= maxLength) return line

  const result: string[] = []
  let remaining = line

  while (remaining.length > maxLength) {
    result.push(remaining.slice(0, maxLength))
    remaining = ' ' + remaining.slice(maxLength) // Continuation lines start with space
  }
  result.push(remaining)

  return result.join('\r\n')
}

// Event data for iCal generation
export interface ICalEvent {
  id: string
  title: string
  description: string | null
  startDate: Date
  endDate: Date | null
  allDay: boolean
  category: EventCategory
  location: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: {
    firstName: string
    lastName: string
  }
}

// Generate iCal content for a single event (VEVENT block only, without calendar wrapper)
export function generateEventVEvent(event: ICalEvent): string[] {
  const lines: string[] = []
  const uid = `${event.id}@famille-website`
  const created = formatICalDate(event.createdAt, false)
  const modified = formatICalDate(event.updatedAt, false)

  lines.push('BEGIN:VEVENT')
  lines.push(foldLine(`UID:${uid}`))
  lines.push(foldLine(`DTSTAMP:${created}`))
  lines.push(foldLine(`CREATED:${created}`))
  lines.push(foldLine(`LAST-MODIFIED:${modified}`))

  // Date handling
  if (event.allDay) {
    lines.push(foldLine(`DTSTART;VALUE=DATE:${formatICalDate(event.startDate, true)}`))
    if (event.endDate) {
      // iCal all-day events: end date is exclusive, so add one day
      const endDate = new Date(event.endDate)
      endDate.setDate(endDate.getDate() + 1)
      lines.push(foldLine(`DTEND;VALUE=DATE:${formatICalDate(endDate, true)}`))
    }
  } else {
    lines.push(foldLine(`DTSTART:${formatICalDate(event.startDate, false)}`))
    if (event.endDate) {
      lines.push(foldLine(`DTEND:${formatICalDate(event.endDate, false)}`))
    }
  }

  lines.push(foldLine(`SUMMARY:${escapeICalText(event.title)}`))

  if (event.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeICalText(event.description)}`))
  }

  if (event.location) {
    lines.push(foldLine(`LOCATION:${escapeICalText(event.location)}`))
  }

  // Add category
  lines.push(foldLine(`CATEGORIES:${categoryLabels[event.category]}`))

  // Add organizer info
  const organizer = `${event.createdBy.firstName} ${event.createdBy.lastName}`
  lines.push(foldLine(`ORGANIZER;CN=${escapeICalText(organizer)}:mailto:noreply@famille-website.local`))

  lines.push('END:VEVENT')

  return lines
}

// Generate complete iCal content for a single event
export function generateEventICalContent(event: ICalEvent): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Famille Website//Calendrier Familial//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Calendrier Familial',
    'X-WR-TIMEZONE:Europe/Paris',
    ...generateEventVEvent(event),
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

// Generate iCal header
export function generateICalHeader(): string[] {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Famille Website//Calendrier Familial//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Calendrier Familial',
    'X-WR-TIMEZONE:Europe/Paris',
  ]
}

// Generate iCal footer
export function generateICalFooter(): string[] {
  return ['END:VCALENDAR']
}
