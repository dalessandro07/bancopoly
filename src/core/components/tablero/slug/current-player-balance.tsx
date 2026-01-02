'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import type { TPlayer, User } from '@/src/core/lib/db/schema'
import { AnimatePresence, motion } from 'framer-motion'
import { WalletIcon } from 'lucide-react'
import { startTransition, useEffect, useRef, useState } from 'react'

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
      // El estado ya está inicializado correctamente, no necesitamos actualizarlo
      return
    }

    // Detectar cambio comparando con el ref en lugar del estado
    if (previousBalanceRef.current !== null && previousBalanceRef.current !== currentBalance) {
      const isIncrease = currentBalance > previousBalanceRef.current
      const previousBalance = previousBalanceRef.current

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
        previousBalanceRef.current = currentBalance
        startTransition(() => {
          setState({
            changed: false,
            isIncrease: false,
            previousBalance: currentBalance,
          })
        })
        timeoutRef.current = null
      }, 2000)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
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
  const currentPlayer = players.find(p => p.id === currentPlayerId)
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
    <motion.section
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl ${styles.cardBgClass} p-6 shadow-lg`}
    >
      <motion.div
        key={currentPlayer.balance}
        initial={balanceChange.changed ? { scale: 1.1 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, type: "spring" }}
        className="relative z-10 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={balanceChange.changed ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
              className={`p-3 rounded-full ${styles.iconBgClass}`}
            >
              <WalletIcon className={`size-6 ${styles.iconColor}`} />
            </motion.div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Tu saldo</h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentPlayer.balance}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={`text-4xl font-bold ${styles.balanceColor} transition-colors`}
                >
                  ${currentPlayer.balance.toLocaleString()}
                </motion.p>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                {balanceChange.changed && (
                  <motion.div
                    key={`change-${currentPlayer.balance}-${changeAmount}`}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.3 }}
                    className={`text-xs font-semibold mt-1 ${balanceChange.isIncrease ? 'text-green-500' : 'text-destructive'}`}
                  >
                    {balanceChange.isIncrease ? '↑' : '↓'} ${changeAmount.toLocaleString()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {currentPlayer.user && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Avatar className={`size-12 border-2 ${styles.avatarBorderClass}`}>
                <AvatarImage src={currentPlayer.user.image || undefined} alt={currentPlayer.name} />
                <AvatarFallback className={`${styles.avatarBgClass} font-semibold text-lg`}>
                  {currentPlayer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{currentPlayer.name}</span>
        </div>
      </motion.div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
    </motion.section>
  )
}
