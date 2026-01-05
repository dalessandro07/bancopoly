'use client'

import { Label } from '@/src/core/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/core/components/ui/select'
import type { TPlayer } from '@/src/core/lib/db/schema'
import { memo, useMemo } from 'react'

interface PlayerSelectorProps {
  label: string
  name: string
  value: string
  players: TPlayer[]
  currentPlayerId?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  placeholder?: string
}

function PlayerSelectorComponent({
  label,
  name,
  value,
  players,
  currentPlayerId,
  onValueChange,
  disabled,
  required,
  placeholder = 'Seleccionar jugador',
}: PlayerSelectorProps) {
  const formatBalance = (player: TPlayer) => {
    if (player.isSystemPlayer && player.systemPlayerType === 'bank') {
      return '∞'
    }
    return `$${player.balance}`
  }

  const formatPlayerOption = useMemo(
    () => (player: TPlayer) => {
      // Mostrar balance si es jugador del sistema o el jugador actual
      if (player.isSystemPlayer || player.id === currentPlayerId) {
        return `${player.name} (${formatBalance(player)})`
      }
      // Ocultar balance de otros jugadores
      return player.name
    },
    [currentPlayerId]
  )

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select
        name={name}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {players.map((player) => (
            <SelectItem key={player.id} value={player.id}>
              {formatPlayerOption(player)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export const PlayerSelector = memo(PlayerSelectorComponent)
