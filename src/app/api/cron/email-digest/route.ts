import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendDigestEmail } from '@/lib/email'
import { NotificationType } from '@prisma/client'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Get all notifications from the last 24h (including read ones)
    const notifications = await db.notification.findMany({
      where: {
        createdAt: { gte: since },
      },
      select: {
        type: true,
        message: true,
        link: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (notifications.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No notifications' })
    }

    // Get unique user IDs
    const userIds = [...new Set(notifications.map((n) => n.userId))]

    // Get email preferences for all those users
    const preferences = await db.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        emailEnabled: true,
      },
      select: { userId: true, type: true },
    })

    // Build a map: userId -> Set of enabled types
    const enabledTypes = new Map<string, Set<NotificationType>>()
    for (const pref of preferences) {
      const types = enabledTypes.get(pref.userId) || new Set()
      types.add(pref.type)
      enabledTypes.set(pref.userId, types)
    }

    // Filter to users who have at least one email-enabled type
    const eligibleUserIds = userIds.filter(
      (id) => enabledTypes.has(id) && enabledTypes.get(id)!.size > 0
    )

    if (eligibleUserIds.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No users with email enabled' })
    }

    // Get user details
    const users = await db.user.findMany({
      where: { id: { in: eligibleUserIds }, isActive: true },
      select: { id: true, email: true, firstName: true },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    // Send digest to each eligible user
    let sent = 0
    await Promise.allSettled(
      eligibleUserIds.map(async (userId) => {
        const user = userMap.get(userId)
        if (!user) return

        const userEnabledTypes = enabledTypes.get(userId)!
        const userNotifications = notifications
          .filter((n) => n.userId === userId && userEnabledTypes.has(n.type))
          .map((n) => ({
            type: n.type,
            message: n.message,
            link: n.link,
            createdAt: n.createdAt,
          }))

        if (userNotifications.length === 0) return

        await sendDigestEmail(
          { email: user.email, firstName: user.firstName },
          userNotifications
        )
        sent++
      })
    )

    return NextResponse.json({ sent, total: eligibleUserIds.length })
  } catch (error) {
    console.error('Error in email digest cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
