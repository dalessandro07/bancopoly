'use client'

import type { TPlayer } from '@/src/core/lib/db/schema'

export default function CurrentPlayerBalance ({
  players,
  currentPlayerId
}: {
  tableroId: string
  players: TPlayer[]
  currentPlayerId?: string
}) {
  // Obtener el balance actual del jugador
  const currentPlayer = players.find(p => p.id === currentPlayerId)

  if (!currentPlayer) {
    return null
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">Tu saldo</h2>
      <p className="text-4xl font-bold text-primary">${currentPlayer.balance.toLocaleString()}</p>
    </section>
  )
}
