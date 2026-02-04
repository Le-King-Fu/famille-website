'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, MapPin, ExternalLink, MessageSquare } from 'lucide-react'
import { EventCategory, UserRole } from '@prisma/client'
import { RecurrenceRule } from '@/lib/recurrence'
import { CalendarEvent, EventFormData, defaultEventFormData, categoryConfig } from './types'
import { CategorySelect } from './CategorySelect'
import { RecurrenceSelect } from './RecurrenceSelect'
import { EventImage } from './EventImage'
import { format } from 'date-fns'
import Link from 'next/link'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<CalendarEvent> & { createForumTopic?: boolean }) => Promise<void>
  onDelete?: () => Promise<void>
  event?: CalendarEvent | null
  selectedDate?: Date | null
  isAdmin: boolean
  canEdit: boolean
  userRole?: UserRole
}

export function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  selectedDate,
  isAdmin,
  canEdit,
  userRole,
}: EventModalProps) {
  const [formData, setFormData] = useState<EventFormData>(defaultEventFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!event

  useEffect(() => {
    if (event) {
      // Populate form with existing event data
      const startDate = new Date(event.startDate)
      const endDate = event.endDate ? new Date(event.endDate) : null

      setFormData({
        title: event.title,
        description: event.description || '',
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : '',
        startTime: event.allDay ? '09:00' : format(startDate, 'HH:mm'),
        endTime: event.allDay
          ? '10:00'
          : endDate
            ? format(endDate, 'HH:mm')
            : format(new Date(startDate.getTime() + 60 * 60 * 1000), 'HH:mm'),
        allDay: event.allDay,
        category: event.category,
        color: event.color || '',
        imageUrl: event.imageUrl || '',
        recurrence: event.recurrence,
        location: event.location || '',
        createForumTopic: false,
      })
    } else if (selectedDate) {
      // New event with selected date
      setFormData({
        ...defaultEventFormData,
        startDate: format(selectedDate, 'yyyy-MM-dd'),
        endDate: format(selectedDate, 'yyyy-MM-dd'),
      })
    } else {
      setFormData(defaultEventFormData)
    }
    setError('')
  }, [event, selectedDate, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Build start/end dates
      let startDate: Date
      let endDate: Date | null = null

      if (formData.allDay) {
        startDate = new Date(formData.startDate + 'T00:00:00')
        if (formData.endDate) {
          endDate = new Date(formData.endDate + 'T23:59:59')
        }
      } else {
        startDate = new Date(formData.startDate + 'T' + formData.startTime)
        if (formData.endDate && formData.endTime) {
          endDate = new Date(formData.endDate + 'T' + formData.endTime)
        }
      }

      const eventData: Partial<CalendarEvent> & { createForumTopic?: boolean } = {
        title: formData.title,
        description: formData.description || null,
        startDate,
        endDate,
        allDay: formData.allDay,
        category: formData.category,
        color: formData.color || null,
        recurrence: formData.recurrence,
        location: formData.location || null,
      }

      // Only include imageUrl if admin
      if (isAdmin) {
        eventData.imageUrl = formData.imageUrl || null
      }

      // Include createForumTopic only for new events (not editing)
      if (!isEditing && formData.createForumTopic) {
        eventData.createForumTopic = true
      }

      await onSave(eventData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold dark:text-white">
              {isEditing ? 'Modifier l\'événement' : 'Nouvel événement'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 dark:text-gray-300" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Image */}
            <EventImage
              imageUrl={formData.imageUrl || null}
              category={formData.category}
              canEdit={isAdmin && canEdit}
              onImageChange={(url) =>
                setFormData((prev) => ({ ...prev, imageUrl: url || '' }))
              }
              size="large"
            />

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="input"
                placeholder="Anniversaire de Mamie"
                required
                maxLength={100}
                disabled={!canEdit}
              />
            </div>

            {/* Category */}
            <CategorySelect
              value={formData.category}
              onChange={(category) =>
                setFormData((prev) => ({ ...prev, category }))
              }
            />

            {/* All day toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, allDay: e.target.checked }))
                }
                className="rounded border-gray-300 text-bleu focus:ring-bleu"
                disabled={!canEdit}
              />
              <label htmlFor="allDay" className="text-sm text-gray-700 dark:text-gray-300">
                Journée entière
              </label>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                      endDate: prev.endDate || e.target.value,
                    }))
                  }
                  className="input"
                  required
                  disabled={!canEdit}
                />
              </div>
              {!formData.allDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Heure début
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="input"
                    disabled={!canEdit}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="input"
                  min={formData.startDate}
                  disabled={!canEdit}
                />
              </div>
              {!formData.allDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Heure fin
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    className="input"
                    disabled={!canEdit}
                  />
                </div>
              )}
            </div>

            {/* Recurrence */}
            <RecurrenceSelect
              value={formData.recurrence}
              onChange={(recurrence) =>
                setFormData((prev) => ({ ...prev, recurrence }))
              }
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="input min-h-[80px]"
                placeholder="Détails supplémentaires..."
                maxLength={500}
                disabled={!canEdit}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <MapPin className="h-4 w-4 inline mr-1" />
                Lieu
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                className="input"
                placeholder="Adresse ou nom du lieu"
                maxLength={200}
                disabled={!canEdit}
              />
            </div>

            {/* Create forum topic - only for new events and non-CHILD users */}
            {!isEditing && userRole && userRole !== 'CHILD' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createForumTopic"
                  checked={formData.createForumTopic}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, createForumTopic: e.target.checked }))
                  }
                  className="rounded border-gray-300 text-bleu focus:ring-bleu"
                  disabled={!canEdit}
                />
                <label htmlFor="createForumTopic" className="text-sm text-gray-700 dark:text-gray-300">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Créer une discussion dans le forum
                </label>
              </div>
            )}

            {/* Link to event detail page (when editing) */}
            {isEditing && event && (
              <Link
                href={`/calendrier/${event.id}`}
                className="flex items-center gap-2 text-sm text-bleu hover:text-bleu/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Voir les détails de l&apos;événement
              </Link>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
              <div>
                {isEditing && canEdit && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-outline"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                {canEdit && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : isEditing ? (
                      'Modifier'
                    ) : (
                      'Créer'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
