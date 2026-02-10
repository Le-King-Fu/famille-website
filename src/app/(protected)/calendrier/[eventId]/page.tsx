import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Download,
  Edit,
  Trash2,
  MessageSquare,
  RefreshCw,
  User,
  EyeOff,
} from 'lucide-react'
import { categoryConfig } from '@/components/calendar/types'
import { describeRecurrence, RecurrenceRule } from '@/lib/recurrence'
import { EventDetailClient } from './EventDetailClient'

interface PageProps {
  params: Promise<{ eventId: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
  const session = await auth()
  const { eventId } = await params

  if (!session?.user) {
    return null
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      topic: {
        select: {
          id: true,
          title: true,
          categoryId: true,
        },
      },
      rsvps: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      hiddenFrom: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  if (!event) {
    notFound()
  }

  const config = categoryConfig[event.category]
  const isAdmin = session.user.role === 'ADMIN'
  const isCreator = event.createdById === session.user.id

  // If user is hidden from this event (and not admin), show 404
  const isHiddenFromUser = event.hiddenFrom.some((h) => h.userId === session.user.id)
  if (isHiddenFromUser && !isAdmin) {
    notFound()
  }
  const canEdit = isAdmin || isCreator
  const canRsvp = session.user.role !== 'CHILD'

  // Format dates
  const startDate = new Date(event.startDate)
  const endDate = event.endDate ? new Date(event.endDate) : null

  const formatEventDate = () => {
    if (event.allDay) {
      if (endDate && endDate.toDateString() !== startDate.toDateString()) {
        return `${format(startDate, 'EEEE d MMMM yyyy', { locale: fr })} - ${format(endDate, 'EEEE d MMMM yyyy', { locale: fr })}`
      }
      return format(startDate, 'EEEE d MMMM yyyy', { locale: fr })
    }

    if (endDate && endDate.toDateString() !== startDate.toDateString()) {
      return `${format(startDate, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })} - ${format(endDate, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}`
    }

    if (endDate) {
      return `${format(startDate, 'EEEE d MMMM yyyy', { locale: fr })} de ${format(startDate, 'HH:mm')} à ${format(endDate, 'HH:mm')}`
    }

    return format(startDate, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/calendrier"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au calendrier
      </Link>

      {/* Event card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Header image or category icon */}
        {event.imageUrl ? (
          <div className="relative h-48 sm:h-64">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-4">
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: config.color }}
              >
                {config.icon} {config.label}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="h-32 flex items-center justify-center"
            style={{ backgroundColor: `${config.color}15` }}
          >
            <div className="text-center">
              <span className="text-5xl">{config.icon}</span>
              <div className="mt-2">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: config.color }}
                >
                  {config.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {event.title}
          </h1>

          {/* Surprise event indicator (creator/admin only) */}
          {event.hiddenFrom.length > 0 && (isAdmin || isCreator) && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <EyeOff className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Événement surprise
                  {isHiddenFromUser && (
                    <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
                      (vous êtes dans la liste)
                    </span>
                  )}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Caché de : {event.hiddenFrom.map((h) => `${h.user.firstName} ${h.user.lastName}`).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="space-y-3">
            {/* Date & time */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-900 dark:text-white capitalize">
                  {formatEventDate()}
                </p>
                {event.allDay && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Journée entière
                  </p>
                )}
              </div>
            </div>

            {/* Recurrence */}
            {event.recurrence && (
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <p className="text-gray-700 dark:text-gray-300">
                  {describeRecurrence(event.recurrence as unknown as RecurrenceRule)}
                </p>
              </div>
            )}

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                <p className="text-gray-700 dark:text-gray-300">{event.location}</p>
              </div>
            )}

            {/* Creator */}
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <p className="text-gray-700 dark:text-gray-300">
                Créé par {event.createdBy.firstName} {event.createdBy.lastName}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="pt-4 border-t dark:border-gray-700">
              <h2 className="font-medium text-gray-900 dark:text-white mb-2">Description</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Forum topic link */}
          {event.topic && (
            <div className="pt-4 border-t dark:border-gray-700">
              <Link
                href={`/forum/${event.topic.categoryId}/${event.topic.id}`}
                className="inline-flex items-center gap-2 text-bleu hover:text-bleu/80 transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                Voir la discussion: {event.topic.title}
              </Link>
            </div>
          )}

          {/* RSVP Section - Client component */}
          <div className="pt-4 border-t dark:border-gray-700">
            <EventDetailClient
              eventId={event.id}
              initialRsvps={event.rsvps}
              currentUserId={session.user.id}
              canRsvp={canRsvp}
              canEdit={canEdit}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t dark:border-gray-700">
            {/* Export button */}
            <a
              href={`/api/events/${event.id}/export`}
              download
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exporter
            </a>

            {/* Edit button */}
            {canEdit && (
              <Link
                href={`/calendrier?edit=${event.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-bleu text-white rounded-lg hover:bg-bleu/90 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
