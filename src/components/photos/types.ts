export interface Album {
  id: string
  title: string
  description: string | null
  coverPhotoId: string | null
  createdAt: string
  updatedAt: string
  createdById: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
  photos?: Photo[]
  _count?: {
    photos: number
  }
  coverUrl?: string | null
}

export interface Photo {
  id: string
  url: string
  thumbnailUrl: string
  caption: string | null
  takenAt: string | null
  createdAt: string
  albumId: string
  uploadedById: string
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
  }
  _count?: {
    comments: number
  }
  comments?: PhotoComment[]
}

export interface PhotoComment {
  id: string
  content: string
  createdAt: string
  photoId: string
  authorId: string
  author: {
    id: string
    firstName: string
    lastName: string
  }
}
