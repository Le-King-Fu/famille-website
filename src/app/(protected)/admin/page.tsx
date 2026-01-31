export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Settings,
  Users,
  ShieldQuestion,
  Ticket,
  Image,
  MessageSquare,
} from 'lucide-react'

export default async function AdminPage() {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    redirect('/')
  }

  const [userCount, questionCount, codeCount, albumCount, topicCount] =
    await Promise.all([
      db.user.count(),
      db.securityQuestion.count(),
      db.invitationCode.count({ where: { isUsed: false } }),
      db.album.count(),
      db.topic.count(),
    ])

  const adminSections = [
    {
      title: 'Utilisateurs',
      description: 'Gérer les membres de la famille',
      icon: Users,
      href: '/admin/utilisateurs',
      count: userCount,
      color: 'bleu',
    },
    {
      title: 'Questions de sécurité',
      description: 'Configurer les questions du portail',
      icon: ShieldQuestion,
      href: '/admin/questions',
      count: questionCount,
      color: 'terracotta',
    },
    {
      title: "Codes d'invitation",
      description: 'Créer et gérer les invitations',
      icon: Ticket,
      href: '/admin/invitations',
      count: `${codeCount} actifs`,
      color: 'bleu',
    },
    {
      title: 'Albums photos',
      description: 'Gérer les albums et uploader des photos',
      icon: Image,
      href: '/admin/photos',
      count: albumCount,
      color: 'terracotta',
    },
    {
      title: 'Forum',
      description: 'Modérer les discussions',
      icon: MessageSquare,
      href: '/admin/forum',
      count: topicCount,
      color: 'bleu',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-bleu" />
        Administration
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="card hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div
                className={`p-3 rounded-lg ${
                  section.color === 'bleu' ? 'bg-bleu/10' : 'bg-terracotta/10'
                }`}
              >
                <section.icon
                  className={`h-6 w-6 ${
                    section.color === 'bleu' ? 'text-bleu' : 'text-terracotta'
                  }`}
                />
              </div>
              <span className="text-sm font-medium text-gray-400">
                {section.count}
              </span>
            </div>
            <h2 className="font-semibold mt-4 group-hover:text-bleu transition-colors">
              {section.title}
            </h2>
            <p className="text-gray-500 text-sm mt-1">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
