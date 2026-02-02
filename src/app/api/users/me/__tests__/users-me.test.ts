import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT } from '../route'

// Mock auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock db module
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
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
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Jean',
  lastName: 'Dupont',
  role: 'MEMBER',
  createdAt: new Date('2026-01-01'),
  _count: {
    gameScores: 5,
    topics: 2,
    replies: 10,
  },
}

describe('Users Me API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // Authentication Tests
  // ============================================
  describe('Authentication Required', () => {
    it('GET /api/users/me returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = createRequest('/api/users/me')
      const response = await GET()

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Non authentifié')
    })

    it('PUT /api/users/me returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { firstName: 'Pierre' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Non authentifié')
    })
  })

  // ============================================
  // GET Profile Tests
  // ============================================
  describe('GET /api/users/me', () => {
    it('returns user profile for authenticated user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any)
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any)

      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user.email).toBe('test@example.com')
      expect(data.user.firstName).toBe('Jean')
      expect(data.user.lastName).toBe('Dupont')
      expect(data.user._count.gameScores).toBe(5)
    })

    it('returns 404 when user not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any)
      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Utilisateur non trouvé')
    })
  })

  // ============================================
  // PUT Profile Tests - First Name
  // ============================================
  describe('PUT /api/users/me - firstName', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any)
    })

    it('updates firstName successfully', async () => {
      vi.mocked(db.user.update).mockResolvedValue({
        ...mockUser,
        firstName: 'Pierre',
      } as any)

      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { firstName: 'Pierre' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user.firstName).toBe('Pierre')
      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({ firstName: 'Pierre' }),
        })
      )
    })

    it('trims whitespace from firstName', async () => {
      vi.mocked(db.user.update).mockResolvedValue({
        ...mockUser,
        firstName: 'Pierre',
      } as any)

      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { firstName: '  Pierre  ' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ firstName: 'Pierre' }),
        })
      )
    })

    it('rejects empty firstName', async () => {
      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { firstName: '   ' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Le prénom est requis')
    })
  })

  // ============================================
  // PUT Profile Tests - Last Name
  // ============================================
  describe('PUT /api/users/me - lastName', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any)
    })

    it('updates lastName successfully', async () => {
      vi.mocked(db.user.update).mockResolvedValue({
        ...mockUser,
        lastName: 'Martin',
      } as any)

      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { lastName: 'Martin' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user.lastName).toBe('Martin')
    })

    it('rejects empty lastName', async () => {
      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { lastName: '   ' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Le nom est requis')
    })
  })

  // ============================================
  // PUT Profile Tests - Email
  // ============================================
  describe('PUT /api/users/me - email', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any)
    })

    it('updates email successfully', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null) // No existing user with this email
      vi.mocked(db.user.update).mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      } as any)

      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { email: 'newemail@example.com' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user.email).toBe('newemail@example.com')
    })

    it('normalizes email to lowercase', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      vi.mocked(db.user.update).mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      } as any)

      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { email: 'NewEmail@Example.COM' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'newemail@example.com' }),
        })
      )
    })

    it('rejects invalid email format', async () => {
      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { email: 'not-an-email' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("Format d'email invalide")
    })

    it('rejects email already used by another user', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'other-user-456' } as any)

      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { email: 'existing@example.com' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Cet email est déjà utilisé par un autre compte')
    })

    it('allows keeping same email (no change)', async () => {
      // Return same user - email belongs to current user
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'user-123' } as any)
      vi.mocked(db.user.update).mockResolvedValue(mockUser as any)

      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: { email: 'test@example.com' },
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
    })
  })

  // ============================================
  // PUT Profile Tests - Multiple Fields
  // ============================================
  describe('PUT /api/users/me - multiple fields', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any)
    })

    it('updates multiple fields at once', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      vi.mocked(db.user.update).mockResolvedValue({
        ...mockUser,
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre.martin@example.com',
      } as any)

      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: {
          firstName: 'Pierre',
          lastName: 'Martin',
          email: 'pierre.martin@example.com',
        },
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user.firstName).toBe('Pierre')
      expect(data.user.lastName).toBe('Martin')
      expect(data.user.email).toBe('pierre.martin@example.com')
    })

    it('rejects when no valid data provided', async () => {
      const request = createRequest('/api/users/me', {
        method: 'PUT',
        body: {},
      })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Aucune donnée valide à mettre à jour')
    })
  })
})
