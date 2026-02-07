# Security Hardening Plan

Based on the security audit of 2026-02-06.

---

## 1. Add Security Headers in `next.config.mjs`

**Severity: Medium | Effort: Low**

Add a `headers()` config to `next.config.mjs`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `Content-Security-Policy` (tailored to allow Supabase, Umami, inline scripts for theme)

Also restrict `images.remotePatterns` from `*.supabase.co` to the exact project hostname.

---

## 2. Add Rate Limiting to Auth Endpoints

**Severity: High | Effort: Medium**

Implement IP-based rate limiting (similar to security portal pattern) on:
- `POST /api/auth/register` — max 5 per hour per IP
- NextAuth login callback — max 5 per 15 min per IP/email

Options: in-memory Map (current approach), or use `upstash/ratelimit` for production.

---

## 3. Stop Returning Temp Passwords in API Response

**Severity: High | Effort: Medium**

In `src/app/api/admin/users/[id]/reset-password/route.ts`:
- Remove `tempPassword` from the JSON response
- Instead, display it once in a modal on the admin page (already done client-side)
- Or better: send a password reset email with a time-limited token
- Consider adding a `passwordResetToken` + `passwordResetExpires` field to the User model

---

## 4. Standardize bcrypt Rounds

**Severity: High | Effort: Low**

In `src/app/api/admin/users/[id]/reset-password/route.ts:37`:
- Change `bcrypt.hash(tempPassword, 10)` to `bcrypt.hash(tempPassword, 12)`
- Extract bcrypt rounds as a constant in a shared config if desired

---

## 5. Fix IP Extraction for Rate Limiting

**Severity: Medium | Effort: Low**

In `src/app/api/security/verify/route.ts` and `src/app/api/security/questions/route.ts`:
- If deployed on Vercel: use `request.headers.get('x-real-ip')` or `request.ip` (Vercel-provided)
- If behind Cloudflare: use `cf-connecting-ip`
- Fallback: keep `x-forwarded-for` but document the trusted proxy assumption
- Apply the same fix to any new rate-limited endpoints

---

## 6. Add Privacy Controls to Contact Endpoints

**Severity: Medium | Effort: Medium**

In `src/app/api/contacts/route.ts`:
- Add a `shareContact` boolean field to User model (default false)
- Only return contact details (phone, address) for users who opted in
- Always return name + avatar (non-sensitive)
- Update `/api/contacts/export` and `/api/contacts/[id]/vcard` accordingly
- Add a toggle in the profile page for users to opt in/out

---

## 7. Validate Game Score Metadata

**Severity: Low | Effort: Low**

In `src/app/api/games/scores/route.ts:38`:
- Validate `metadata` is an object (not array)
- Limit JSON size (e.g., `JSON.stringify(metadata).length < 1024`)
- Optionally whitelist expected keys

---

## 8. Reduce JWT Session Duration

**Severity: Low | Effort: Low**

In `src/lib/auth.config.ts:27`:
- Reduce `maxAge` from 7 days to 3 days
- Consider implementing a sliding window refresh via the `jwt` callback

---

## 9. Add Audit Logging for Admin Actions

**Severity: Medium | Effort: Medium**

Create an `AuditLog` model in Prisma:
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // e.g. "RESET_PASSWORD", "DEACTIVATE_USER"
  targetId  String?
  metadata  Json?
  createdAt DateTime @default(now())
}
```

Log events in:
- `POST /api/admin/users/[id]/reset-password`
- `PUT /api/admin/users/[id]` (role changes, deactivation)
- `POST /api/admin/invitations`
- `DELETE /api/photos/[id]`

---

## 10. Upgrade next-auth When Stable

**Severity: High | Effort: Depends**

Currently on `next-auth@5.0.0-beta.30`. Monitor for stable v5 release and upgrade when available. Review migration guide for breaking changes.

---

## 11. Run `npm audit fix`

**Severity: Medium | Effort: Low**

Dev dependencies (`glob`, `esbuild`, `vite`) have known CVEs. Run:
```bash
npm audit
npm audit fix
```

If breaking changes, pin to patched minor versions manually.

---

## Checklist

- [x] 1. Security headers in next.config.mjs
- [x] 2. Rate limiting on auth endpoints
- [ ] 3. Remove temp password from API response
- [x] 4. Standardize bcrypt to 12 rounds
- [x] 5. Fix IP extraction for rate limiting
- [ ] 6. Privacy controls on contacts
- [x] 7. Validate game score metadata
- [x] 8. Reduce JWT session to 3 days
- [ ] 9. Audit logging for admin actions
- [ ] 10. Upgrade next-auth to stable
- [x] 11. npm audit fix (dev-only vulnerabilities, require breaking upgrades)
