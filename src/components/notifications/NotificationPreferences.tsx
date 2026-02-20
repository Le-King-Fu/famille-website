'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

interface Preference {
  type: string
  pushEnabled: boolean
}

const TYPE_LABELS: Record<string, string> = {
  MENTION: 'Mentions (@)',
  QUOTE: 'Citations',
  TOPIC_REPLY: 'Réponses à vos sujets',
  NEW_EVENT: 'Nouveaux événements',
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function NotificationPreferences() {
  const [supported, setSupported] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [preferences, setPreferences] = useState<Preference[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const checkSubscription = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setSupported(false)
        setLoading(false)
        return
      }

      setPermission(Notification.permission)

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setSubscribed(!!subscription)

      // Fetch preferences from server
      const response = await fetch('/api/push/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error checking push subscription:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  const handleSubscribe = async () => {
    setToggling(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result !== 'granted') {
        setToggling(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('VAPID public key not configured')
        setToggling(false)
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      const subJson = subscription.toJSON()

      // Save subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      })

      if (response.ok) {
        setSubscribed(true)

        // Enable all notification types by default on first activation
        const allEnabled = Object.keys(TYPE_LABELS).map((type) => ({
          type,
          pushEnabled: true,
        }))

        await fetch('/api/push/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences: allEnabled }),
        })

        setPreferences(allEnabled)
      }
    } catch (error) {
      console.error('Error subscribing to push:', error)
    } finally {
      setToggling(false)
    }
  }

  const handleUnsubscribe = async () => {
    setToggling(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Remove from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        await subscription.unsubscribe()
      }

      setSubscribed(false)
    } catch (error) {
      console.error('Error unsubscribing from push:', error)
    } finally {
      setToggling(false)
    }
  }

  const handleToggleType = async (type: string, enabled: boolean) => {
    const updated = preferences.map((p) =>
      p.type === type ? { ...p, pushEnabled: enabled } : p
    )
    setPreferences(updated)

    try {
      await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: [{ type, pushEnabled: enabled }],
        }),
      })
    } catch (error) {
      console.error('Error updating preference:', error)
      // Revert on error
      setPreferences(preferences)
    }
  }

  if (!supported) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BellOff className="h-5 w-5 text-gray-400" />
          Notifications push
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Les notifications push ne sont pas supportées par votre navigateur.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-bleu" />
          Notifications push
        </h3>
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-bleu" />
        Notifications push
      </h3>

      {permission === 'denied' ? (
        <p className="text-sm text-red-500">
          Les notifications sont bloquées par votre navigateur. Veuillez les
          autoriser dans les paramètres de votre navigateur pour ce site.
        </p>
      ) : !subscribed ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Recevez des notifications même quand le site n&apos;est pas ouvert.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={toggling}
            className="btn-primary flex items-center gap-2"
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Activer les notifications push
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {preferences
              .filter((p) => TYPE_LABELS[p.type])
              .map((pref) => (
                <label
                  key={pref.type}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {TYPE_LABELS[pref.type]}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pref.pushEnabled}
                    onClick={() =>
                      handleToggleType(pref.type, !pref.pushEnabled)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      pref.pushEnabled
                        ? 'bg-bleu'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        pref.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              ))}
          </div>

          <button
            onClick={handleUnsubscribe}
            disabled={toggling}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            {toggling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <BellOff className="h-3 w-3" />
            )}
            Désactiver les notifications push
          </button>
        </div>
      )}
    </div>
  )
}
