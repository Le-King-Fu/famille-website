export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { Trophy, Medal, Clock } from 'lucide-react'

const gameNames: Record<string, string> = {
  PIANO_HERO: 'Piano Hero',
  PIANO_HERO_V2: 'Piano Hero v2',
  WITCH_CASE: 'Langue de seeeerpent',
  BELLE_BETE_SAGE: 'Belle Bête Sage',
  TETE_DE_SOCCER: 'Tête de Soccer',
}

export default async function ClassementPage() {
  const scores = await db.gameScore.findMany({
    orderBy: { score: 'desc' },
    take: 50,
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  // Grouper par jeu
  const scoresByGame = scores.reduce(
    (acc, score) => {
      if (!acc[score.game]) {
        acc[score.game] = []
      }
      acc[score.game].push(score)
      return acc
    },
    {} as Record<string, typeof scores>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Trophy className="h-6 w-6 text-terracotta" />
        Classements
      </h1>

      {Object.entries(scoresByGame).length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(scoresByGame).map(([game, gameScores]) => (
            <div key={game} className="card">
              <h2 className="text-lg font-semibold mb-4">{gameNames[game]}</h2>
              <div className="space-y-2">
                {gameScores.slice(0, 10).map((score, index) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : index === 1
                              ? 'bg-gray-100 text-gray-600'
                              : index === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-medium">
                        {score.user.firstName} {score.user.lastName[0]}.
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-bleu">{score.score}</span>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(score.playedAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Medal className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Aucun score enregistré. Soyez le premier à jouer !
          </p>
        </div>
      )}
    </div>
  )
}
