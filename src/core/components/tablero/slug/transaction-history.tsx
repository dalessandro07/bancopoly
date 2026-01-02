'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import { Button } from '@/src/core/components/ui/button'
import { ScrollArea } from '@/src/core/components/ui/scroll-area'
import type { TPlayer, TTransaction, User } from '@/src/core/lib/db/schema'
import { ArrowRightIcon, BanknoteIcon, FilterIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type PlayerWithUser = TPlayer & {
  user?: User | null
}

type EnrichedTransaction = TTransaction & {
  fromPlayer?: PlayerWithUser | null
  toPlayer?: PlayerWithUser | null
}

type FilterType = 'all' | 'sent' | 'received' | 'system'

export default function TransactionHistory({
  currentPlayerId,
  initialTransactions = []
}: {
  tableroId: string
  players: TPlayer[]
  currentPlayerId?: string
  initialTransactions?: EnrichedTransaction[]
}) {
  const [filter, setFilter] = useState<FilterType>('all')

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredTransactions = useMemo(() => {
    const isCurrentPlayerMatch = (playerId: string | null) => playerId === currentPlayerId

    if (filter === 'all') return initialTransactions

    return initialTransactions.filter((transaction) => {
      const isSender = isCurrentPlayerMatch(transaction.fromPlayerId)
      const isReceiver = isCurrentPlayerMatch(transaction.toPlayerId)
      const isSystem = transaction.fromPlayer?.isSystemPlayer || transaction.toPlayer?.isSystemPlayer

      if (filter === 'sent') return isSender
      if (filter === 'received') return isReceiver
      if (filter === 'system') return isSystem && !isSender && !isReceiver

      return true
    })
  }, [initialTransactions, filter, currentPlayerId])

  const isCurrentPlayer = (playerId: string | null) => playerId === currentPlayerId

  const transactions = filteredTransactions

  if (filteredTransactions.length === 0 && initialTransactions.length > 0) {
    return (
      <div className="flex flex-col h-full -mx-5 pb-20">
        <div className="px-5 pb-3 space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Historial</h2>
            <p className="text-sm text-muted-foreground">
              0 transacciones
              {filter !== 'all' && ` (${initialTransactions.length} total)`}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="h-8 text-xs"
            >
              Todas
            </Button>
            <Button
              variant={filter === 'sent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('sent')}
              className="h-8 text-xs"
            >
              Enviadas
            </Button>
            <Button
              variant={filter === 'received' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('received')}
              className="h-8 text-xs"
            >
              Recibidas
            </Button>
            <Button
              variant={filter === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('system')}
              className="h-8 text-xs"
            >
              Sistema
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-4">
            <FilterIcon className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No hay transacciones con este filtro</h2>
          <p className="text-muted-foreground text-sm text-center">
            Intenta con otro filtro
          </p>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-12">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-4">
          <BanknoteIcon className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sin transacciones</h2>
        <p className="text-muted-foreground text-sm text-center">
          Las transacciones aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full -mx-5 pb-20">
      <div className="px-5 pb-3 space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Historial</h2>
          <p className="text-sm text-muted-foreground">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transacción' : 'transacciones'}
            {filter !== 'all' && ` (${initialTransactions.length} total)`}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="h-8 text-xs"
          >
            Todas
          </Button>
          <Button
            variant={filter === 'sent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('sent')}
            className="h-8 text-xs"
          >
            Enviadas
          </Button>
          <Button
            variant={filter === 'received' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('received')}
            className="h-8 text-xs"
          >
            Recibidas
          </Button>
          <Button
            variant={filter === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('system')}
            className="h-8 text-xs"
          >
            Sistema
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 px-5 pb-24">
          <AnimatePresence>
            {transactions.map((transaction, index) => {
            const isSender = isCurrentPlayer(transaction.fromPlayerId)
            const isReceiver = isCurrentPlayer(transaction.toPlayerId)

            const fromPlayer = transaction.fromPlayer
            const toPlayer = transaction.toPlayer

            // Función para obtener solo el primer nombre en mobile
            const getFirstName = (name: string) => {
              return name.split(' ')[0]
            }

            // Determinar nombres para mostrar
            const fromNameFull = fromPlayer?.isSystemPlayer
              ? fromPlayer.systemPlayerType === 'bank'
                ? 'Banco'
                : fromPlayer.systemPlayerType === 'free_parking'
                ? 'Parada Libre'
                : fromPlayer.name
              : fromPlayer?.name || 'Desconocido'

            const toNameFull = toPlayer?.isSystemPlayer
              ? toPlayer.systemPlayerType === 'bank'
                ? 'Banco'
                : toPlayer.systemPlayerType === 'free_parking'
                ? 'Parada Libre'
                : toPlayer.name
              : toPlayer?.name || 'Desconocido'

            const fromName = getFirstName(fromNameFull)
            const toName = getFirstName(toNameFull)

            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className="p-4 rounded-xl border bg-card"
              >
                {/* Monto y Fecha */}
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-3xl font-bold ${
                    isSender ? 'text-destructive' : isReceiver ? 'text-green-500' : 'text-foreground'
                  }`}>
                    {isSender ? '-' : isReceiver ? '+' : ''}${transaction.amount.toLocaleString()}
                  </span>
                  <div className="text-xs font-medium text-muted-foreground">
                    {formatDate(transaction.createdAt)}
                  </div>
                </div>

                {/* Jugadores involucrados */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Jugador que envía */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className={`size-8 border-2 ${
                      isSender ? 'border-destructive' : 'border-muted'
                    }`}>
                      {fromPlayer?.user?.image ? (
                        <AvatarImage src={fromPlayer.user.image} alt={fromNameFull} />
                      ) : null}
                      <AvatarFallback className={`text-xs ${
                        isSender ? 'bg-destructive/10 text-destructive' : 'bg-muted'
                      }`}>
                        {fromNameFull.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isSender ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        <span className="md:hidden">{fromName}</span>
                        <span className="hidden md:inline">{fromNameFull}</span>
                      </p>
                    </div>
                  </div>

                  {/* Flecha */}
                  <ArrowRightIcon className={`size-5 flex-shrink-0 ${
                    isSender ? 'text-destructive' : isReceiver ? 'text-green-500' : 'text-muted-foreground'
                  }`} />

                  {/* Jugador que recibe */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 min-w-0 text-right">
                      <p className={`text-sm font-medium truncate ${
                        isReceiver ? 'text-green-500' : 'text-muted-foreground'
                      }`}>
                        <span className="md:hidden">{toName}</span>
                        <span className="hidden md:inline">{toNameFull}</span>
                      </p>
                    </div>
                    <Avatar className={`size-8 border-2 ${
                      isReceiver ? 'border-green-500' : 'border-muted'
                    }`}>
                      {toPlayer?.user?.image ? (
                        <AvatarImage src={toPlayer.user.image} alt={toNameFull} />
                      ) : null}
                      <AvatarFallback className={`text-xs ${
                        isReceiver ? 'bg-green-500/10 text-green-500' : 'bg-muted'
                      }`}>
                        {toNameFull.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Descripción si existe */}
                {transaction.description && (
                  <p className="text-sm text-foreground line-clamp-2 mt-3 p-3 bg-muted/50 rounded-lg">
                    {transaction.description}
                  </p>
                )}
              </motion.div>
            )
          })}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}
