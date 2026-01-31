export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { User, Mail, Calendar, Trophy } from 'lucide-react'

export default async function ProfilPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          gameScores: true,
          topics: true,
          replies: true,
        },
      },
    },
  })

  if (!user) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <User className="h-6 w-6 text-bleu" />
        Mon profil
      </h1>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-bleu/10 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-bleu">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-500 capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-600">
            <Mail className="h-5 w-5 text-gray-400" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span>
              Membre depuis le{' '}
              {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-terracotta" />
          Statistiques
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-bleu">
              {user._count.gameScores}
            </div>
            <div className="text-sm text-gray-500">Parties jouées</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-bleu">
              {user._count.topics}
            </div>
            <div className="text-sm text-gray-500">Sujets créés</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-bleu">
              {user._count.replies}
            </div>
            <div className="text-sm text-gray-500">Réponses</div>
          </div>
        </div>
      </div>
    </div>
  )
}
