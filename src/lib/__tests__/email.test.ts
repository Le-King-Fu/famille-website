import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mock so it's available inside vi.mock factory
const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({ id: 'test-id' }),
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}))

// Mock db module
vi.mock('@/lib/db', () => ({
  db: {
    notificationPreference: {
      findMany: vi.fn(),
    },
  },
}))

// Set env vars before importing the module
process.env.RESEND_API_KEY = 'test-key'
process.env.NEXTAUTH_URL = 'https://example.com'

import { escapeHtml, sendEmailNotifications } from '../email'
import { db } from '@/lib/db'

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar')
  })

  it('should escape angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('should escape quotes', () => {
    expect(escapeHtml('"hello" & \'world\'')).toBe(
      '&quot;hello&quot; &amp; &#39;world&#39;'
    )
  })

  it('should return safe strings unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123')
  })
})

describe('sendEmailNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not send emails when no users have email enabled', async () => {
    vi.mocked(db.notificationPreference.findMany).mockResolvedValue([])

    await sendEmailNotifications(
      ['user-1'],
      'NEW_EVENT' as never,
      { subject: 'Test', message: 'Hello', link: '/events/1' }
    )

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('should send emails to users with email enabled using single DB query', async () => {
    vi.mocked(db.notificationPreference.findMany).mockResolvedValue([
      { user: { email: 'alice@test.com', firstName: 'Alice' } },
      { user: { email: 'bob@test.com', firstName: 'Bob' } },
    ] as never)

    await sendEmailNotifications(
      ['user-1', 'user-2'],
      'NEW_EVENT' as never,
      { subject: 'New Event', message: 'Event created', link: '/events/1' }
    )

    // Should use a single query with user relation filter
    expect(db.notificationPreference.findMany).toHaveBeenCalledTimes(1)
    expect(db.notificationPreference.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: { isActive: true },
        }),
        select: expect.objectContaining({
          user: { select: { email: true, firstName: true } },
        }),
      })
    )

    // Should send to both users
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('should escape HTML in user data to prevent injection', async () => {
    vi.mocked(db.notificationPreference.findMany).mockResolvedValue([
      { user: { email: 'xss@test.com', firstName: '<script>alert(1)</script>' } },
    ] as never)

    await sendEmailNotifications(
      ['user-xss'],
      'NEW_EVENT' as never,
      {
        subject: 'Test',
        message: '<img src=x onerror=alert(1)>',
        link: '/events/1"onmouseover="alert(1)',
      }
    )

    expect(mockSend).toHaveBeenCalledTimes(1)
    const sentHtml = mockSend.mock.calls[0][0].html as string

    // User firstName should be escaped
    expect(sentHtml).not.toContain('<script>alert(1)</script>')
    expect(sentHtml).toContain('&lt;script&gt;')

    // Payload message should be escaped
    expect(sentHtml).not.toContain('<img src=x onerror=alert(1)>')
    expect(sentHtml).toContain('&lt;img src=x onerror=alert(1)&gt;')

    // Payload link should be escaped
    expect(sentHtml).not.toContain('"onmouseover="alert(1)')
    expect(sentHtml).toContain('&quot;onmouseover=&quot;alert(1)')
  })
})
