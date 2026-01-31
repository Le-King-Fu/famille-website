'use client'

import { useState } from 'react'
import { EventCategory } from '@prisma/client'
import { categoryConfig } from './types'
import { Camera, X } from 'lucide-react'
import Image from 'next/image'

interface EventImageProps {
  imageUrl?: string | null
  category: EventCategory
  canEdit: boolean
  onImageChange?: (url: string | null) => void
  size?: 'small' | 'medium' | 'large'
}

export function EventImage({
  imageUrl,
  category,
  canEdit,
  onImageChange,
  size = 'medium',
}: EventImageProps) {
  const [isUploading, setIsUploading] = useState(false)
  const config = categoryConfig[category]

  const sizeClasses = {
    small: 'h-12 w-12',
    medium: 'h-32 w-full',
    large: 'h-48 w-full',
  }

  const iconSizes = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onImageChange) return

    // For now, we'll just show a placeholder
    // In production, this would upload to Supabase Storage
    setIsUploading(true)

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Create a local URL for preview (in production, use Supabase)
    const localUrl = URL.createObjectURL(file)
    onImageChange(localUrl)
    setIsUploading(false)
  }

  if (imageUrl) {
    return (
      <div className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden bg-gray-100`}>
        <Image
          src={imageUrl}
          alt="Image de l'événement"
          fill
          className="object-cover"
        />
        {canEdit && onImageChange && (
          <button
            type="button"
            onClick={() => onImageChange(null)}
            className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative ${sizeClasses[size]} rounded-lg flex flex-col items-center justify-center`}
      style={{ backgroundColor: `${config.color}15` }}
    >
      <span className={`${iconSizes[size]} flex items-center justify-center text-3xl`}>
        {config.icon}
      </span>

      {canEdit && onImageChange && (
        <label className="mt-2 cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white rounded-full hover:bg-gray-50 transition-colors border border-gray-200">
            <Camera className="h-3 w-3" />
            {isUploading ? 'Envoi...' : 'Ajouter une image'}
          </span>
        </label>
      )}
    </div>
  )
}
