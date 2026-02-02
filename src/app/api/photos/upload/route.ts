import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// POST /api/photos/upload - Upload photo(s) to an album (admin only)
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  // Check Supabase configuration
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    console.error('Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
    return NextResponse.json(
      { error: 'Le stockage de fichiers n\'est pas configuré. Contactez l\'administrateur.' },
      { status: 503 }
    )
  }

  try {
    const formData = await request.formData()
    const albumId = formData.get('albumId') as string
    const files = formData.getAll('photos') as File[]

    if (!albumId) {
      return NextResponse.json(
        { error: "L'album est requis" },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Aucune photo sélectionnée' },
        { status: 400 }
      )
    }

    // Verify album exists
    const album = await db.album.findUnique({
      where: { id: albumId },
    })

    if (!album) {
      return NextResponse.json({ error: 'Album non trouvé' }, { status: 404 })
    }

    const uploadedPhotos = []
    const errors = []

    for (const file of files) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Type de fichier non supporté`)
        continue
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: Fichier trop volumineux (max 10MB)`)
        continue
      }

      try {
        // Generate unique filename
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const filename = `${albumId}/${timestamp}-${randomStr}.${ext}`
        const thumbFilename = `${albumId}/${timestamp}-${randomStr}_thumb.${ext}`

        // Upload original photo
        const { error: uploadError } = await supabaseAdmin.storage
          .from('photos')
          .upload(filename, file, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          console.error(`Supabase upload error for ${file.name}:`, uploadError)
          errors.push(`${file.name}: Erreur upload - ${uploadError.message}`)
          continue
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('photos')
          .getPublicUrl(filename)

        // For thumbnail, we'll use the same image for now
        // Client-side compression should handle creating smaller versions
        const { data: thumbUrlData } = supabaseAdmin.storage
          .from('photos')
          .getPublicUrl(filename)

        // Create photo record in database
        const photo = await db.photo.create({
          data: {
            url: urlData.publicUrl,
            thumbnailUrl: thumbUrlData.publicUrl,
            albumId,
            uploadedById: session.user.id,
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        })

        uploadedPhotos.push(photo)
      } catch (err) {
        errors.push(`${file.name}: Erreur inattendue`)
        console.error(`Error uploading ${file.name}:`, err)
      }
    }

    return NextResponse.json({
      photos: uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedPhotos.length} photo(s) uploadée(s)${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading photos:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'upload des photos" },
      { status: 500 }
    )
  }
}
