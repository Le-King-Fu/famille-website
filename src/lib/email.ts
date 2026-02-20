import { Resend } from 'resend'
import { db } from './db'
import { NotificationType } from '@prisma/client'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail =
  process.env.RESEND_FROM_EMAIL || 'notifications@lacompagniemaximus.com'

interface EmailPayload {
  subject: string
  body: string
  url: string
}

/**
 * Send email notifications to users, respecting their preferences.
 * Called fire-and-forget (don't await in API routes).
 */
export async function sendEmailNotifications(
  userIds: string[],
  type: NotificationType,
  payload: EmailPayload
): Promise<void> {
  if (userIds.length === 0 || !resend) return

  try {
    // Find users who have email enabled for this notification type
    const preferences = await db.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        type,
        emailEnabled: true,
      },
      select: { userId: true },
    })

    const enabledUserIds = preferences.map((p) => p.userId)
    if (enabledUserIds.length === 0) return

    // Get emails for those users
    const users = await db.user.findMany({
      where: { id: { in: enabledUserIds } },
      select: { email: true, firstName: true },
    })

    if (users.length === 0) return

    const siteUrl = process.env.NEXTAUTH_URL || 'https://lacompagniemaximus.com'

    // Send to each recipient
    await Promise.allSettled(
      users.map(async (user) => {
        try {
          await resend.emails.send({
            from: `La Compagnie Maximus <${fromEmail}>`,
            to: user.email,
            subject: payload.subject,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a1a; margin-bottom: 16px;">La Compagnie Maximus</h2>
                <p style="color: #333; font-size: 16px; line-height: 1.5;">Bonjour ${user.firstName},</p>
                <p style="color: #333; font-size: 16px; line-height: 1.5;">${payload.body}</p>
                <a href="${siteUrl}${payload.url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Voir sur le site</a>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 32px;" />
                <p style="color: #9ca3af; font-size: 12px;">Vous recevez cet email car vous avez activé les notifications par courriel. Vous pouvez les désactiver dans votre profil.</p>
              </div>
            `,
          })
        } catch (error) {
          console.error(
            `Email failed for ${user.email}:`,
            (error as Error).message
          )
        }
      })
    )
  } catch (error) {
    console.error('Error sending email notifications:', error)
  }
}
