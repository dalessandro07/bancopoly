'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import type { TPlayer, User } from '@/src/core/lib/db/schema'
import { WalletIcon } from 'lucide-react'
import { startTransition, useEffect, useMemo, useRef, useState } from 'react'

type PlayerWithUser = TPlayer & {
  user?: User | null
}

interface BalanceChangeState {
  changed: boolean
  isIncrease: boolean
  previousBalance: number | null
}

// Hook personalizado para detectar cambios en el balance
function useBalanceChange (currentBalance: number | null) {
  const [state, setState] = useState<BalanceChangeState>({
    changed: false,
    isIncrease: false,
    previousBalance: currentBalance ?? null,
  })
  const isInitializedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousBalanceRef = useRef<number | null>(currentBalance ?? null)

  useEffect(() => {
    if (currentBalance === null) {
      return
    }

    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      previousBalanceRef.current = currentBalance
      // Actualizar el estado inicial
      startTransition(() => {
        setState({
          changed: false,
          isIncrease: false,
          previousBalance: currentBalance,
        })
      })
      return
    }

    // Detectar cambio comparando con el ref en lugar del estado
    if (previousBalanceRef.current !== null && previousBalanceRef.current !== currentBalance) {
      const isIncrease = currentBalance > previousBalanceRef.current
      const previousBalance = previousBalanceRef.current

      // Actualizar el ref después de detectar el cambio, pero antes de activar la animación
      // para evitar detectar el mismo cambio múltiples veces
      previousBalanceRef.current = currentBalance

      // Usar startTransition para marcar el cambio
      startTransition(() => {
        setState({
          changed: true,
          isIncrease,
          previousBalance,
        })
      })

      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Actualizar después de un delay para que la animación se muestre
      timeoutRef.current = setTimeout(() => {
        startTransition(() => {
          setState({
            changed: false,
            isIncrease: false,
            previousBalance: currentBalance,
          })
        })
        timeoutRef.current = null
      }, 2000)
    } else if (previousBalanceRef.current !== currentBalance) {
      // Si el balance cambió pero no se detectó antes (por ejemplo, si se actualizó directamente)
      // Actualizar el ref para mantener la sincronización
      previousBalanceRef.current = currentBalance
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [currentBalance])

  return state
}

// Helper para obtener estilos según el balance
function getBalanceStyles (balance: number) {
  const isPositive = balance >= 0
  const isLowBalance = balance < 50 && balance >= 0

  return {
    balanceColor: isPositive ? 'text-green-500' : 'text-destructive',
    cardBgClass: isLowBalance
      ? 'bg-gradient-to-br from-destructive/10 via-destructive/5 to-background border-2 border-destructive/20'
      : 'bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20',
    iconBgClass: isLowBalance ? 'bg-destructive/10' : 'bg-primary/10',
    iconColor: isLowBalance ? 'text-destructive' : 'text-primary',
    avatarBorderClass: isLowBalance ? 'border-destructive/20' : 'border-primary/20',
    avatarBgClass: isLowBalance ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
    isLowBalance,
  }
}

export default function CurrentPlayerBalance ({
  players,
  currentPlayerId
}: {
  tableroId: string
  players: PlayerWithUser[]
  currentPlayerId?: string
}) {
  // Usar useMemo para asegurar que se actualice cuando cambia el array de jugadores
  const currentPlayer = useMemo(
    () => players.find(p => p.id === currentPlayerId),
    [players, currentPlayerId]
  )
  const currentBalance = currentPlayer?.balance ?? null
  const balanceChange = useBalanceChange(currentBalance)

  if (!currentPlayer) {
    return null
  }

  const styles = getBalanceStyles(currentPlayer.balance)
  const changeAmount = balanceChange.previousBalance !== null
    ? Math.abs(currentPlayer.balance - balanceChange.previousBalance)
    : 0

  return (
    <section
      className={`relative overflow-hidden rounded-2xl ${styles.cardBgClass} p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300`}
    >
      <div
        key={currentPlayer.balance}
        className={`relative z-10 space-y-4 transition-transform ${balanceChange.changed ? 'scale-105' : 'scale-100'}`}
        style={{ transitionDuration: '300ms' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-full ${styles.iconBgClass} transition-transform ${balanceChange.changed ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
            >
              <WalletIcon className={`size-6 ${styles.iconColor}`} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Tu saldo</h2>
              <p
                key={currentPlayer.balance}
                className={`text-4xl font-bold ${styles.balanceColor} transition-all duration-200 animate-in fade-in slide-in-from-top-2`}
              >
                ${currentPlayer.balance.toLocaleString()}
              </p>
              {balanceChange.changed && (
                <div
                  key={`change-${currentPlayer.balance}-${changeAmount}`}
                  className={`text-xs font-semibold mt-1 animate-in fade-in slide-in-from-top-1 duration-300 ${balanceChange.isIncrease ? 'text-green-500' : 'text-destructive'}`}
                >
                  {balanceChange.isIncrease ? '↑' : '↓'} ${changeAmount.toLocaleString()}
                </div>
              )}
            </div>
          </div>
          {currentPlayer.user && (
            <div className="transition-transform hover:scale-105 active:scale-95">
              <Avatar className={`size-12 border-2 ${styles.avatarBorderClass}`}>
                <AvatarImage src={currentPlayer.user.image || undefined} alt={currentPlayer.name} />
                <AvatarFallback className={`${styles.avatarBgClass} font-semibold text-lg`}>
                  {currentPlayer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
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
