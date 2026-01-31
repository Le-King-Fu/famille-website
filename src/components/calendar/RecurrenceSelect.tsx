'use client'

import { RecurrenceRule, recurrenceOptions, describeRecurrence } from '@/lib/recurrence'
import { Repeat } from 'lucide-react'

interface RecurrenceSelectProps {
  value: RecurrenceRule | null
  onChange: (recurrence: RecurrenceRule | null) => void
}

export function RecurrenceSelect({ value, onChange }: RecurrenceSelectProps) {
  const currentLabel = describeRecurrence(value)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <Repeat className="inline h-4 w-4 mr-1" />
        Récurrence
      </label>
      <select
        value={JSON.stringify(value)}
        onChange={(e) => {
          const parsed = e.target.value === 'null' ? null : JSON.parse(e.target.value)
          onChange(parsed)
        }}
        className="input"
      >
        {recurrenceOptions.map((option, index) => (
          <option key={index} value={JSON.stringify(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
      {value && (
        <p className="text-xs text-gray-500">
          Cet événement {currentLabel.toLowerCase()}
        </p>
      )}
    </div>
  )
}
