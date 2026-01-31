export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import Link from 'next/link'
import { MessageSquare, ChevronRight } from 'lucide-react'

export default async function ForumPage() {
  const categories = await db.forumCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { topics: true },
      },
      topics: {
        orderBy: { lastReplyAt: 'desc' },
        take: 1,
        include: {
          author: {
            select: { firstName: true },
          },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-bleu" />
        Forum
      </h1>

      <div className="space-y-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/forum/${category.id}`}
            className="card hover:shadow-lg transition-shadow flex items-center justify-between group"
          >
            <div>
              <h2 className="font-semibold group-hover:text-bleu transition-colors">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-500 text-sm mt-1">
                  {category.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span>{category._count.topics} sujets</span>
                {category.topics[0] && (
                  <span>
                    Dernier: {category.topics[0].title.slice(0, 30)}...
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-bleu transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
