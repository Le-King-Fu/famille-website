'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, AlertCircle, CheckCircle } from 'lucide-react'

interface SecurityQuestion {
  id: string
  question: string
}

export default function PortailPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<SecurityQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/security/questions')
      const data = await res.json()

      if (data.blocked) {
        setBlockedUntil(new Date(data.blockedUntil))
        setLoading(false)
        return
      }

      setQuestions(data.questions || [])
      setAttemptsLeft(data.attemptsLeft || 3)
    } catch {
      setError('Erreur lors du chargement des questions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    setError('')

    try {
      const res = await fetch('/api/security/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/connexion')
      } else if (data.blocked) {
        setBlockedUntil(new Date(data.blockedUntil))
      } else {
        setAttemptsLeft(data.attemptsLeft)
        setError(
          `Réponses incorrectes. ${data.attemptsLeft} tentative${data.attemptsLeft > 1 ? 's' : ''} restante${data.attemptsLeft > 1 ? 's' : ''}.`
        )
      }
    } catch {
      setError('Erreur lors de la vérification')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-bleu border-t-transparent" />
      </div>
    )
  }

  if (blockedUntil && blockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (blockedUntil.getTime() - Date.now()) / 1000 / 60
    )
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme px-4">
        <div className="card max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-terracotta mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Accès temporairement bloqué
          </h1>
          <p className="text-gray-600">
            Trop de tentatives incorrectes. Veuillez réessayer dans{' '}
            <strong>{minutesLeft} minute{minutesLeft > 1 ? 's' : ''}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-creme px-4 py-12">
      <div className="card max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-bleu/10 rounded-full mb-4">
            <Lock className="h-8 w-8 text-bleu" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue chez les Landry
          </h1>
          <p className="text-gray-600">
            Répondez à cette question pour accéder au site familial.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {q.question}
              </label>
              <input
                type="text"
                className="input"
                value={answers[q.id] || ''}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                placeholder="Votre réponse..."
                required
              />
            </div>
          ))}

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-gray-500">
              {attemptsLeft} tentative{attemptsLeft > 1 ? 's' : ''} restante
              {attemptsLeft > 1 ? 's' : ''}
            </span>
            <button
              type="submit"
              disabled={verifying || questions.length === 0}
              className="btn-primary"
            >
              {verifying ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Vérification...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Vérifier
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
