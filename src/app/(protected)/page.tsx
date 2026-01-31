export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Calendar, Gamepad2, Image, MessageSquare, Trophy, Clock } from 'lucide-react'

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

  // Récupérer les derniers sujets du forum
  const recentTopics = await db.topic.findMany({
    orderBy: { lastReplyAt: 'desc' },
    take: 5,
    include: {
      author: {
        select: { firstName: true, lastName: true },
      },
      category: {
        select: { name: true },
      },
      _count: {
        select: { replies: true },
      },
    },
  })

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
                    <div className="text-xs text-gray-500">
                      {new Date(event.startDate).toLocaleDateString('fr-FR', {
                        month: 'short',
                      })}
                    </div>
                    <div className="text-lg font-bold text-bleu">
                      {new Date(event.startDate).getDate()}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-gray-500 text-xs">
                      par {event.createdBy.firstName}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Aucun événement à venir</p>
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
          {recentTopics.length > 0 ? (
            <ul className="space-y-3">
              {recentTopics.map((topic) => (
                <li key={topic.id} className="text-sm">
                  <Link
                    href={`/forum/${topic.category.name.toLowerCase()}/${topic.id}`}
                    className="font-medium text-gray-900 hover:text-bleu line-clamp-1"
                  >
                    {topic.title}
                  </Link>
                  <p className="text-gray-500 text-xs flex items-center gap-2">
                    <span>{topic.author.firstName}</span>
                    <span>•</span>
                    <span>{topic._count.replies} réponses</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Aucune discussion récente</p>
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
                    <p className="font-medium text-gray-900">
                      {score.user.firstName}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {gameNames[score.game]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-terracotta">{score.score}</p>
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(score.playedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Aucun score enregistré</p>
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
    bleu: 'bg-bleu/10 text-bleu hover:bg-bleu hover:text-white',
    terracotta:
      'bg-terracotta/10 text-terracotta hover:bg-terracotta hover:text-white',
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
