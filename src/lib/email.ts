import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail =
  process.env.RESEND_FROM_EMAIL || 'notifications@lacompagniemaximus.com'

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
              <a href="${siteUrl}${n.link}" style="color: #2563eb; text-decoration: none;">${n.message}</a>
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
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Bonjour ${user.firstName},</p>
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
