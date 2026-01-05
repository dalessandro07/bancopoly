'use client'

import type { TPlayer, TTransaction } from '@/src/core/lib/db/schema'
import { useRealtime } from '@/src/core/lib/realtime-client'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

type PlayerWithUser = TPlayer & {
  user?: { id: string; name: string; email: string; image: string | null } | null
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

// Función para convertir datos de realtime a TPlayer
function mapPlayerFromRealtime (data: {
  id: string
  tableroId: string
  userId: string | null
  name: string
  balance: number
  isSystemPlayer: boolean
  systemPlayerType: string | null
  createdAt: string
  updatedAt: string
}): TPlayer {
  return {
    id: data.id,
    tableroId: data.tableroId,
    userId: data.userId,
    name: data.name,
    balance: data.balance,
    isSystemPlayer: data.isSystemPlayer ? 1 : 0,
    systemPlayerType: data.systemPlayerType,
    createdAt: Date.parse(data.createdAt),
    updatedAt: Date.parse(data.updatedAt),
  }
}

// Función para convertir datos de realtime a TTransaction
function mapTransactionFromRealtime (data: {
  id: string
  tableroId: string
  fromPlayerId: string | null
  toPlayerId: string | null
  amount: number
  type: string
  description: string | null
  createdAt: string
}): TTransaction {
  return {
    id: data.id,
    tableroId: data.tableroId,
    fromPlayerId: data.fromPlayerId,
    toPlayerId: data.toPlayerId,
    amount: data.amount,
    type: data.type,
    description: data.description,
    createdAt: Date.parse(data.createdAt),
  }
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
  const playersRef = useRef(players)
  const processedTransactionsRef = useRef<Set<string>>(new Set())

  // Mantener refs actualizados
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
    const newPlayer = mapPlayerFromRealtime(data)

    // Solo procesar si pertenece a este tablero
    if (newPlayer.tableroId !== tableroId) return

    // Evitar duplicados
    if (!currentPlayers.some(p => p.id === newPlayer.id)) {
      if (!newPlayer.isSystemPlayer) {
        toast.success(`${newPlayer.name} se unió al tablero`, {
          position: 'top-center',
        })
      }
      onPlayersChange([...currentPlayers, newPlayer])
    }
  }, [tableroId, onPlayersChange])

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
    const updatedPlayer = mapPlayerFromRealtime(data)

    // Mantener la información del usuario existente al actualizar
    let playerWithUser: TPlayer | PlayerWithUser = updatedPlayer
    if (existingPlayer && 'user' in existingPlayer) {
      playerWithUser = {
        ...updatedPlayer,
        user: (existingPlayer as PlayerWithUser).user
      }
    }

    // Actualizar el estado de jugadores
    const updatedPlayers = currentPlayers.map(p => {
      if (p.id === playerWithUser.id) {
        return { ...playerWithUser }
      }
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
  }, [tableroId, onPlayersChange, onBalanceChange])

  const handlePlayerDeleted = useCallback((data: { id: string }) => {
    const currentPlayers = playersRef.current
    const wasPlayer = currentPlayers.find(p => p.id === data.id)

    // Verificar si el jugador eliminado es el actual
    if (data.id === currentPlayerId) {
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
    onPlayersChange(currentPlayers.filter(p => p.id !== data.id))
  }, [currentPlayerId, onPlayersChange, onCurrentPlayerRemoved])

  const handleTransactionInserted = useCallback((data: {
    id: string
    tableroId: string
    fromPlayerId: string | null
    toPlayerId: string | null
    amount: number
    type: string
    description: string | null
    createdAt: string
  }) => {
    const currentPlayers = playersRef.current

    // Solo procesar si pertenece a este tablero
    if (data.tableroId !== tableroId) return

    const newTransaction = mapTransactionFromRealtime(data)

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

      // También mostrar toast pequeño
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
  }, [tableroId, currentPlayerId, onTransactionsChange, onTransactionReceived])

  const handleTableroUpdated = useCallback((data: { id: string; isEnded: boolean }) => {
    if (data.id !== tableroId) return

    // Si el tablero fue cerrado
    if (data.isEnded) {
      toast.success('El tablero ha sido cerrado. Redirigiendo a resultados...', {
        position: 'top-center',
      })
      onTableroClosed?.()
    }
  }, [tableroId, onTableroClosed])

  const handleTableroDeleted = useCallback((data: { id: string }) => {
    if (data.id !== tableroId) return

    toast.error('El tablero ha sido eliminado', {
      position: 'top-center',
    })
    onTableroDeleted?.()
  }, [tableroId, onTableroDeleted])

  // Suscribirse a eventos de realtime usando canales específicos del tablero
  useRealtime({
    channels: [`tablero:${tableroId}`],
    events: [
      'tablero.player.inserted',
      'tablero.player.updated',
      'tablero.player.deleted',
      'tablero.transaction.inserted',
      'tablero.tablero.updated',
      'tablero.tablero.deleted',
    ],
    onData ({ event, data, channel }) {
      if (channel !== `tablero:${tableroId}`) return

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
        case 'tablero.transaction.inserted':
          handleTransactionInserted(data as unknown as {
            id: string
            tableroId: string
            fromPlayerId: string | null
            toPlayerId: string | null
            amount: number
            type: string
            description: string | null
            createdAt: string
          })
          break
        case 'tablero.tablero.updated':
          handleTableroUpdated(data as unknown as { id: string; isEnded: boolean })
          break
        case 'tablero.tablero.deleted':
          handleTableroDeleted(data as unknown as { id: string })
          break
      }
    },
  })
}
