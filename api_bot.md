# Plan: Bot API for Forum Posting

## Goal
Create a secure API endpoint that allows Claude (or other bots) to post topics to a **specific** forum category only.

---

## Why This Approach?

The current forum API uses session-based authentication (NextAuth.js JWT). Claude cannot use this because:
- No browser/cookie support
- No user credentials to authenticate

**Solution:** Create a separate API endpoint with API key authentication, restricted to one category.

---

## Architecture

```
┌─────────────┐     POST /api/bot/forum-post     ┌──────────────────┐
│   Claude    │ ──────────────────────────────── │  New Bot API     │
│   (CLI)     │   Header: X-Bot-Key: <secret>    │  Endpoint        │
└─────────────┘   Body: { title, content }       └────────┬─────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │  Validate API    │
                                                 │  Key from ENV    │
                                                 └────────┬─────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │  Create Topic    │
                                                 │  in hardcoded    │
                                                 │  category ID     │
                                                 └────────┬─────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │  Use "Bot" user  │
                                                 │  as author       │
                                                 └──────────────────┘
```

---

## Implementation Steps

### Step 1: Add Environment Variables

**File:** `.env.local` (and Vercel env vars)

```env
BOT_API_KEY=<generate-secure-random-key>
BOT_FORUM_CATEGORY_ID=cml6i8c3a0001vk8rfaxv1jaa
BOT_USER_ID=<id-of-bot-user>
```

### Step 2: Create Bot User (one-time)

Create a dedicated user in the database for bot posts:
- Email: `bot@lafamillelandry.ca`
- Name: "Claude Bot" or "Système"
- Role: MEMBER (so posts appear normally)
- isActive: true

**Option A:** Add to seed script
**Option B:** Create via admin UI
**Option C:** Direct database insert

### Step 3: Create Bot API Endpoint

**File:** `src/app/api/bot/forum-post/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  // 1. Validate API key
  const apiKey = request.headers.get('X-Bot-Key')
  if (apiKey !== process.env.BOT_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate body
  const { title, content } = await request.json()

  if (!title || !content) {
    return NextResponse.json({ error: 'Missing title or content' }, { status: 400 })
  }

  // 3. Create topic in the allowed category only
  const topic = await prisma.topic.create({
    data: {
      title: title.trim().slice(0, 200),
      content: content.trim().slice(0, 10000),
      categoryId: process.env.BOT_FORUM_CATEGORY_ID!,
      authorId: process.env.BOT_USER_ID!,
    },
    include: {
      author: { select: { firstName: true, lastName: true } },
    },
  })

  return NextResponse.json({ topic }, { status: 201 })
}
```

### Step 4: Update Middleware (Required)

The middleware currently redirects unauthenticated requests to `/portail`. We need to allow `/api/bot/*` through.

**File:** `src/middleware.ts`

Add after line 22:
```typescript
// API pour le bot (authentification par API key)
if (pathname.startsWith('/api/bot')) {
  return NextResponse.next()
}
```

---

## Security Measures

| Measure | Implementation |
|---------|----------------|
| API Key validation | Header `X-Bot-Key` must match `BOT_API_KEY` env var |
| Category restriction | Hardcoded category ID in env - cannot post elsewhere |
| Rate limiting | (Optional) Add rate limit middleware |
| Content validation | Max 200 chars title, 10000 chars content |
| No edit/delete | Endpoint only supports POST (create) |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/app/api/bot/forum-post/route.ts` | **Create** - New bot endpoint |
| `.env.local` | **Modify** - Add 3 env vars |
| `prisma/seed.ts` | **Modify** - Add bot user creation |
| `src/middleware.ts` | **Modify** - Allow `/api/bot/*` unauthenticated |

---

## Usage (How Claude Will Call It)

```bash
curl -X POST https://famille-website.vercel.app/api/bot/forum-post \
  -H "Content-Type: application/json" \
  -H "X-Bot-Key: YOUR_SECRET_KEY" \
  -d '{"title": "Mise à jour du site", "content": "Voici les derniers changements..."}'
```

---

## Verification

1. Run `npm run dev`
2. Create bot user in database
3. Set env vars locally
4. Test with curl:
   ```bash
   curl -X POST http://localhost:3000/api/bot/forum-post \
     -H "Content-Type: application/json" \
     -H "X-Bot-Key: test-key" \
     -d '{"title": "Test Post", "content": "Hello from Claude!"}'
   ```
5. Verify post appears in forum category
6. Deploy and test on Vercel
