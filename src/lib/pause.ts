import { NextResponse, type NextRequest } from 'next/server'

// Static page served while the site is paused (public/en-pause/index.html)
export const PAUSE_PAGE = '/en-pause/index.html'

export function isSitePaused(): boolean {
  return process.env.SITE_PAUSED === 'true'
}

/**
 * While the site is paused, every page shows the static pause page and
 * every API route answers 503. Returns null when the site is not paused.
 */
export function pauseResponse(req: NextRequest): NextResponse | null {
  if (!isSitePaused()) return null

  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Site en pause' },
      { status: 503, headers: { 'Retry-After': '86400' } }
    )
  }

  return NextResponse.rewrite(new URL(PAUSE_PAGE, req.url))
}
