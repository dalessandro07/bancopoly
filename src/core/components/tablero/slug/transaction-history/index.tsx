'use client'

import { ScrollArea } from '@/src/core/components/ui/scroll-area'
import type { TPlayer, TTransaction } from '@/src/core/lib/db/schema'
import { useTransactionFilter } from './use-transaction-filter'
import { TransactionFilterButtons } from './transaction-filter-buttons'
import { TransactionCard } from './transaction-card'
import { EmptyTransactionsState, EmptyFilteredState } from './empty-states'

type PlayerWithUser = TPlayer & {
  user?: { id: string; name: string; email: string; image: string | null } | null
}

type EnrichedTransaction = TTransaction & {
  fromPlayer?: PlayerWithUser | null
  toPlayer?: PlayerWithUser | null
}

interface TransactionHistoryProps {
  tableroId: string
  players: TPlayer[]
  currentPlayerId?: string
  initialTransactions?: EnrichedTransaction[]
}

export default function TransactionHistory ({
  currentPlayerId,
  initialTransactions = [],
}: TransactionHistoryProps) {
  const { filter, setFilter, filteredTransactions } = useTransactionFilter(
    initialTransactions,
    currentPlayerId
  )

  // Estado: Sin transacciones
  if (initialTransactions.length === 0) {
    return (
      <div className="flex flex-col h-full -mx-5 pb-20">
        <div className="px-5 pb-3 space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Historial</h2>
            <p className="text-sm text-muted-foreground">0 transacciones</p>
          </div>
        </div>
        <EmptyTransactionsState />
      </div>
    )
  }

  // Estado: Filtro sin resultados
  if (filteredTransactions.length === 0) {
    return (
      <div className="flex flex-col h-full -mx-5 pb-20">
        <div className="px-5 pb-3 space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Historial</h2>
            <p className="text-sm text-muted-foreground">
              0 transacciones ({initialTransactions.length} total)
            </p>
          </div>
          <TransactionFilterButtons filter={filter} onFilterChange={setFilter} />
        </div>
        <EmptyFilteredState />
      </div>
    )
  }

  // Estado: Con transacciones
  return (
    <div className="flex flex-col h-full -mx-5 pb-20">
      <div className="px-5 pb-3 space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Historial</h2>
          <p className="text-sm text-muted-foreground">
            {filteredTransactions.length}{' '}
            {filteredTransactions.length === 1 ? 'transacción' : 'transacciones'}
            {filter !== 'all' && ` (${initialTransactions.length} total)`}
          </p>
        </div>
        <TransactionFilterButtons filter={filter} onFilterChange={setFilter} />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 px-5 pb-24">
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              currentPlayerId={currentPlayerId}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
