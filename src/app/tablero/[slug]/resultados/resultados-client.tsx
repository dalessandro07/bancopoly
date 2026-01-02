'use client'

import { GameStatsCard } from '@/src/core/components/tablero/resultados/game-stats-card'
import { RankingCard } from '@/src/core/components/tablero/resultados/ranking-card'
import { ResultadosActions } from '@/src/core/components/tablero/resultados/resultados-actions'
import { StatsCards } from '@/src/core/components/tablero/resultados/stats-cards'
import type { TableroStats } from '@/src/core/components/tablero/resultados/types'
import { useConfetti } from '@/src/core/components/tablero/resultados/use-confetti'
import { WinnerCard } from '@/src/core/components/tablero/resultados/winner-card'

interface ResultadosClientProps {
  tableroName: string
  stats: TableroStats
  currentUserId: string | null
  tableroSlug: string
  isCreator: boolean
}

export default function ResultadosClient ({
  tableroName,
  stats,
  currentUserId,
  tableroSlug,
  isCreator,
}: ResultadosClientProps) {
  const winnerUserId = stats.winner.player.user?.id
  useConfetti(currentUserId, winnerUserId)

  const isWinner = currentUserId === winnerUserId

  return (
    <main className="p-5 flex flex-col h-full gap-6">
      <div>
        <h1 className="text-2xl font-bold">{tableroName}</h1>
        <p className="text-sm text-muted-foreground">Resultados finales</p>
      </div>

      <WinnerCard winner={stats.winner} isWinner={isWinner} />

      <RankingCard ranking={stats.ranking} currentUserId={currentUserId} />

      <StatsCards winner={stats.winner} loser={stats.loser} />

      <GameStatsCard
        totalTransactions={stats.totalTransactions}
        playersCount={stats.playersCount}
      />

      <ResultadosActions tableroSlug={tableroSlug} isCreator={isCreator} />
    </main>
  )
}
