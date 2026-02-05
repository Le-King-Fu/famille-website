export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Calendar, Gamepad2, Image, MessageSquare, Trophy, Clock, Reply } from 'lucide-react'

export default async function HomePage() {
  const session = await auth()

  // Récupérer les prochains événements
  const upcomingEvents = await db.event.findMany({
    where: {
      startDate: { gte: new Date() },
    },
    orderBy: { startDate: 'asc' },
    take: 5,
    include: {
      createdBy: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  // Récupérer les derniers sujets du forum avec statut lu/non-lu
  const userId = session?.user?.id
  const recentTopics = await db.topic.findMany({
    orderBy: { lastReplyAt: 'desc' },
    take: 5,
    include: {
      author: {
        select: { firstName: true, lastName: true },
      },
      category: {
        select: { id: true, name: true },
      },
      _count: {
        select: { replies: true },
      },
      replies: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          author: {
            select: { firstName: true },
          },
        },
      },
      reads: userId ? {
        where: { userId },
        select: { lastReadAt: true },
      } : false,
    },
  })

  // Calculate unread status for each topic
  const topicsWithReadStatus = recentTopics.map((topic) => {
    const userRead = topic.reads?.[0]
    const isUnread = !userRead || new Date(topic.lastReplyAt) > new Date(userRead.lastReadAt)
    const lastReply = topic.replies?.[0]
    return {
      ...topic,
      isUnread,
      lastReply,
    }
  })

  // Récupérer les dernières réponses non lues
  const recentRepliesRaw = userId ? await db.reply.findMany({
    where: {
      authorId: { not: userId },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      author: {
        select: { firstName: true, lastName: true },
      },
      topic: {
        select: {
          id: true,
          title: true,
          categoryId: true,
          reads: {
            where: { userId },
            select: { lastReadAt: true },
          },
        },
      },
    },
  }) : []

  // Filter to only unread replies
  const unreadReplies = recentRepliesRaw
    .filter((reply) => {
      const topicRead = reply.topic.reads?.[0]
      if (!topicRead) return true // Never read
      return new Date(reply.createdAt) > new Date(topicRead.lastReadAt)
    })
    .slice(0, 5)

  // Récupérer les meilleurs scores récents
  const recentScores = await db.gameScore.findMany({
    orderBy: { playedAt: 'desc' },
    take: 5,
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  const gameNames: Record<string, string> = {
    PIANO_HERO: 'Piano Hero',
    PIANO_HERO_V2: 'Piano Hero v2',
    WITCH_CASE: 'Witch Case',
    BELLE_BETE_SAGE: 'Belle Bête Sage',
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="card bg-gradient-to-r from-bleu to-bleu-600 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Bienvenue, {session?.user?.name?.split(' ')[0]} !
        </h1>
        <p className="text-bleu-100">
          Ravi de vous revoir dans l&apos;espace familial des Landry.
        </p>
      </div>

      {/* Unread replies section - prominent display */}
      {unreadReplies.length > 0 && (
        <div className="card border-l-4 border-l-bleu">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Reply className="h-5 w-5 text-bleu" />
              Nouvelles réponses non lues
              <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-bleu text-white rounded-full">
                {unreadReplies.length}
              </span>
            </h2>
            <Link href="/forum" className="text-sm text-bleu hover:underline">
              Voir le forum
            </Link>
          </div>
          <ul className="space-y-3">
            {unreadReplies.map((reply) => (
              <li key={reply.id}>
                <Link
                  href={`/forum/${reply.topic.categoryId}/${reply.topic.id}`}
                  className="block p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bleu/20 flex items-center justify-center text-bleu font-medium text-sm">
                      {reply.author.firstName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {reply.author.firstName} {reply.author.lastName}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(reply.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-bleu mt-0.5">
                        dans {reply.topic.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming events */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-bleu" />
              Prochains événements
            </h2>
            <Link
              href="/calendrier"
              className="text-sm text-bleu hover:underline"
            >
              Voir tout
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <ul className="space-y-3">
              {upcomingEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.startDate).toLocaleDateString('fr-FR', {
                        month: 'short',
                      })}
                    </div>
                    <div className="text-lg font-bold text-bleu">
                      {new Date(event.startDate).getDate()}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      par {event.createdBy.firstName}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun événement à venir</p>
          )}
        </div>

        {/* Recent forum activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-bleu" />
              Forum
            </h2>
            <Link href="/forum" className="text-sm text-bleu hover:underline">
              Voir tout
            </Link>
          </div>
          {topicsWithReadStatus.length > 0 ? (
            <ul className="space-y-3">
              {topicsWithReadStatus.map((topic) => (
                <li key={topic.id} className="text-sm">
                  <Link
                    href={`/forum/${topic.category.id}/${topic.id}`}
                    className="group flex items-start gap-2"
                  >
                    {topic.isUnread && (
                      <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-bleu" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`font-medium group-hover:text-bleu line-clamp-1 ${
                        topic.isUnread
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {topic.title}
                      </span>
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-2 mt-0.5">
                        {topic.lastReply ? (
                          <>
                            <span>Réponse de {topic.lastReply.author.firstName}</span>
                            <span>•</span>
                          </>
                        ) : (
                          <>
                            <span>Par {topic.author.firstName}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{topic._count.replies} réponse{topic._count.replies !== 1 ? 's' : ''}</span>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune discussion récente</p>
          )}
        </div>

        {/* Recent game scores */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-terracotta" />
              Scores récents
            </h2>
            <Link
              href="/jeux/classement"
              className="text-sm text-bleu hover:underline"
            >
              Classements
            </Link>
          </div>
          {recentScores.length > 0 ? (
            <ul className="space-y-3">
              {recentScores.map((score) => (
                <li
                  key={score.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {score.user.firstName}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {gameNames[score.game]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-terracotta">{score.score}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(score.playedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun score enregistré</p>
          )}
        </div>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAccessCard
          href="/calendrier"
          icon={Calendar}
          title="Calendrier"
          description="Événements familiaux"
          color="bleu"
        />
        <QuickAccessCard
          href="/jeux"
          icon={Gamepad2}
          title="Jeux"
          description="Jouer ensemble"
          color="terracotta"
        />
        <QuickAccessCard
          href="/photos"
          icon={Image}
          title="Photos"
          description="Albums souvenirs"
          color="bleu"
        />
        <QuickAccessCard
          href="/forum"
          icon={MessageSquare}
          title="Forum"
          description="Discussions"
          color="terracotta"
        />
      </div>
    </div>
  )
}

function QuickAccessCard({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string
  icon: typeof Calendar
  title: string
  description: string
  color: 'bleu' | 'terracotta'
}) {
  const colorClasses = {
    bleu: 'bg-bleu/10 text-bleu hover:bg-bleu hover:text-white dark:bg-bleu/20',
    terracotta:
      'bg-terracotta/10 text-terracotta hover:bg-terracotta hover:text-white dark:bg-terracotta/20',
  }

  return (
    <Link
      href={href}
      className={`card ${colorClasses[color]} transition-colors group`}
    >
      <Icon className="h-8 w-8 mb-2" />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm opacity-70 group-hover:opacity-90">{description}</p>
    </Link>
  )
}
