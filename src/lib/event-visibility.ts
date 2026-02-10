import { Prisma } from '@prisma/client'

/**
 * Returns a Prisma where clause that filters out events hidden from the given user.
 * Admins see everything (returns empty object).
 */
export function eventVisibilityFilter(
  userId: string,
  isAdmin: boolean
): Prisma.EventWhereInput {
  if (isAdmin) return {}
  return {
    NOT: { hiddenFrom: { some: { userId } } },
  }
}

/**
 * Returns a Prisma where clause that filters out topics linked to events
 * that are hidden from the given user.
 * Topics not linked to any event always pass through.
 * Admins see everything (returns empty object).
 */
export function topicVisibilityFilter(
  userId: string,
  isAdmin: boolean
): Prisma.TopicWhereInput {
  if (isAdmin) return {}
  return {
    OR: [
      { event: null },
      { event: { NOT: { hiddenFrom: { some: { userId } } } } },
    ],
  }
}
