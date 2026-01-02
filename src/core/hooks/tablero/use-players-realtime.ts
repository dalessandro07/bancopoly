'use client'

import type { TPlayer, User } from '@/src/core/lib/db/schema'
import { createClient } from '@/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

// Tipo para los datos raw de Postgres (snake_case)
interface RawPlayer {
  id: string
  tablero_id: string
  user_id: string | null
  name: string
  balance: number
  is_system_player: boolean
  system_player_type: string | null
  created_at: string
  updated_at: string
}

type RealtimePayload = RealtimePostgresChangesPayload<RawPlayer>

type PlayerWithUser = TPlayer & {
  user?: User | null
}

// Función para mapear snake_case a camelCase
function mapPlayer(raw: RawPlayer, existingUser?: User | null): PlayerWithUser {
  // Postgres devuelve timestamp sin timezone, lo interpretamos como UTC
  const createdAtUtc = raw.created_at.endsWith('Z')
    ? raw.created_at
    : `${raw.created_at}Z`
  const updatedAtUtc = raw.updated_at.endsWith('Z')
    ? raw.updated_at
    : `${raw.updated_at}Z`

  return {
    id: raw.id,
    tableroId: raw.tablero_id,
    userId: raw.user_id,
    name: raw.name,
    balance: raw.balance,
    isSystemPlayer: raw.is_system_player,
    systemPlayerType: raw.system_player_type,
    createdAt: new Date(createdAtUtc),
    updatedAt: new Date(updatedAtUtc),
    user: existingUser,
  }
}

interface UsePlayersRealtimeProps {
  tableroId: string
  initialPlayers: PlayerWithUser[]
  enabled?: boolean
}

export function usePlayersRealtime({ tableroId, initialPlayers, enabled = true }: UsePlayersRealtimeProps): PlayerWithUser[] {
  const supabase = createClient()
  const [players, setPlayers] = useState<PlayerWithUser[]>(initialPlayers)
  const playersRef = useRef(players)

  useEffect(() => {
    playersRef.current = players
  }, [players])

  const handlePlayerChange = useCallback((payload: RealtimePayload) => {
    const currentPlayers = playersRef.current

    if (payload.eventType === 'INSERT') {
      const newPlayer = mapPlayer(payload.new as RawPlayer)
      if (!currentPlayers.some(p => p.id === newPlayer.id)) {
        if (!newPlayer.isSystemPlayer) {
          toast.success(`${newPlayer.name} se unió al tablero`, {
            position: 'top-center',
          })
        }
        setPlayers([...currentPlayers, newPlayer])
      }
    }

    if (payload.eventType === 'DELETE') {
      const rawOld = payload.old as { id: string }
      const wasPlayer = currentPlayers.find(p => p.id === rawOld.id)
      if (wasPlayer && !wasPlayer.isSystemPlayer) {
        toast.info(`${wasPlayer.name} salió del tablero`, {
          position: 'top-center',
        })
      }
      setPlayers(currentPlayers.filter(p => p.id !== rawOld.id))
    }

    if (payload.eventType === 'UPDATE') {
      // Mantener la información del usuario existente al actualizar
      const existingPlayer = currentPlayers.find(p => p.id === (payload.new as RawPlayer).id)
      const updatedPlayer = mapPlayer(payload.new as RawPlayer, existingPlayer?.user)
      setPlayers(currentPlayers.map(p => p.id === updatedPlayer.id ? updatedPlayer : p))
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel(`tablero-players:${tableroId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player',
          filter: `tablero_id=eq.${tableroId}`,
        },
        handlePlayerChange
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableroId, supabase, handlePlayerChange, enabled])

  return players
}
