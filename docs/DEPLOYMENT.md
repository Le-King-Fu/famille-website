# Deployment Plan - Site Web Familial

> Step-by-step guide to deploy the family website to production.

---

## Overview

| Component | Service | Tier |
|-----------|---------|------|
| Frontend + API | Vercel | Free |
| Database | Supabase PostgreSQL | Free |
| File Storage | Supabase Storage | Free |
| Domain | Your choice | ~$12/year |

**Estimated time:** 1-2 hours

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account with the repository pushed
- [ ] Vercel account (sign up at vercel.com)
- [ ] Supabase account (sign up at supabase.com)
- [ ] (Optional) Domain name purchased

---

## Step 1: Supabase Project Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name:** `famille-website`
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your family (e.g., `eu-west-1` for France)
4. Click **Create new project**
5. Wait for project to be ready (~2 minutes)

### 1.2 Get Database Connection String

1. Go to **Settings** > **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. Replace `[password]` with your database password
6. **Important:** Add `?pgbouncer=true` at the end for connection pooling:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### 1.3 Get API Keys

1. Go to **Settings** > **API**
2. Note down:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (safe to expose in browser)
   - **service_role key** (keep secret, server-side only)

### 1.4 Create Storage Bucket

1. Go to **Storage** in sidebar
2. Click **New bucket**
3. Configure:
   - **Name:** `photos`
   - **Public bucket:** ✅ Yes (photos need public read access)
4. Click **Create bucket**

### 1.5 Configure Storage Policies

1. Click on the `photos` bucket
2. Go to **Policies** tab
3. Create policies:

**Policy 1: Public Read Access**
```sql
-- Allow public read access to all files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');
```

**Policy 2: Authenticated Upload (via service role)**
```sql
-- Allow authenticated uploads via service role
CREATE POLICY "Service role upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos');
```

Or use the UI:
- Click **New Policy**
- Select **For full customization**
- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Target roles: Leave empty (public)
- USING expression: `bucket_id = 'photos'`

---

## Step 2: Vercel Deployment

### 2.1 Import Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New...** > **Project**
3. Select **Import Git Repository**
4. Find and select `famille-website`
5. Click **Import**

### 2.2 Configure Build Settings

Vercel should auto-detect Next.js. Verify:

- **Framework Preset:** Next.js
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

### 2.3 Set Environment Variables

Click **Environment Variables** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres.[ref]:[password]@...?pgbouncer=true` | All |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJI...` (anon key) | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJI...` (service role) | All |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` | All |
| `NEXTAUTH_URL` | `https://your-domain.com` (or Vercel URL) | Production |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key (Web Push) | All |
| `VAPID_PRIVATE_KEY` | VAPID private key (Web Push) | All |
| `VAPID_SUBJECT` | `mailto:admin@your-domain.com` | All |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) | All |
| `RESEND_FROM_EMAIL` | `notifications@lacompagniemaximus.com` | All |
| `CRON_SECRET` | Generate with `openssl rand -hex 32` | All |

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2.4 Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Note your deployment URL: `https://famille-website-xxx.vercel.app`

---

## Step 3: Database Migration

### 3.1 Run Migrations

After first deployment, run migrations. You have two options:

**Option A: Via Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Run migrations via Vercel environment
vercel env pull .env.production.local
npx prisma migrate deploy
```

**Option B: Direct Connection**

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://postgres.[ref]:[password]@..."

# Run migrations
npx prisma migrate deploy
```

### 3.2 Seed Initial Data

```bash
# Using same DATABASE_URL as above
npm run db:seed
```

This creates:
- Admin user (check `prisma/seed.ts` for credentials)
- Initial security questions
- Forum categories

### 3.3 Verify Database

1. Go to Supabase **Table Editor**
2. Check tables exist: `User`, `SecurityQuestion`, `InvitationCode`, etc.
3. Verify seed data is present

---

## Step 4: Post-Deployment Verification

### 4.1 Test Checklist

- [ ] **Portal:** Visit `/portail`, answer security question
- [ ] **Login:** Sign in with admin account
- [ ] **Dashboard:** Home page loads with stats
- [ ] **Calendar:** Create/view events
- [ ] **Photos:** View albums (empty is OK)
- [ ] **Forum:** View categories and topics
- [ ] **Notifications:** Toggle email preferences in `/profil`, verify cron in Vercel dashboard
- [ ] **Games:** Play Piano Hero, score submits
- [ ] **Admin:** Access `/admin`, all sections work

### 4.2 Test Admin Functions

- [ ] `/admin/utilisateurs` - View user list
- [ ] `/admin/questions` - Manage security questions
- [ ] `/admin/invitations` - Generate invitation code
- [ ] `/admin/photos` - Create album, upload photo

### 4.3 Test Registration Flow

1. Generate invitation code in admin
2. Open incognito window
3. Go to `/portail` > answer question
4. Go to `/inscription`
5. Enter invitation code and register
6. Verify new user appears in admin

---

## Step 4b: Email Notifications (Resend)

### 4b.1 Configure Resend

1. Sign up at [resend.com](https://resend.com)
2. Go to **Domains** > **Add Domain**
3. Add `lacompagniemaximus.com`
4. Add the required DNS records (SPF, DKIM, DMARC) at your domain registrar
5. Wait for domain verification

### 4b.2 Create API Key

1. Go to **API Keys** > **Create API Key**
2. Name it `famille-website-production`
3. Add as `RESEND_API_KEY` in Vercel environment variables

### 4b.3 Verify Cron Job

After deployment, the daily email digest cron is configured via `vercel.json`:
- **Schedule:** Every day at 23:00 UTC (18:00 ET)
- **Path:** `/api/cron/email-digest`
- Verify it appears in **Vercel Dashboard** > **Settings** > **Crons**

---

## Step 5: Custom Domain (Optional)

### 5.1 Add Domain in Vercel

1. Go to project **Settings** > **Domains**
2. Enter your domain: `famille.example.com`
3. Click **Add**

### 5.2 Configure DNS

Add these records at your domain registrar:

**For apex domain (example.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For subdomain (famille.example.com):**
```
Type: CNAME
Name: famille
Value: cname.vercel-dns.com
```

### 5.3 Update Environment Variable

1. Go to Vercel **Settings** > **Environment Variables**
2. Update `NEXTAUTH_URL` to `https://famille.example.com`
3. Redeploy for changes to take effect

### 5.4 SSL Certificate

Vercel automatically provisions SSL. Wait a few minutes after DNS propagation.

---

## Step 6: Initial Configuration

### 6.1 Change Admin Password

1. Login with seed admin credentials
2. Go to `/profil`
3. Change password immediately

### 6.2 Update Security Questions

1. Go to `/admin/questions`
2. Replace default questions with family-specific ones
3. Ensure answers are known only to family members

### 6.3 Create Invitation Codes

1. Go to `/admin/invitations`
2. Generate codes for each family member
3. Send codes securely (not via public channels)

### 6.4 Upload Family Photos

1. Go to `/admin/photos`
2. Create albums
3. Upload photos

---

## Troubleshooting

### Build Fails

**Error: Prisma Client not generated**
```bash
# Add to build command in Vercel:
prisma generate && next build
```

**Error: Cannot find module '@prisma/client'**
- Ensure `prisma generate` runs before build
- Check `postinstall` script in `package.json`

### Database Connection Issues

**Error: P1001 Can't reach database**
- Verify `DATABASE_URL` is correct
- Check password has no special characters that need encoding
- Ensure `?pgbouncer=true` is appended

**Error: Connection timeout**
- Supabase may have paused (free tier pauses after inactivity)
- Go to Supabase dashboard to wake it up

### Storage Issues

**Error: 403 when uploading photos**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check storage policies allow uploads

**Error: Images not loading**
- Verify bucket is public
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct

### Auth Issues

**Error: NEXTAUTH_URL mismatch**
- Ensure `NEXTAUTH_URL` matches your actual domain
- Redeploy after changing environment variables

**Error: AUTH_SECRET must be set**
- Generate with `openssl rand -base64 32`
- Add to Vercel environment variables

---

## Maintenance

### Database Backups

Supabase free tier includes daily backups (7-day retention).

For manual backup:
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Updating the Site

1. Push changes to GitHub `main` branch
2. Vercel auto-deploys on push
3. Verify deployment in Vercel dashboard

### Monitoring

- **Vercel Analytics:** Enable in project settings
- **Supabase Dashboard:** Monitor database usage
- **Error Tracking:** Consider adding Sentry (Phase 9)

---

## Security Checklist

- [ ] Admin password changed from default
- [ ] Security questions are family-specific
- [ ] `AUTH_SECRET` is unique and secret
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not exposed in client code
- [ ] Invitation codes sent via secure channels
- [ ] Regular review of user list

---

## Cost Estimate (Monthly)

| Service | Free Tier Limits | Estimated Cost |
|---------|------------------|----------------|
| Vercel | 100GB bandwidth, 100 deploys | $0 |
| Supabase | 500MB database, 1GB storage | $0 |
| Domain | N/A | ~$1/month |
| **Total** | | **~$1/month** |

Free tiers are generous for family use. You'll likely stay within limits unless:
- Uploading >1GB of photos (upgrade Supabase storage)
- >100GB/month traffic (unlikely for family site)

---

## Quick Reference

### Important URLs

| What | URL |
|------|-----|
| Production Site | `https://your-domain.com` |
| Vercel Dashboard | `https://vercel.com/your-username/famille-website` |
| Supabase Dashboard | `https://supabase.com/dashboard/project/xxxxx` |

### Credentials Location

| What | Where |
|------|-------|
| Supabase DB Password | Password manager / Supabase dashboard |
| API Keys | Vercel environment variables |
| Admin Login | Created during seed (change immediately!) |

### Useful Commands

```bash
# Check deployment logs
vercel logs

# Pull production env vars
vercel env pull

# Run migrations on production
DATABASE_URL="..." npx prisma migrate deploy

# Open Prisma Studio (local)
npx prisma studio
```

---

## Next Steps After Deployment

1. **Invite family members** - Generate codes, help them register
2. **Add content** - Upload photos, create calendar events
3. **Gather feedback** - What features do they want?
4. **Phase 6: Tests** - Add automated testing
5. **Phase 9: Polish** - Dark mode, animations, error pages
