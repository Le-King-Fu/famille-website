'use client'

import { useState } from 'react'
import { X, Loader2, Shield, Phone, MapPin, Server, Users, Download } from 'lucide-react'

interface PrivacyConsentModalProps {
  onAccept: () => Promise<void>
  onCancel: () => void
}

export function PrivacyConsentModal({ onAccept, onCancel }: PrivacyConsentModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      await onAccept()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-bleu" />
            Protection de vos renseignements personnels
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Conformément à la Loi 25 sur la protection des renseignements personnels,
            nous vous informons des points suivants avant de sauvegarder vos coordonnées :
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="p-2 bg-bleu/10 rounded-lg">
                <Phone className="h-4 w-4 text-bleu" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Données collectées</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Numéro de téléphone et adresse postale
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="p-2 bg-bleu/10 rounded-lg">
                <Server className="h-4 w-4 text-bleu" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Hébergement</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supabase (solution open source) hébergé sur AWS au Canada
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="p-2 bg-bleu/10 rounded-lg">
                <Users className="h-4 w-4 text-bleu" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Accès aux données</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Uniquement les membres de la famille connectés au site
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="p-2 bg-bleu/10 rounded-lg">
                <Download className="h-4 w-4 text-bleu" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Utilisation</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export pour carnet de contacts personnel uniquement
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vous pouvez modifier ou supprimer vos coordonnées à tout moment depuis votre profil.
          </p>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "J'accepte"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
