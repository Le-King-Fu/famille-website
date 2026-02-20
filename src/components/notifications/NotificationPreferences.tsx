'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, Mail, Loader2 } from 'lucide-react'

interface Preference {
  type: string
  pushEnabled: boolean
  emailEnabled: boolean
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

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled
          ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
          : checked
            ? 'bg-bleu'
            : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
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
      } else {
        setPermission(Notification.permission)
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setSubscribed(!!subscription)
      }

      // Always fetch preferences (needed for email toggles too)
      const response = await fetch('/api/push/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
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

        const prefResponse = await fetch('/api/push/preferences')
        if (prefResponse.ok) {
          const prefData = await prefResponse.json()
          const existingPrefs: Preference[] = prefData.preferences
          const hasAnyPushEnabled = existingPrefs.some((p) => p.pushEnabled)

          if (!hasAnyPushEnabled) {
            const allPushEnabled = Object.keys(TYPE_LABELS).map((type) => ({
              type,
              pushEnabled: true,
            }))

            await fetch('/api/push/preferences', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ preferences: allPushEnabled }),
            })

            setPreferences(
              existingPrefs.map((p) => ({ ...p, pushEnabled: true }))
            )
          } else {
            setPreferences(existingPrefs)
          }
        }
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

  const handleToggle = async (
    type: string,
    field: 'pushEnabled' | 'emailEnabled',
    value: boolean
  ) => {
    const previous = [...preferences]
    const updated = preferences.map((p) =>
      p.type === type ? { ...p, [field]: value } : p
    )
    setPreferences(updated)

    try {
      await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: [{ type, [field]: value }],
        }),
      })
    } catch (error) {
      console.error('Error updating preference:', error)
      setPreferences(previous)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-bleu" />
          Notifications
        </h3>
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </div>
      </div>
    )
  }

  const pushBlocked = permission === 'denied'
  const pushAvailable = supported && !pushBlocked

  return (
    <div className="card">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-bleu" />
        Notifications
      </h3>

      {/* Push subscription section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
          <Bell className="h-4 w-4" />
          Notifications push
        </h4>
        {!supported ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Non supportées par votre navigateur.
          </p>
        ) : pushBlocked ? (
          <p className="text-sm text-red-500">
            Bloquées par votre navigateur. Autorisez-les dans les paramètres de votre navigateur pour ce site.
          </p>
        ) : !subscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={toggling}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Activer les notifications push
          </button>
        ) : (
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
        )}
      </div>

      {/* Preferences table */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          Préférences par type
        </h4>

        {/* Header */}
        <div className="flex items-center justify-end gap-4 mb-2 pr-1">
          {pushAvailable && subscribed && (
            <span className="text-xs text-gray-500 dark:text-gray-400 w-11 text-center">
              Push
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 w-11 text-center flex items-center justify-center gap-1">
            <Mail className="h-3 w-3" />
            Email
          </span>
        </div>

        {/* Type rows */}
        <div className="space-y-3">
          {preferences
            .filter((p) => TYPE_LABELS[p.type])
            .map((pref) => (
              <div
                key={pref.type}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {TYPE_LABELS[pref.type]}
                </span>
                <div className="flex items-center gap-4">
                  {pushAvailable && subscribed && (
                    <Toggle
                      checked={pref.pushEnabled}
                      onChange={(val) =>
                        handleToggle(pref.type, 'pushEnabled', val)
                      }
                    />
                  )}
                  <Toggle
                    checked={pref.emailEnabled}
                    onChange={(val) =>
                      handleToggle(pref.type, 'emailEnabled', val)
                    }
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
