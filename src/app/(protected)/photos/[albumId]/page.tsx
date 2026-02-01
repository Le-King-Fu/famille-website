'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react'
import { PhotoGrid, Album } from '@/components/photos'

export default function AlbumPage() {
  const params = useParams()
  const { data: session } = useSession()
  const albumId = params.albumId as string

  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'

  const fetchAlbum = useCallback(async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setAlbum(data.album)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [albumId])

  useEffect(() => {
    fetchAlbum()
  }, [fetchAlbum])

  const handlePhotoDeleted = (photoId: string) => {
    setAlbum((prev) =>
      prev
        ? {
            ...prev,
            photos: prev.photos?.filter((p) => p.id !== photoId),
          }
        : null
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-bleu" />
      </div>
    )
  }

  if (error || !album) {
    return (
      <div className="space-y-4">
        <Link
          href="/photos"
          className="inline-flex items-center gap-1 text-gray-600 hover:text-bleu transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux albums
        </Link>
        <div className="card bg-red-50 border-red-200 text-red-700">
          <p>Erreur: {error || 'Album non trouvé'}</p>
          <button onClick={fetchAlbum} className="mt-2 text-sm underline">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/photos"
          className="inline-flex items-center gap-1 text-gray-600 hover:text-bleu transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux albums
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-bleu" />
              {album.title}
            </h1>
            {album.description && (
              <p className="text-gray-500 mt-1">{album.description}</p>
            )}
            <p className="text-sm text-gray-400 mt-2">
              {album.photos?.length || 0} photo{(album.photos?.length || 0) > 1 ? 's' : ''} •
              par {album.createdBy.firstName} {album.createdBy.lastName}
            </p>
          </div>

          {isAdmin && (
            <Link
              href={`/admin/photos?album=${albumId}`}
              className="btn-primary text-sm"
            >
              Gérer
            </Link>
          )}
        </div>
      </div>

      {/* Photo grid */}
      <PhotoGrid
        photos={album.photos || []}
        albumTitle={album.title}
        isAdmin={isAdmin}
        onPhotoDeleted={handlePhotoDeleted}
      />
    </div>
  )
}
