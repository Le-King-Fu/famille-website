'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MessageSquare, Play } from 'lucide-react'
import { Photo, isVideo } from './types'
import { Lightbox } from './Lightbox'

interface PhotoGridProps {
  photos: Photo[]
  albumTitle: string
  onPhotoDeleted?: (photoId: string) => void
  isAdmin?: boolean
}

export function PhotoGrid({ photos, albumTitle, onPhotoDeleted, isAdmin }: PhotoGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucune photo dans cet album.
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg bg-gray-100"
            onClick={() => openLightbox(index)}
          >
            {isVideo(photo.url) ? (
              <>
                <video
                  src={photo.url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
                {/* Play icon overlay for videos */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-black/80 transition-colors">
                    <Play className="h-6 w-6 text-white ml-1" fill="white" />
                  </div>
                </div>
              </>
            ) : (
              <Image
                src={photo.thumbnailUrl}
                alt={photo.caption || `Photo ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            )}

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />

            {/* Comment count badge */}
            {photo._count && photo._count.comments > 0 && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                <MessageSquare className="h-3 w-3" />
                {photo._count.comments}
              </div>
            )}

            {/* Caption preview */}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs line-clamp-2">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Lightbox
        photos={photos}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setCurrentIndex}
        albumTitle={albumTitle}
        isAdmin={isAdmin}
        onPhotoDeleted={onPhotoDeleted}
      />
    </>
  )
}
