import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { GET as GET_BY_ID, PUT, DELETE } from '../[id]/route'

// Mock auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock db module
vi.mock('@/lib/db', () => ({
  db: {
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock recurrence module
vi.mock('@/lib/recurrence', () => ({
  expandEvents: vi.fn((events) => events),
}))

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// Helper to create mock requests
function createRequest(
  url: string,
  options: { method?: string; body?: unknown } = {}
): NextRequest {
  const { method = 'GET', body } = options
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  })
}

// Mock user data
const mockAdminUser = {
  id: 'admin-id',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'ADMIN',
}

const mockMemberUser = {
  id: 'member-id',
  email: 'member@test.com',
  name: 'Member User',
  role: 'MEMBER',
}

const mockChildUser = {
  id: 'child-id',
  email: 'child@test.com',
  name: 'Child User',
  role: 'CHILD',
}

const mockEvent = {
  id: 'event-1',
  title: 'Test Event',
  description: 'Test description',
  startDate: new Date('2026-02-15T10:00:00Z'),
  endDate: new Date('2026-02-15T12:00:00Z'),
  allDay: false,
  category: 'REUNION',
  color: '#4A90A4',
  imageUrl: null,
  recurrence: null,
  createdById: 'member-id',
  createdBy: {
    id: 'member-id',
    firstName: 'Member',
    lastName: 'User',
  },
}

describe('Events API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // Authentication Tests
  // ============================================
  describe('Authentication Required', () => {
    it('GET /api/events returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = createRequest('/api/events?start=2026-01-01&end=2026-01-31')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Non authentifié')
    })

    it('POST /api/events returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = createRequest('/api/events', {
        method: 'POST',
        body: { title: 'Test', startDate: '2026-02-15T10:00:00Z' },
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Non authentifié')
    })

    it('GET /api/events/[id] returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = createRequest('/api/events/event-1')
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Non authentifié')
    })

    it('PUT /api/events/[id] returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = createRequest('/api/events/event-1', {
        method: 'PUT',
        body: { title: 'Updated Title' },
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Non authentifié')
    })

    it('DELETE /api/events/[id] returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = createRequest('/api/events/event-1', { method: 'DELETE' })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Non authentifié')
    })
  })

  // ============================================
  // CHILD Cannot Create Events
  // ============================================
  describe('CHILD cannot create events', () => {
    it('POST /api/events returns 403 for CHILD user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockChildUser } as any)

      const request = createRequest('/api/events', {
        method: 'POST',
        body: {
          title: 'Test Event',
          startDate: '2026-02-15T10:00:00Z',
        },
      })
      const response = await POST(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission refusée')
    })

    it('POST /api/events allows MEMBER to create events', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockMemberUser } as any)
      vi.mocked(db.event.create).mockResolvedValue(mockEvent as any)

      const request = createRequest('/api/events', {
        method: 'POST',
        body: {
          title: 'Test Event',
          startDate: '2026-02-15T10:00:00Z',
        },
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(db.event.create).toHaveBeenCalled()
    })

    it('POST /api/events allows ADMIN to create events', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockAdminUser } as any)
      vi.mocked(db.event.create).mockResolvedValue(mockEvent as any)

      const request = createRequest('/api/events', {
        method: 'POST',
        body: {
          title: 'Test Event',
          startDate: '2026-02-15T10:00:00Z',
        },
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(db.event.create).toHaveBeenCalled()
    })
  })

  // ============================================
  // MEMBER Cannot Add Image
  // ============================================
  describe('MEMBER cannot add image', () => {
    it('POST /api/events returns 403 when MEMBER tries to add imageUrl', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockMemberUser } as any)

      const request = createRequest('/api/events', {
        method: 'POST',
        body: {
          title: 'Test Event',
          startDate: '2026-02-15T10:00:00Z',
          imageUrl: 'https://example.com/image.jpg',
        },
      })
      const response = await POST(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Seul un administrateur peut ajouter une image')
    })

    it('PUT /api/events/[id] returns 403 when MEMBER tries to modify imageUrl', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockMemberUser } as any)
      vi.mocked(db.event.findUnique).mockResolvedValue(mockEvent as any)

      const request = createRequest('/api/events/event-1', {
        method: 'PUT',
        body: {
          imageUrl: 'https://example.com/image.jpg',
        },
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe("Seul un administrateur peut modifier l'image")
    })

    it('POST /api/events allows ADMIN to add imageUrl', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockAdminUser } as any)
      vi.mocked(db.event.create).mockResolvedValue({
        ...mockEvent,
        imageUrl: 'https://example.com/image.jpg',
      } as any)

      const request = createRequest('/api/events', {
        method: 'POST',
        body: {
          title: 'Test Event',
          startDate: '2026-02-15T10:00:00Z',
          imageUrl: 'https://example.com/image.jpg',
        },
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(db.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            imageUrl: 'https://example.com/image.jpg',
          }),
        })
      )
    })
  })

  // ============================================
  // Modification by Owner Only
  // ============================================
  describe('Modification by owner only', () => {
    it('PUT /api/events/[id] returns 403 when non-owner tries to modify', async () => {
      const otherMember = { ...mockMemberUser, id: 'other-member-id' }
      vi.mocked(auth).mockResolvedValue({ user: otherMember } as any)
      vi.mocked(db.event.findUnique).mockResolvedValue(mockEvent as any)

      const request = createRequest('/api/events/event-1', {
        method: 'PUT',
        body: { title: 'Updated Title' },
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission refusée')
    })

    it('PUT /api/events/[id] allows owner to modify their event', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockMemberUser } as any)
      vi.mocked(db.event.findUnique).mockResolvedValue(mockEvent as any)
      vi.mocked(db.event.update).mockResolvedValue({
        ...mockEvent,
        title: 'Updated Title',
      } as any)

      const request = createRequest('/api/events/event-1', {
        method: 'PUT',
        body: { title: 'Updated Title' },
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(200)
      expect(db.event.update).toHaveBeenCalled()
    })

    it('DELETE /api/events/[id] returns 403 when non-owner tries to delete', async () => {
      const otherMember = { ...mockMemberUser, id: 'other-member-id' }
      vi.mocked(auth).mockResolvedValue({ user: otherMember } as any)
      vi.mocked(db.event.findUnique).mockResolvedValue(mockEvent as any)

      const request = createRequest('/api/events/event-1', { method: 'DELETE' })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Permission refusée')
    })

    it('DELETE /api/events/[id] allows owner to delete their event', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockMemberUser } as any)
      vi.mocked(db.event.findUnique).mockResolvedValue(mockEvent as any)
      vi.mocked(db.event.delete).mockResolvedValue(mockEvent as any)

      const request = createRequest('/api/events/event-1', { method: 'DELETE' })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(204)
      expect(db.event.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } })
    })
  })

  // ============================================
  // ADMIN Can Modify Everything
  // ============================================
  describe('ADMIN can modify everything', () => {
    it('PUT /api/events/[id] allows ADMIN to modify any event', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockAdminUser } as any)
      vi.mocked(db.event.findUnique).mockResolvedValue(mockEvent as any)
      vi.mocked(db.event.update).mockResolvedValue({
        ...mockEvent,
        title: 'Admin Updated',
      } as any)

      const request = createRequest('/api/events/event-1', {
        method: 'PUT',
        body: { title: 'Admin Updated' },
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(200)
      expect(db.event.update).toHaveBeenCalled()
    })

    it('PUT /api/events/[id] allows ADMIN to modify imageUrl on any event', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockAdminUser } as any)
      vi.mocked(db.event.findUnique).mockResolvedValue(mockEvent as any)
      vi.mocked(db.event.update).mockResolvedValue({
        ...mockEvent,
        imageUrl: 'https://example.com/new-image.jpg',
      } as any)

      const request = createRequest('/api/events/event-1', {
        method: 'PUT',
        body: { imageUrl: 'https://example.com/new-image.jpg' },
      })
      const response = await PUT(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(200)
      expect(db.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            imageUrl: 'https://example.com/new-image.jpg',
          }),
        })
      )
    })

    it('DELETE /api/events/[id] allows ADMIN to delete any event', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockAdminUser } as any)
      vi.mocked(db.event.findUnique).mockResolvedValue(mockEvent as any)
      vi.mocked(db.event.delete).mockResolvedValue(mockEvent as any)

      const request = createRequest('/api/events/event-1', { method: 'DELETE' })
      const response = await DELETE(request, { params: Promise.resolve({ id: 'event-1' }) })

      expect(response.status).toBe(204)
      expect(db.event.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } })
    })
  })

  // ============================================
  // GET Events (list)
  // ============================================
  describe('GET /api/events', () => {
    it('returns events for authenticated user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockMemberUser } as any)
      vi.mocked(db.event.findMany).mockResolvedValue([mockEvent] as any)

      const request = createRequest('/api/events?start=2026-01-01&end=2026-03-31')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.events).toHaveLength(1)
      expect(data.events[0].title).toBe('Test Event')
    })

    it('returns 400 when start/end params are missing', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockMemberUser } as any)

      const request = createRequest('/api/events')
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Les paramètres start et end sont requis')
    })

    it('returns 400 for invalid date format', async () => {
      vi.mocked(auth).mockResolvedValue({ user: mockMemberUser } as any)

      const request = createRequest('/api/events?start=invalid&end=2026-03-31')
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Format de date invalide')
    })
  })

  // ============================================
  // Validation Tests
  // ============================================
  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({ user: mockMemberUser } as any)
    })

    it('POST /api/events returns 400 when title is missing', async () => {
      const request = createRequest('/api/events', {
        method: 'POST',
        body: { startDate: '2026-02-15T10:00:00Z' },
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Le titre est requis')
    })

    it('POST /api/events returns 400 when title exceeds 100 characters', async () => {
      const request = createRequest('/api/events', {
        method: 'POST',
        body: {
          title: 'a'.repeat(101),
          startDate: '2026-02-15T10:00:00Z',
        },
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Le titre ne peut pas dépasser 100 caractères')
    })

    it('POST /api/events returns 400 when startDate is missing', async () => {
      const request = createRequest('/api/events', {
        method: 'POST',
        body: { title: 'Test Event' },
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('La date de début est requise')
    })

    it('POST /api/events returns 400 when endDate is before startDate', async () => {
      const request = createRequest('/api/events', {
        method: 'POST',
        body: {
          title: 'Test Event',
          startDate: '2026-02-15T12:00:00Z',
          endDate: '2026-02-15T10:00:00Z',
        },
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('La date de fin doit être après la date de début')
    })

    it('POST /api/events returns 400 for invalid color format', async () => {
      const request = createRequest('/api/events', {
        method: 'POST',
        body: {
          title: 'Test Event',
          startDate: '2026-02-15T10:00:00Z',
          color: 'red',
        },
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Format de couleur invalide (utilisez #RRGGBB)')
    })
  })
})
