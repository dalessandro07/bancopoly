'use client'

import type { TPlayer, TTransaction, User } from '@/src/core/lib/db/schema'
import { createClient } from '@/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

type PlayerWithUser = TPlayer & {
  user?: User | null
}

type RealtimePayload<T extends Record<string, unknown>> = RealtimePostgresChangesPayload<T>

// Tipos para los datos raw de Postgres (snake_case)
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
  [key: string]: unknown
}

interface RawTransaction {
  id: string
  tablero_id: string
  from_player_id: string | null
  to_player_id: string | null
  amount: number
  type: string
  description: string | null
  created_at: string
  [key: string]: unknown
}

// Funciones para mapear snake_case a camelCase
function mapPlayer (raw: RawPlayer): TPlayer {
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
  }
}

function mapTransaction (raw: RawTransaction): TTransaction {
  // Postgres devuelve timestamp sin timezone, lo interpretamos como UTC
  const createdAtUtc = raw.created_at.endsWith('Z')
    ? raw.created_at
    : `${raw.created_at}Z`

  return {
    id: raw.id,
    tableroId: raw.tablero_id,
    fromPlayerId: raw.from_player_id,
    toPlayerId: raw.to_player_id,
    amount: raw.amount,
    type: raw.type,
    description: raw.description,
    createdAt: new Date(createdAtUtc),
  }
}

interface UseTableroRealtimeProps {
  tableroId: string
  currentPlayerId?: string
  onPlayersChange: (players: TPlayer[]) => void
  onTransactionsChange: (transaction: TTransaction) => void
  onBalanceChange: (playerId: string, newBalance: number) => void
  onCurrentPlayerRemoved?: () => void
  onTableroDeleted?: () => void
  onTableroClosed?: () => void
  onTransactionReceived?: (transaction: { amount: number; fromName: string; description?: string | null }) => void
  players: TPlayer[]
}

export function useTableroRealtime ({
  tableroId,
  currentPlayerId,
  onPlayersChange,
  onTransactionsChange,
  onBalanceChange,
  onCurrentPlayerRemoved,
  onTableroDeleted,
  onTableroClosed,
  onTransactionReceived,
  players,
}: UseTableroRealtimeProps) {
  const supabase = createClient()
  const playersRef = useRef(players)
  const processedTransactionsRef = useRef<Set<string>>(new Set())

  // Mantener refs actualizados
  useEffect(() => {
    playersRef.current = players
  }, [players])

  const handlePlayerChange = useCallback((payload: RealtimePayload<RawPlayer>) => {
    const currentPlayers = playersRef.current

    if (payload.eventType === 'INSERT') {
      const newPlayer = mapPlayer(payload.new as RawPlayer)
      // Evitar duplicados
      if (!currentPlayers.some(p => p.id === newPlayer.id)) {
        if (!newPlayer.isSystemPlayer) {
          toast.success(`${newPlayer.name} se unió al tablero`, {
            position: 'top-center',
          })
        }
        onPlayersChange([...currentPlayers, newPlayer])
      }
    }

    if (payload.eventType === 'DELETE') {
      const rawOld = payload.old as { id: string }
      const wasPlayer = currentPlayers.find(p => p.id === rawOld.id)

      // Verificar si el jugador eliminado es el actual
      if (rawOld.id === currentPlayerId) {
        toast.error('Has sido eliminado del tablero', {
          position: 'top-center',
        })
        onCurrentPlayerRemoved?.()
        return
      }

      if (wasPlayer && !wasPlayer.isSystemPlayer) {
        toast.info(`${wasPlayer.name} salió del tablero`, {
          position: 'top-center',
        })
      }
      onPlayersChange(currentPlayers.filter(p => p.id !== rawOld.id))
    }

    if (payload.eventType === 'UPDATE') {
      // Mantener la información del usuario existente al actualizar
      const existingPlayer = currentPlayers.find(p => p.id === (payload.new as RawPlayer).id)
      const updatedPlayer = mapPlayer(payload.new as RawPlayer)

      // Preservar la información del usuario si existe (para PlayerWithUser)
      // Necesitamos verificar si el jugador existente tiene la propiedad 'user'
      let playerWithUser: TPlayer | PlayerWithUser = updatedPlayer
      if (existingPlayer && 'user' in existingPlayer) {
        playerWithUser = {
          ...updatedPlayer,
          user: (existingPlayer as PlayerWithUser).user
        }
      }

      // Actualizar el estado de jugadores con el nuevo balance
      // Crear un nuevo array y nuevos objetos para asegurar que React detecte el cambio
      const updatedPlayers = currentPlayers.map(p => {
        if (p.id === playerWithUser.id) {
          // Crear un nuevo objeto para el jugador actualizado
          // Esto asegura que React detecte el cambio
          return { ...playerWithUser }
        }
        // Mantener los demás jugadores como están
        return p
      })

      // Verificar si hay un cambio en el balance
      const existingBalance = existingPlayer?.balance
      const newBalance = playerWithUser.balance
      const balanceChanged = existingBalance !== newBalance

      // Siempre actualizar el estado para reflejar cualquier cambio en el jugador
      onPlayersChange(updatedPlayers)

      // Notificar cambio de balance solo si realmente cambió
      if (balanceChanged) {
        onBalanceChange(playerWithUser.id, playerWithUser.balance)
      }
    }
  }, [currentPlayerId, onPlayersChange, onBalanceChange, onCurrentPlayerRemoved])

  const handleTransactionChange = useCallback((payload: RealtimePayload<RawTransaction>) => {
    const currentPlayers = playersRef.current

    if (payload.eventType === 'INSERT') {
      const newTransaction = mapTransaction(payload.new as RawTransaction)

      // Evitar duplicados usando un Set
      if (processedTransactionsRef.current.has(newTransaction.id)) {
        return
      }
      processedTransactionsRef.current.add(newTransaction.id)

      const isSender = newTransaction.fromPlayerId === currentPlayerId
      const isReceiver = newTransaction.toPlayerId === currentPlayerId

      // Verificar si involucra banco o parada libre
      const fromPlayer = currentPlayers.find(p => p.id === newTransaction.fromPlayerId)
      const toPlayer = currentPlayers.find(p => p.id === newTransaction.toPlayerId)

      const isFromBank = fromPlayer?.isSystemPlayer && fromPlayer?.systemPlayerType === 'bank'
      const isToBank = toPlayer?.isSystemPlayer && toPlayer?.systemPlayerType === 'bank'
      const isFromFreeParking = fromPlayer?.isSystemPlayer && fromPlayer?.systemPlayerType === 'free_parking'
      const isToFreeParking = toPlayer?.isSystemPlayer && toPlayer?.systemPlayerType === 'free_parking'

      const involvesSystemPlayer = isFromBank || isToBank || isFromFreeParking || isToFreeParking

      // Mostrar card animada y confetti para el receptor
      if (isReceiver) {
        const fromName = isFromBank
          ? 'Banco'
          : isFromFreeParking
            ? 'Parada Libre'
            : fromPlayer?.name || 'Desconocido'

        // Mostrar card animada inmersiva
        onTransactionReceived?.({
          amount: newTransaction.amount,
          fromName,
          description: newTransaction.description,
        })

        // También mostrar toast pequeño (opcional, puede removerse)
        toast.success(`Recibiste $${newTransaction.amount.toLocaleString()} de ${fromName}`, {
          position: 'top-center',
          duration: 2000,
        })
      }

      // Mostrar toast para el enviador
      if (isSender) {
        const toName = isToBank
          ? 'Banco'
          : isToFreeParking
            ? 'Parada Libre'
            : toPlayer?.name || 'Desconocido'

        toast.info(`Enviaste $${newTransaction.amount.toLocaleString()} a ${toName}`, {
          position: 'top-center',
        })
      }

      // Si involucra banco o parada libre, mostrar toast para todos los demás jugadores
      if (involvesSystemPlayer && !isSender && !isReceiver) {
        const fromName = isFromBank
          ? 'Banco'
          : isFromFreeParking
            ? 'Parada Libre'
            : fromPlayer?.name || 'Desconocido'

        const toName = isToBank
          ? 'Banco'
          : isToFreeParking
            ? 'Parada Libre'
            : toPlayer?.name || 'Desconocido'

        const action = isFromBank || isFromFreeParking ? 'pagó' : 'envió'
        toast.info(`${fromName} ${action} $${newTransaction.amount.toLocaleString()} a ${toName}`, {
          position: 'top-center',
        })
      }

      // Pasar la nueva transacción para que el wrapper la enriquezca y agregue
      onTransactionsChange(newTransaction)
    }
  }, [currentPlayerId, onTransactionsChange, onTransactionReceived])

  // Handler para cuando el tablero es eliminado o cerrado
  const handleTableroChange = useCallback((payload: RealtimePostgresChangesPayload<{ id: string; is_ended: boolean }>) => {
    if (payload.eventType === 'DELETE') {
      toast.error('El tablero ha sido eliminado', {
        position: 'top-center',
      })
      onTableroDeleted?.()
    }

    if (payload.eventType === 'UPDATE') {
      const newData = payload.new as { is_ended: boolean }
      const oldData = payload.old as { is_ended: boolean }

      // Si el tablero fue cerrado (isEnded cambió de false a true)
      if (!oldData.is_ended && newData.is_ended) {
        toast.success('El tablero ha sido cerrado. Redirigiendo a resultados...', {
          position: 'top-center',
        })
        onTableroClosed?.()
      }
    }
  }, [onTableroDeleted, onTableroClosed])

  useEffect(() => {
    const channel = supabase
      .channel(`tablero:${tableroId}`)
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transaction',
          filter: `tablero_id=eq.${tableroId}`,
        },
        handleTransactionChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tablero',
          filter: `id=eq.${tableroId}`,
        },
        handleTableroChange
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableroId, supabase, handlePlayerChange, handleTransactionChange, handleTableroChange])
}
