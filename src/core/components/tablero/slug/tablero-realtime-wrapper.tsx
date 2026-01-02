'use client'

import type { TPlayer, TTransaction, User } from '@/src/core/lib/db/schema'
import { useTableroRealtime } from '@/src/core/hooks/tablero/use-tablero-realtime'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import BottomNavigation, { type TabType } from './bottom-navigation'
import CurrentPlayerBalance from './current-player-balance'
import FormJoinTablero from '../form-join-tablero'
import PlayersList from './players-list'
import SettingsTab from './settings-tab'
import TransactionForm from './transaction-form'
import TransactionHistory from './transaction-history'

type PlayerWithUser = TPlayer & {
  user?: User | null
}

type EnrichedTransaction = TTransaction & {
  fromPlayer?: PlayerWithUser | null
  toPlayer?: PlayerWithUser | null
}

interface TableroRealtimeWrapperProps {
  tableroId: string
  tableroName: string
  initialPlayers: PlayerWithUser[]
  initialTransactions: EnrichedTransaction[]
  currentPlayerId?: string
  isCreator: boolean
  creator: User
}

export default function TableroRealtimeWrapper({
  tableroId,
  tableroName,
  initialPlayers,
  initialTransactions,
  currentPlayerId,
  isCreator,
  creator,
}: TableroRealtimeWrapperProps) {
  const router = useRouter()
  const [players, setPlayers] = useState<PlayerWithUser[]>(initialPlayers)
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>(initialTransactions)
  const [activeTab, setActiveTab] = useState<TabType>('inicio')
  const [isRemovedFromGame, setIsRemovedFromGame] = useState(false)
  const [unreadTransactions, setUnreadTransactions] = useState(0)
  // Estado para controlar el jugador preseleccionado en el formulario
  const [preselectedToPlayerId, setPreselectedToPlayerId] = useState<string | undefined>(undefined)
  const playersRef = useRef(players)

  // Mantener ref actualizado
  useEffect(() => {
    playersRef.current = players
  }, [players])

  // Agregar nueva transacción enriquecida al inicio de la lista
  const handleNewTransaction = useCallback((newTransaction: TTransaction) => {
    const currentPlayers = playersRef.current
    const enriched: EnrichedTransaction = {
      ...newTransaction,
      fromPlayer: newTransaction.fromPlayerId
        ? currentPlayers.find(p => p.id === newTransaction.fromPlayerId)
        : null,
      toPlayer: newTransaction.toPlayerId
        ? currentPlayers.find(p => p.id === newTransaction.toPlayerId)
        : null,
    }

    setTransactions(prev => {
      // Evitar duplicados
      if (prev.some(t => t.id === enriched.id)) {
        return prev
      }
      return [enriched, ...prev]
    })

    // Incrementar contador de transacciones no leídas si no estamos en la pestaña de historial
    setUnreadTransactions(prev => prev + 1)
  }, [])

  const handleBalanceChange = useCallback(() => {
    // El balance ya se actualiza a través de onPlayersChange
  }, [])

  // Cuando el jugador actual es eliminado del tablero
  const handleCurrentPlayerRemoved = useCallback(() => {
    setIsRemovedFromGame(true)
  }, [])

  // Cuando el tablero es eliminado
  const handleTableroDeleted = useCallback(() => {
    router.push('/')
  }, [router])

  // Cuando el tablero es cerrado
  const handleTableroClosed = useCallback(() => {
    router.push(`/tablero/${tableroId}/resultados`)
  }, [router, tableroId])

  // Resetear contador cuando se abre la pestaña de historial
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
    if (tab === 'historial') {
      setUnreadTransactions(0)
    }
  }, [])

  // Handler para cuando se hace clic en un jugador
  const handlePlayerClick = useCallback((playerId: string) => {
    setPreselectedToPlayerId(playerId)
  }, [])

  useTableroRealtime({
    tableroId,
    currentPlayerId,
    onPlayersChange: setPlayers,
    onTransactionsChange: handleNewTransaction,
    onBalanceChange: handleBalanceChange,
    onCurrentPlayerRemoved: handleCurrentPlayerRemoved,
    onTableroDeleted: handleTableroDeleted,
    onTableroClosed: handleTableroClosed,
    players,
  })

  // Si el jugador fue eliminado, mostrar formulario para unirse
  if (isRemovedFromGame) {
    return (
      <div className="flex flex-col h-full">
        <FormJoinTablero tableroId={tableroId} />

        <div className="mt-6">
          <PlayersList
            tableroId={tableroId}
            players={players}
            isCreator={false}
            currentPlayerId={undefined}
            enableRealtime={false}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full pb-20">
      {activeTab === 'inicio' && (
        <div className="flex flex-col gap-6 pb-24">
          <CurrentPlayerBalance
            tableroId={tableroId}
            players={players}
            currentPlayerId={currentPlayerId}
          />

          <div className="space-y-4">
            <PlayersList
              tableroId={tableroId}
              players={players}
              isCreator={isCreator}
              currentPlayerId={currentPlayerId}
              onPlayerClick={handlePlayerClick}
            />
          </div>

          <TransactionForm
            tableroId={tableroId}
            players={players}
            currentPlayerId={currentPlayerId}
            isCreator={isCreator}
            preselectedToPlayerId={preselectedToPlayerId}
            onOpenChange={(open) => {
              if (!open) {
                setPreselectedToPlayerId(undefined)
              }
            }}
          />
        </div>
      )}

      {activeTab === 'historial' && (
        <TransactionHistory
          tableroId={tableroId}
          players={players}
          currentPlayerId={currentPlayerId}
          initialTransactions={transactions}
        />
      )}

      {activeTab === 'configuracion' && (
        <SettingsTab
          tableroId={tableroId}
          tableroName={tableroName}
          creator={creator}
          players={players}
          isCreator={isCreator}
          isPlayer={true}
        />
      )}

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        unreadCount={unreadTransactions}
      />
    </div>
  )
}
