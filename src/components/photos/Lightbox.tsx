'use client'

import { useEffect, useCallback, useState } from 'react'
import Image from 'next/image'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { Photo, PhotoComment, isVideo } from './types'
import { PhotoComments } from './PhotoComments'

interface LightboxProps {
  photos: Photo[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
  albumTitle: string
  isAdmin?: boolean
  onPhotoDeleted?: (photoId: string) => void
}

export function Lightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  albumTitle,
  isAdmin,
  onPhotoDeleted,
}: LightboxProps) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PhotoComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const currentPhoto = photos[currentIndex]

  const goToPrevious = useCallback(() => {
    onNavigate(currentIndex > 0 ? currentIndex - 1 : photos.length - 1)
  }, [currentIndex, photos.length, onNavigate])

  const goToNext = useCallback(() => {
    onNavigate(currentIndex < photos.length - 1 ? currentIndex + 1 : 0)
  }, [currentIndex, photos.length, onNavigate])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, goToPrevious, goToNext])

  // Fetch comments when showing
  useEffect(() => {
    const loadComments = async () => {
      if (!currentPhoto) return
      setLoadingComments(true)
      try {
        const response = await fetch(`/api/photos/${currentPhoto.id}/comments`)
        const data = await response.json()
        if (response.ok) {
          setComments(data.comments)
        }
      } catch (error) {
        console.error('Error fetching comments:', error)
      } finally {
        setLoadingComments(false)
      }
    }

    if (showComments && currentPhoto) {
      loadComments()
    }
  }, [showComments, currentPhoto])

  const handleDownload = () => {
    if (!currentPhoto) return
    const link = document.createElement('a')
    link.href = currentPhoto.url
    const extension = isVideo(currentPhoto.url) ? 'mp4' : 'jpg'
    link.download = `media-${currentPhoto.id}.${extension}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = async () => {
    if (!currentPhoto || !confirm('Supprimer cette photo ?')) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/photos/${currentPhoto.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        onPhotoDeleted?.(currentPhoto.id)
        if (photos.length <= 1) {
          onClose()
        } else if (currentIndex >= photos.length - 1) {
          onNavigate(currentIndex - 1)
        }
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCommentAdded = (comment: PhotoComment) => {
    setComments((prev) => [...prev, comment])
  }

  if (!isOpen || !currentPhoto) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          <h2 className="font-semibold">{albumTitle}</h2>
          <p className="text-sm text-white/70">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComments(!showComments)}
            className={`p-2 rounded-full transition-colors ${
              showComments ? 'bg-white text-black' : 'text-white hover:bg-white/20'
            }`}
            title="Commentaires"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="Télécharger"
          >
            <Download className="h-5 w-5" />
          </button>
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-white hover:bg-red-500/50 rounded-full transition-colors"
              title="Supprimer"
            >
              {isDeleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex h-full">
        {/* Photo container */}
        <div className={`flex-1 relative ${showComments ? 'hidden sm:flex' : 'flex'}`}>
          {/* Navigation buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Photo or Video */}
          <div className="relative flex-1 flex items-center justify-center p-4">
            {isVideo(currentPhoto.url) ? (
              <video
                key={currentPhoto.id}
                src={currentPhoto.url}
                controls
                autoPlay
                className="max-w-full max-h-full"
                style={{ maxHeight: 'calc(100vh - 120px)' }}
              />
            ) : (
              <Image
                src={currentPhoto.url}
                alt={currentPhoto.caption || 'Photo'}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            )}
          </div>

          {/* Caption */}
          {currentPhoto.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <p className="text-white text-center">{currentPhoto.caption}</p>
            </div>
          )}
        </div>

        {/* Comments panel */}
        {showComments && (
          <div className="w-full sm:w-80 bg-white h-full overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Commentaires</h3>
              <button
                onClick={() => setShowComments(false)}
                className="sm:hidden p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PhotoComments
              photoId={currentPhoto.id}
              comments={comments}
              loading={loadingComments}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        )}
      </div>
    </div>
  )
}
