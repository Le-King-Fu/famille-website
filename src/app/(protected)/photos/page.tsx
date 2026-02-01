export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import { Image as ImageIcon, FolderOpen } from 'lucide-react'

export default async function PhotosPage() {
  const albums = await db.album.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { firstName: true },
      },
      _count: {
        select: { photos: true },
      },
      photos: {
        take: 1,
        orderBy: { createdAt: 'asc' },
        select: { thumbnailUrl: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ImageIcon className="h-6 w-6 text-bleu" />
        Albums photos
      </h1>

      {albums.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => {
            const coverUrl = album.photos[0]?.thumbnailUrl
            return (
              <Link
                key={album.id}
                href={`/photos/${album.id}`}
                className="card hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={album.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <FolderOpen className="h-12 w-12 text-gray-300" />
                  )}
                </div>
                <h2 className="font-semibold group-hover:text-bleu transition-colors">
                  {album.title}
                </h2>
                {album.description && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {album.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                  <span>{album._count.photos} photos</span>
                  <span>par {album.createdBy.firstName}</span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun album pour le moment.</p>
        </div>
      )}
    </div>
  )
}
