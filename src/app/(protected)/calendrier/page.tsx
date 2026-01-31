import { auth } from '@/lib/auth'
import { Calendar as CalendarIcon } from 'lucide-react'
import { CalendarPage } from '@/components/calendar/CalendarPage'

export default async function CalendrierPage() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-6 w-6 text-bleu" />
        <h1 className="text-2xl font-bold">Calendrier familial</h1>
      </div>

      <CalendarPage
        userId={session.user.id}
        userRole={session.user.role}
      />
    </div>
  )
}
