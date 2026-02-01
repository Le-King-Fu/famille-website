'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Plus,
  Upload,
  Trash2,
  Loader2,
  X,
  FolderPlus,
  Image as ImageIcon,
} from 'lucide-react'
import { Album, Photo } from '@/components/photos'

export default function AdminPhotosPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-bleu" /></div>}>
      <AdminPhotosContent />
    </Suspense>
  )
}

function AdminPhotosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedAlbumId = searchParams.get('album')

  const [albums, setAlbums] = useState<Album[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewAlbum, setShowNewAlbum] = useState(false)

  // Album form
  const [albumTitle, setAlbumTitle] = useState('')
  const [albumDescription, setAlbumDescription] = useState('')
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false)

  // Upload
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAlbums = useCallback(async () => {
    try {
      const response = await fetch('/api/albums')
      const data = await response.json()
      if (response.ok) {
        setAlbums(data.albums)
      }
    } catch (error) {
      console.error('Error fetching albums:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAlbumDetails = useCallback(async (albumId: string) => {
    try {
      const response = await fetch(`/api/albums/${albumId}`)
      const data = await response.json()
      if (response.ok) {
        setSelectedAlbum(data.album)
      }
    } catch (error) {
      console.error('Error fetching album:', error)
    }
  }, [])

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  useEffect(() => {
    if (selectedAlbumId) {
      fetchAlbumDetails(selectedAlbumId)
    } else {
      setSelectedAlbum(null)
    }
  }, [selectedAlbumId, fetchAlbumDetails])

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!albumTitle.trim()) return

    setIsCreatingAlbum(true)
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: albumTitle.trim(),
          description: albumDescription.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAlbums((prev) => [data.album, ...prev])
        setAlbumTitle('')
        setAlbumDescription('')
        setShowNewAlbum(false)
        router.push(`/admin/photos?album=${data.album.id}`)
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Error creating album:', error)
    } finally {
      setIsCreatingAlbum(false)
    }
  }

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('Supprimer cet album et toutes ses photos ?')) return

    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAlbums((prev) => prev.filter((a) => a.id !== albumId))
        if (selectedAlbumId === albumId) {
          router.push('/admin/photos')
        }
      }
    } catch (error) {
      console.error('Error deleting album:', error)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedAlbum) return

    setIsUploading(true)
    setUploadProgress([])

    const formData = new FormData()
    formData.append('albumId', selectedAlbum.id)

    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i])
      setUploadProgress((prev) => [...prev, `Préparation: ${files[i].name}`])
    }

    try {
      setUploadProgress(['Upload en cours...'])

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUploadProgress([data.message])
        // Refresh album to show new photos
        await fetchAlbumDetails(selectedAlbum.id)
      } else {
        setUploadProgress([`Erreur: ${data.error}`])
      }
    } catch (error) {
      setUploadProgress(['Erreur lors de l\'upload'])
      console.error('Error uploading:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Supprimer cette photo ?')) return

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSelectedAlbum((prev) =>
          prev
            ? { ...prev, photos: prev.photos?.filter((p) => p.id !== photoId) }
            : null
        )
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-bleu" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Gestion des photos</h1>
        </div>
        <button
          onClick={() => setShowNewAlbum(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          Nouvel album
        </button>
      </div>

      {/* New album form */}
      {showNewAlbum && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Créer un album</h2>
            <button onClick={() => setShowNewAlbum(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreateAlbum} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input
                type="text"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                className="input"
                placeholder="Vacances été 2026"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optionnelle)
              </label>
              <textarea
                value={albumDescription}
                onChange={(e) => setAlbumDescription(e.target.value)}
                className="input"
                placeholder="Nos vacances en famille..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewAlbum(false)}
                className="btn-outline"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isCreatingAlbum}
                className="btn-primary"
              >
                {isCreatingAlbum ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Créer'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Albums list */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
            Albums ({albums.length})
          </h2>
          <div className="space-y-1">
            {albums.map((album) => (
              <div
                key={album.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedAlbumId === album.id
                    ? 'bg-bleu/10 text-bleu'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => router.push(`/admin/photos?album=${album.id}`)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-sm">{album.title}</span>
                  <span className="text-xs text-gray-400">
                    ({album._count?.photos || 0})
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteAlbum(album.id)
                  }}
                  className="p-1 hover:bg-red-100 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {albums.length === 0 && (
              <p className="text-sm text-gray-500 p-2">Aucun album</p>
            )}
          </div>
        </div>

        {/* Album content */}
        <div className="lg:col-span-3">
          {selectedAlbum ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedAlbum.title}</h2>
                  {selectedAlbum.description && (
                    <p className="text-sm text-gray-500">
                      {selectedAlbum.description}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`btn-primary inline-flex items-center gap-2 cursor-pointer ${
                      isUploading ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Ajouter des photos
                  </label>
                </div>
              </div>

              {/* Upload progress */}
              {uploadProgress.length > 0 && (
                <div className="p-3 bg-bleu/10 rounded-lg text-sm">
                  {uploadProgress.map((msg, i) => (
                    <p key={i}>{msg}</p>
                  ))}
                </div>
              )}

              {/* Photos grid */}
              {selectedAlbum.photos && selectedAlbum.photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {selectedAlbum.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square group rounded-lg overflow-hidden bg-gray-100"
                    >
                      <Image
                        src={photo.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="150px"
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune photo dans cet album</p>
                  <p className="text-sm">
                    Cliquez sur &quot;Ajouter des photos&quot; pour commencer
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Sélectionnez un album pour gérer ses photos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
