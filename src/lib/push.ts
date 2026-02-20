import webpush from 'web-push'
import { db } from './db'
import { NotificationType } from '@prisma/client'

if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  url: string
  tag?: string
}

/**
 * Send push notifications to users, respecting their preferences.
 * Called fire-and-forget (don't await in API routes).
 */
export async function sendPushNotifications(
  userIds: string[],
  type: NotificationType,
  payload: PushPayload
): Promise<void> {
  if (userIds.length === 0) return

  try {
    // Find users who have push enabled for this notification type
    const preferences = await db.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        type,
        pushEnabled: true,
      },
      select: { userId: true },
    })

    const enabledUserIds = preferences.map((p) => p.userId)
    if (enabledUserIds.length === 0) return

    // Get all push subscriptions for those users
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: { in: enabledUserIds } },
    })

    if (subscriptions.length === 0) return

    // Send to each subscription, collect expired ones
    const expiredIds: string[] = []
    const pushPayload = JSON.stringify(payload)

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            pushPayload
          )
        } catch (error: unknown) {
          const statusCode = (error as { statusCode?: number }).statusCode
          if (statusCode === 410 || statusCode === 404) {
            expiredIds.push(sub.id)
          } else {
            console.error(
              `Push failed for subscription ${sub.id}:`,
              statusCode || (error as Error).message
            )
          }
        }
      })
    )

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await db.pushSubscription.deleteMany({
        where: { id: { in: expiredIds } },
      })
    }
  } catch (error) {
    console.error('Error sending push notifications:', error)
  }
}
