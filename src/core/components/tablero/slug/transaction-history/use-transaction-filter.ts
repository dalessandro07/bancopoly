import { useMemo, useState } from 'react'
import type { TPlayer, TTransaction } from '@/src/core/lib/db/schema'

type PlayerWithUser = TPlayer & {
  user?: { id: string; name: string; email: string; image: string | null } | null
}

type EnrichedTransaction = TTransaction & {
  fromPlayer?: PlayerWithUser | null
  toPlayer?: PlayerWithUser | null
}

export type FilterType = 'all' | 'sent' | 'received' | 'bank' | 'free_parking'

export function useTransactionFilter (
  transactions: EnrichedTransaction[],
  currentPlayerId?: string
) {
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredTransactions = useMemo(() => {
    const isCurrentPlayerMatch = (playerId: string | null) => playerId === currentPlayerId

    if (filter === 'all') return transactions

    return transactions.filter((transaction) => {
      const isSender = isCurrentPlayerMatch(transaction.fromPlayerId)
      const isReceiver = isCurrentPlayerMatch(transaction.toPlayerId)
      
      const isFromBank = transaction.fromPlayer?.isSystemPlayer && transaction.fromPlayer?.systemPlayerType === 'bank'
      const isToBank = transaction.toPlayer?.isSystemPlayer && transaction.toPlayer?.systemPlayerType === 'bank'
      const isFromFreeParking = transaction.fromPlayer?.isSystemPlayer && transaction.fromPlayer?.systemPlayerType === 'free_parking'
      const isToFreeParking = transaction.toPlayer?.isSystemPlayer && transaction.toPlayer?.systemPlayerType === 'free_parking'

      if (filter === 'sent') return isSender
      if (filter === 'received') return isReceiver
      if (filter === 'bank') return (isFromBank || isToBank) && !isSender && !isReceiver
      if (filter === 'free_parking') return (isFromFreeParking || isToFreeParking) && !isSender && !isReceiver

      return true
    })
  }, [transactions, filter, currentPlayerId])

  return {
    filter,
    setFilter,
    filteredTransactions,
  }
}
