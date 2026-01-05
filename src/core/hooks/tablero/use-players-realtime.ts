'use client'

import type { TPlayer, User } from '@/src/core/lib/db/schema'
import { useRealtime } from '@/src/core/lib/realtime-client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

type PlayerWithUser = TPlayer & {
  user?: User | null
}

// Función para convertir datos de realtime a TPlayer
function mapPlayerFromRealtime (
  data: {
    id: string
    tableroId: string
    userId: string | null
    name: string
    balance: number
    isSystemPlayer: boolean
    systemPlayerType: string | null
    createdAt: string
    updatedAt: string
  },
  existingUser?: User | null
): PlayerWithUser {
  return {
    id: data.id,
    tableroId: data.tableroId,
    userId: data.userId,
    name: data.name,
    balance: data.balance,
    isSystemPlayer: data.isSystemPlayer ? 1 : 0,
    systemPlayerType: data.systemPlayerType,
    createdAt: parseInt(data.createdAt),
    updatedAt: parseInt(data.updatedAt),
    user: existingUser,
  }
}

interface UsePlayersRealtimeProps {
  tableroId: string
  initialPlayers: PlayerWithUser[]
  enabled?: boolean
}

export function usePlayersRealtime ({ tableroId, initialPlayers, enabled = true }: UsePlayersRealtimeProps): PlayerWithUser[] {
  const [players, setPlayers] = useState<PlayerWithUser[]>(initialPlayers)
  const playersRef = useRef(players)

  useEffect(() => {
    playersRef.current = players
  }, [players])

  const handlePlayerInserted = useCallback((data: {
    id: string
    tableroId: string
    userId: string | null
    name: string
    balance: number
    isSystemPlayer: boolean
    systemPlayerType: string | null
    createdAt: string
    updatedAt: string
  }) => {
    const currentPlayers = playersRef.current

    // Solo procesar si pertenece a este tablero
    if (data.tableroId !== tableroId) return

    const newPlayer = mapPlayerFromRealtime(data)
    if (!currentPlayers.some(p => p.id === newPlayer.id)) {
      if (!newPlayer.isSystemPlayer) {
        toast.success(`${newPlayer.name} se unió al tablero`, {
          position: 'top-center',
        })
      }
      setPlayers([...currentPlayers, newPlayer])
    }
  }, [tableroId])

  const handlePlayerUpdated = useCallback((data: {
    id: string
    tableroId: string
    userId: string | null
    name: string
    balance: number
    isSystemPlayer: boolean
    systemPlayerType: string | null
    createdAt: string
    updatedAt: string
  }) => {
    const currentPlayers = playersRef.current

    // Solo procesar si pertenece a este tablero
    if (data.tableroId !== tableroId) return

    const existingPlayer = currentPlayers.find(p => p.id === data.id)
    const updatedPlayer = mapPlayerFromRealtime(data, existingPlayer?.user)
    setPlayers(currentPlayers.map(p => p.id === updatedPlayer.id ? updatedPlayer : p))
  }, [tableroId])

  const handlePlayerDeleted = useCallback((data: { id: string }) => {
    const currentPlayers = playersRef.current
    const wasPlayer = currentPlayers.find(p => p.id === data.id)
    if (wasPlayer && !wasPlayer.isSystemPlayer) {
      toast.info(`${wasPlayer.name} salió del tablero`, {
        position: 'top-center',
      })
    }
    setPlayers(currentPlayers.filter(p => p.id !== data.id))
  }, [])

  useRealtime({
    enabled,
    channels: [`tablero-players:${tableroId}`],
    events: [
      'tablero.player.inserted',
      'tablero.player.updated',
      'tablero.player.deleted',
    ],
    onData ({ event, data, channel }) {
      if (channel !== `tablero-players:${tableroId}`) return

      switch (event) {
        case 'tablero.player.inserted':
          handlePlayerInserted(data as unknown as {
            id: string
            tableroId: string
            userId: string | null
            name: string
            balance: number
            isSystemPlayer: boolean
            systemPlayerType: string | null
            createdAt: string
            updatedAt: string
          })
          break
        case 'tablero.player.updated':
          handlePlayerUpdated(data as unknown as {
            id: string
            tableroId: string
            userId: string | null
            name: string
            balance: number
            isSystemPlayer: boolean
            systemPlayerType: string | null
            createdAt: string
            updatedAt: string
          })
          break
        case 'tablero.player.deleted':
          handlePlayerDeleted(data as unknown as { id: string })
          break
      }
    },
  })

  return players
}
