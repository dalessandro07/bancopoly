'use client'

import { ScrollArea } from '@/src/core/components/ui/scroll-area'
import type { TPlayer, TTransaction } from '@/src/core/lib/db/schema'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

type EnrichedTransaction = TTransaction & {
  fromPlayer?: TPlayer | null
  toPlayer?: TPlayer | null
}

export default function TransactionHistory ({
  currentPlayerId,
  initialTransactions = []
}: {
  tableroId: string
  players: TPlayer[]
  currentPlayerId?: string
  initialTransactions?: EnrichedTransaction[]
}) {
  const transactions = initialTransactions

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatBalance = (player: TPlayer | null | undefined) => {
    if (!player) return 'Desconocido'
    if (player.isSystemPlayer && player.systemPlayerType === 'bank') {
      return 'Banco'
    }
    return player.name
  }

  if (transactions.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Historial de transacciones</h2>
        <p className="text-muted-foreground text-sm">No hay transacciones aún</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Historial de transacciones</h2>
      <ScrollArea className="h-96 w-full rounded-md border">
        <div className="space-y-2 p-4">
          {transactions.map((transaction) => {
            const isSender = transaction.fromPlayerId === currentPlayerId
            const isReceiver = transaction.toPlayerId === currentPlayerId

            return (
              <div
                key={transaction.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card text-card-foreground"
              >
                <div className={`mt-1 ${isSender ? 'text-destructive' : 'text-green-600'}`}>
                  {isSender ? (
                    <ArrowUpIcon className="size-5" />
                  ) : (
                    <ArrowDownIcon className="size-5" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {isSender && transaction.toPlayer ? (
                        <>Enviaste a <span className="text-primary">{formatBalance(transaction.toPlayer)}</span></>
                      ) : isReceiver && transaction.fromPlayer ? (
                        <>Recibiste de <span className="text-primary">{formatBalance(transaction.fromPlayer)}</span></>
                      ) : (
                        <>Transacción del sistema</>
                      )}
                    </p>
                    <p className={`font-bold ${isSender ? 'text-destructive' : 'text-green-600'}`}>
                      {isSender ? '-' : '+'}${transaction.amount.toLocaleString()}
                    </p>
                  </div>

                  {transaction.description && (
                    <p className="text-sm text-muted-foreground">{transaction.description}</p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </section>
  )
}
