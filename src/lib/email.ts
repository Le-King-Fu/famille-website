import { Resend } from 'resend'
import { db } from './db'
import { NotificationType } from '@prisma/client'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail =
  process.env.RESEND_FROM_EMAIL || 'notifications@lacompagniemaximus.com'

/**
 * Escape special HTML characters to prevent HTML injection in email templates.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface DigestNotification {
  type: string
  message: string
  link: string
  createdAt: Date
}

const TYPE_SECTIONS: Record<string, { emoji: string; label: string }> = {
  NEW_EVENT: { emoji: '📅', label: 'Nouveaux événements' },
  MENTION: { emoji: '💬', label: 'Mentions' },
  QUOTE: { emoji: '💬', label: 'Citations' },
  TOPIC_REPLY: { emoji: '💬', label: 'Réponses à vos sujets' },
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Toronto',
  })
}

/**
 * Send a daily digest email to a user with their recent notifications.
 */
export async function sendDigestEmail(
  user: { email: string; firstName: string },
  notifications: DigestNotification[]
): Promise<void> {
  if (!resend || notifications.length === 0) return

  const siteUrl = process.env.NEXTAUTH_URL || 'https://lacompagniemaximus.com'

  // Group notifications by type
  const grouped = new Map<string, DigestNotification[]>()
  for (const n of notifications) {
    const list = grouped.get(n.type) || []
    list.push(n)
    grouped.set(n.type, list)
  }

  // Build HTML sections
  const sections = Array.from(grouped.entries())
    .map(([type, items]) => {
      const section = TYPE_SECTIONS[type] || { emoji: '🔔', label: type }
      const itemsHtml = items
        .map(
          (n) =>
            `<li style="margin-bottom: 8px;">
              <a href="${siteUrl}${escapeHtml(n.link)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(n.message)}</a>
              <span style="color: #9ca3af; font-size: 12px;"> — ${formatTime(n.createdAt)}</span>
            </li>`
        )
        .join('')

      return `
        <h3 style="color: #1a1a1a; font-size: 16px; margin: 20px 0 8px 0;">${section.emoji} ${section.label}</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">${itemsHtml}</ul>
      `
    })
    .join('')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a; margin-bottom: 4px;">La Compagnie Maximus</h2>
      <p style="color: #6b7280; font-size: 14px; margin-top: 0;">Résumé quotidien</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Bonjour ${escapeHtml(user.firstName)},</p>
      <p style="color: #333; font-size: 15px; line-height: 1.5;">Voici votre résumé des dernières 24 heures :</p>
      ${sections}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 32px;" />
      <p style="color: #9ca3af; font-size: 12px;">
        <a href="${siteUrl}/profil" style="color: #9ca3af;">Gérer vos préférences de notification</a>
      </p>
    </div>
  `

  try {
    await resend.emails.send({
      from: `La Compagnie Maximus <${fromEmail}>`,
      to: user.email,
      subject: `Résumé du jour — La Compagnie Maximus`,
      html,
    })
  } catch (error) {
    console.error(`Digest email failed for ${user.email}:`, (error as Error).message)
  }
}

interface EmailNotificationPayload {
  subject: string
  message: string
  link: string
}

/**
 * Send immediate email notifications to users who have email enabled
 * for the given notification type. Called fire-and-forget.
 */
export async function sendEmailNotifications(
  userIds: string[],
  type: NotificationType,
  payload: EmailNotificationPayload
): Promise<void> {
  if (!resend || userIds.length === 0) return

  try {
    // Single query: find users with email enabled for this notification type
    const preferences = await db.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        type,
        emailEnabled: true,
        user: { isActive: true },
      },
      select: {
        user: {
          select: { email: true, firstName: true },
        },
      },
    })

    const users = preferences.map((p) => p.user)
    if (users.length === 0) return

    const siteUrl = process.env.NEXTAUTH_URL || 'https://lacompagniemaximus.com'

    await Promise.allSettled(
      users.map(async (user) => {
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a; margin-bottom: 4px;">La Compagnie Maximus</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">Bonjour ${escapeHtml(user.firstName)},</p>
            <p style="color: #333; font-size: 15px; line-height: 1.5;">${escapeHtml(payload.message)}</p>
            <p style="margin-top: 20px;">
              <a href="${siteUrl}${escapeHtml(payload.link)}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">Voir les détails</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 32px;" />
            <p style="color: #9ca3af; font-size: 12px;">
              <a href="${siteUrl}/profil" style="color: #9ca3af;">Gérer vos préférences de notification</a>
            </p>
          </div>
        `

        try {
          await resend!.emails.send({
            from: `La Compagnie Maximus <${fromEmail}>`,
            to: user.email,
            subject: payload.subject,
            html,
          })
        } catch (error) {
          console.error(`Email notification failed for ${user.email}:`, (error as Error).message)
        }
      })
    )
  } catch (error) {
    console.error('Error sending email notifications:', error)
  }
}
