import { describe, it, expect, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { pauseResponse, PAUSE_PAGE } from '../pause'

function request(path: string) {
  return new NextRequest(new URL(path, 'https://www.mafamillelandry.ca'))
}

describe('pauseResponse', () => {
  afterEach(() => {
    delete process.env.SITE_PAUSED
  })

  it('lets requests through when the site is not paused', () => {
    expect(pauseResponse(request('/calendrier'))).toBeNull()
  })

  it('rewrites every page to the pause page when paused', () => {
    process.env.SITE_PAUSED = 'true'
    for (const path of ['/', '/portail', '/forum/sujet/1']) {
      const res = pauseResponse(request(path))
      expect(res?.headers.get('x-middleware-rewrite')).toBe(
        `https://www.mafamillelandry.ca${PAUSE_PAGE}`
      )
    }
  })

  it('answers 503 on API routes when paused', async () => {
    process.env.SITE_PAUSED = 'true'
    const res = pauseResponse(request('/api/cron/email-digest'))
    expect(res?.status).toBe(503)
    expect(await res?.json()).toEqual({ error: 'Site en pause' })
  })

  it('ignores values other than "true"', () => {
    process.env.SITE_PAUSED = '1'
    expect(pauseResponse(request('/'))).toBeNull()
  })
})
