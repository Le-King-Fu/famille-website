'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface FormattedEventDateProps {
  startDate: string
  endDate: string | null
  allDay: boolean
}

export function FormattedEventDate({ startDate, endDate, allDay }: FormattedEventDateProps) {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null

  if (allDay) {
    if (end && end.toDateString() !== start.toDateString()) {
      return <>{format(start, 'EEEE d MMMM yyyy', { locale: fr })} - {format(end, 'EEEE d MMMM yyyy', { locale: fr })}</>
    }
    return <>{format(start, 'EEEE d MMMM yyyy', { locale: fr })}</>
  }

  if (end && end.toDateString() !== start.toDateString()) {
    return <>{format(start, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })} - {format(end, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}</>
  }

  if (end) {
    return <>{format(start, 'EEEE d MMMM yyyy', { locale: fr })} de {format(start, 'HH:mm')} à {format(end, 'HH:mm')}</>
  }

  return <>{format(start, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}</>
}
