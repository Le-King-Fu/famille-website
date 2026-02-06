import Link from 'next/link'
import { Gamepad2, Music, Bug, Dog, Trophy } from 'lucide-react'

const games = [
  {
    id: 'piano-hero-v2',
    name: 'Héro du Piano',
    description: 'Notes qui tombent, appuyez sur les bonnes touches au bon moment. Système de vies et niveaux!',
    icon: Music,
    color: 'terracotta',
  },
  {
    id: 'belle-bete-sage',
    name: 'La Belle, la Bête et la Sage',
    description: 'Endless runner cyberpunk avec nos chiens ! Évitez les obstacles et collectez les pièces.',
    icon: Dog,
    color: 'bleu',
  },
  {
    id: 'witch-case',
    name: 'Langue de seeeerpent',
    description: 'Collectez les lettres pour épeler "LANDRY"',
    icon: Bug,
    color: 'terracotta',
  },
  // Coming soon:
  // {
  //   id: 'piano-hero',
  //   name: 'Piano Hero',
  //   description: 'Notes qui tombent, appuyez sur les bonnes touches au bon moment',
  //   icon: Music,
  //   color: 'bleu',
  // },
]

export default function JeuxPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-bleu" />
          Jeux
        </h1>
        <Link
          href="/jeux/classement"
          className="btn-outline flex items-center gap-2"
        >
          <Trophy className="h-4 w-4" />
          Classements
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/jeux/${game.id}`}
            className={`card hover:shadow-lg transition-shadow group ${
              game.color === 'bleu'
                ? 'hover:border-bleu border-2 border-transparent'
                : 'hover:border-terracotta border-2 border-transparent'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-lg ${
                  game.color === 'bleu' ? 'bg-bleu/10' : 'bg-terracotta/10'
                }`}
              >
                <game.icon
                  className={`h-8 w-8 ${
                    game.color === 'bleu' ? 'text-bleu' : 'text-terracotta'
                  }`}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold group-hover:text-bleu transition-colors">
                  {game.name}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{game.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
