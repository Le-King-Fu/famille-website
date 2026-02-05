import { db } from './db'

// Regex to match @FirstName or @FirstName LastName mentions
// Supports accented characters common in French names
const MENTION_REGEX = /@([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)/g

export interface MentionedUser {
  id: string
  firstName: string
  lastName: string
}

/**
 * Extract @mentions from content and find matching users
 * Matches by firstName (case-insensitive) or "firstName lastName"
 */
export async function parseMentions(content: string): Promise<MentionedUser[]> {
  const matches = content.matchAll(MENTION_REGEX)
  const mentionedNames = new Set<string>()

  for (const match of matches) {
    mentionedNames.add(match[1].toLowerCase())
  }

  if (mentionedNames.size === 0) {
    return []
  }

  // Get all active users
  const users = await db.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  })

  const mentionedUsers: MentionedUser[] = []
  const matchedIds = new Set<string>()

  for (const name of mentionedNames) {
    for (const user of users) {
      // Skip if already matched
      if (matchedIds.has(user.id)) continue

      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
      const firstName = user.firstName.toLowerCase()

      // Match by full name or first name
      if (name === fullName || name === firstName) {
        mentionedUsers.push(user)
        matchedIds.add(user.id)
        break
      }
    }
  }

  return mentionedUsers
}

/**
 * Format a user's name for mention display
 */
export function formatMention(user: { firstName: string }): string {
  return `@${user.firstName}`
}

/**
 * Check if content contains a mention of a specific user
 */
export function hasMention(content: string, user: { firstName: string; lastName: string }): boolean {
  const lowerContent = content.toLowerCase()
  const firstName = user.firstName.toLowerCase()
  const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()

  return (
    lowerContent.includes(`@${firstName}`) ||
    lowerContent.includes(`@${fullName}`)
  )
}
