import { RRule, Frequency } from 'rrule'

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval?: number
  until?: string
  count?: number
  byDay?: string[]
  byMonth?: number[]
  byMonthDay?: number[]
}

const frequencyMap: Record<string, Frequency> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
}

const dayMap: Record<string, number> = {
  MO: RRule.MO.weekday,
  TU: RRule.TU.weekday,
  WE: RRule.WE.weekday,
  TH: RRule.TH.weekday,
  FR: RRule.FR.weekday,
  SA: RRule.SA.weekday,
  SU: RRule.SU.weekday,
}

/**
 * Convert our RecurrenceRule to an RRule instance
 */
export function createRRule(startDate: Date, rule: RecurrenceRule): RRule {
  const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
    freq: frequencyMap[rule.frequency],
    interval: rule.interval || 1,
    dtstart: startDate,
  }

  if (rule.until) {
    options.until = new Date(rule.until)
  }

  if (rule.count) {
    options.count = rule.count
  }

  if (rule.byDay && rule.byDay.length > 0) {
    options.byweekday = rule.byDay.map((day) => dayMap[day])
  }

  if (rule.byMonth && rule.byMonth.length > 0) {
    options.bymonth = rule.byMonth
  }

  if (rule.byMonthDay && rule.byMonthDay.length > 0) {
    options.bymonthday = rule.byMonthDay
  }

  return new RRule(options)
}

/**
 * Expand recurring event into individual occurrences within a date range
 */
export function expandRecurringEvent<T extends {
  startDate: Date
  endDate?: Date | null
  recurrence?: RecurrenceRule | null
}>(
  event: T,
  rangeStart: Date,
  rangeEnd: Date
): Array<T & { originalDate: Date; isRecurring: boolean }> {
  if (!event.recurrence) {
    // Non-recurring event - return as-is if within range
    if (event.startDate >= rangeStart && event.startDate <= rangeEnd) {
      return [{ ...event, originalDate: event.startDate, isRecurring: false }]
    }
    return []
  }

  const rrule = createRRule(event.startDate, event.recurrence as RecurrenceRule)
  const occurrences = rrule.between(rangeStart, rangeEnd, true)

  // Calculate duration of original event
  const duration = event.endDate
    ? event.endDate.getTime() - event.startDate.getTime()
    : 0

  return occurrences.map((occurrence) => ({
    ...event,
    startDate: occurrence,
    endDate: duration ? new Date(occurrence.getTime() + duration) : null,
    originalDate: event.startDate,
    isRecurring: true,
  }))
}

/**
 * Expand multiple events, handling both recurring and non-recurring
 */
export function expandEvents<T extends {
  startDate: Date
  endDate?: Date | null
  recurrence?: RecurrenceRule | null
}>(
  events: T[],
  rangeStart: Date,
  rangeEnd: Date
): Array<T & { originalDate: Date; isRecurring: boolean }> {
  return events.flatMap((event) => expandRecurringEvent(event, rangeStart, rangeEnd))
}

/**
 * Human-readable description of recurrence rule
 */
export function describeRecurrence(rule: RecurrenceRule | null | undefined): string {
  if (!rule) return 'Ne se répète pas'

  const interval = rule.interval || 1

  switch (rule.frequency) {
    case 'DAILY':
      return interval === 1 ? 'Chaque jour' : `Tous les ${interval} jours`
    case 'WEEKLY':
      return interval === 1 ? 'Chaque semaine' : `Toutes les ${interval} semaines`
    case 'MONTHLY':
      return interval === 1 ? 'Chaque mois' : `Tous les ${interval} mois`
    case 'YEARLY':
      return interval === 1 ? 'Chaque année' : `Tous les ${interval} ans`
    default:
      return 'Récurrence personnalisée'
  }
}

/**
 * Predefined recurrence options for the UI
 */
export const recurrenceOptions = [
  { value: null, label: 'Ne se répète pas' },
  { value: { frequency: 'DAILY', interval: 1 } as RecurrenceRule, label: 'Chaque jour' },
  { value: { frequency: 'WEEKLY', interval: 1 } as RecurrenceRule, label: 'Chaque semaine' },
  { value: { frequency: 'MONTHLY', interval: 1 } as RecurrenceRule, label: 'Chaque mois' },
  { value: { frequency: 'YEARLY', interval: 1 } as RecurrenceRule, label: 'Chaque année' },
]
