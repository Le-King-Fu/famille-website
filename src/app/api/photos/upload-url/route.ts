import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// POST /api/photos/upload-url - Get signed URL for direct upload to Supabase
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json(
      { error: 'Le stockage de fichiers n\'est pas configuré' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { albumId, filename, contentType } = body

    if (!albumId || !filename || !contentType) {
      return NextResponse.json(
        { error: 'albumId, filename et contentType sont requis' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = filename.split('.').pop()?.toLowerCase() || 'bin'
    const storagePath = `${albumId}/${timestamp}-${randomStr}.${ext}`

    // Create signed upload URL (valid for 5 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from('photos')
      .createSignedUploadUrl(storagePath)

    if (error) {
      console.error('Error creating signed URL:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'URL de téléchargement' },
        { status: 500 }
      )
    }

    // Get public URL for the file
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('photos')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
      publicUrl: publicUrlData.publicUrl,
    })
  } catch (error) {
    console.error('Error creating upload URL:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'URL' },
      { status: 500 }
    )
  }
}
