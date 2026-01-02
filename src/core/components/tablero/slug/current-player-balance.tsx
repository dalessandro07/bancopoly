'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import type { TPlayer, User } from '@/src/core/lib/db/schema'
import { WalletIcon } from 'lucide-react'

type PlayerWithUser = TPlayer & {
  user?: User | null
}

export default function CurrentPlayerBalance ({
  players,
  currentPlayerId
}: {
  tableroId: string
  players: PlayerWithUser[]
  currentPlayerId?: string
}) {
  // Obtener el balance actual del jugador
  const currentPlayer = players.find(p => p.id === currentPlayerId)

  if (!currentPlayer) {
    return null
  }

  const isPositive = currentPlayer.balance >= 0
  const balanceColor = isPositive ? 'text-green-500' : 'text-destructive'
  const isLowBalance = currentPlayer.balance < 50 && currentPlayer.balance >= 0
  const cardBgClass = isLowBalance
    ? 'bg-gradient-to-br from-destructive/10 via-destructive/5 to-background border-2 border-destructive/20'
    : 'bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20'

  return (
    <section className={`relative overflow-hidden rounded-2xl ${cardBgClass} p-6 shadow-lg`}>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${isLowBalance ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <WalletIcon className={`size-6 ${isLowBalance ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Tu saldo</h2>
              <p className={`text-4xl font-bold ${balanceColor} transition-colors`}>
                ${currentPlayer.balance.toLocaleString()}
              </p>
            </div>
          </div>
          {currentPlayer.user && (
            <Avatar className={`size-12 border-2 ${isLowBalance ? 'border-destructive/20' : 'border-primary/20'}`}>
              <AvatarImage src={currentPlayer.user.image || undefined} alt={currentPlayer.name} />
              <AvatarFallback className={`${isLowBalance ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} font-semibold text-lg`}>
                {currentPlayer.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{currentPlayer.name}</span>
        </div>
      </div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
    </section>
  )
}
