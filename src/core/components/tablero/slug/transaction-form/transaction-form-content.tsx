'use client'

import { actionCreateTransaction } from '@/src/core/actions/tablero'
import { Button } from '@/src/core/components/ui/button'
import { Input } from '@/src/core/components/ui/input'
import { Label } from '@/src/core/components/ui/label'
import type { TPlayer } from '@/src/core/lib/db/schema'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useMemo, useRef, useTransition, useState } from 'react'
import { toast } from 'sonner'
import { AmountInput } from './amount-input'
import { PlayerSelector } from './player-selector'
import { QuickAmountButtons } from './quick-amount-buttons'
import { TransactionAnimation } from '@/src/core/components/tablero/transaction-animation'

interface TransactionFormContentProps {
  tableroId: string
  players: TPlayer[]
  currentPlayerId?: string
  isCreator?: boolean
  fromPlayerId: string
  toPlayerId: string
  amount: string
  description: string
  isPending: boolean
  onFromPlayerChange: (value: string) => void
  onToPlayerChange: (value: string) => void
  onAmountChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSuccess: () => void
}

function TransactionFormContentComponent ({
  tableroId,
  players,
  currentPlayerId,
  isCreator = false,
  fromPlayerId,
  toPlayerId,
  amount,
  description,
  isPending,
  onFromPlayerChange,
  onToPlayerChange,
  onAmountChange,
  onDescriptionChange,
  onSuccess,
}: TransactionFormContentProps) {
  const [isSubmitting, startTransition] = useTransition()
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const isLoading = isPending || isSubmitting

  // Filtrar jugadores para el selector "Desde"
  const fromPlayers = useMemo(
    () =>
      players.filter((p) => {
        if (p.id === currentPlayerId) return true
        if (p.isSystemPlayer && isCreator) return true
        return false
      }),
    [players, currentPlayerId, isCreator]
  )

  // Determinar el jugador origen actual (para filtrar en "Hacia")
  const actualFromPlayerId = isCreator ? fromPlayerId : currentPlayerId

  // Obtener el jugador origen seleccionado
  const fromPlayer = useMemo(() => {
    if (!actualFromPlayerId) return null
    return players.find((p) => p.id === actualFromPlayerId)
  }, [players, actualFromPlayerId])

  // Verificar si el jugador origen es el banco
  const isFromBank = fromPlayer?.isSystemPlayer && fromPlayer?.systemPlayerType === 'bank'

  // Filtrar jugadores para el selector "Hacia"
  const toPlayers = useMemo(
    () => players.filter((p) => p.id !== actualFromPlayerId),
    [players, actualFromPlayerId]
  )

  // Handler para botones de acceso rápido
  const handleQuickAmount = useCallback(
    (quickAmount: number, quickDescription?: string) => {
      const currentAmount = parseFloat(amount) || 0
      const newAmount = currentAmount + quickAmount
      onAmountChange(newAmount.toString())
      if (quickDescription) {
        onDescriptionChange(quickDescription)
      }
    },
    [amount, onAmountChange, onDescriptionChange]
  )

  // Handler para cambiar fromPlayerId y resetear toPlayerId si es necesario
  const handleFromPlayerChange = useCallback(
    (value: string) => {
      onFromPlayerChange(value)
      // Si el toPlayerId actual es igual al nuevo fromPlayerId, resetearlo
      if (toPlayerId === value) {
        onToPlayerChange('')
      }
    },
    [toPlayerId, onFromPlayerChange, onToPlayerChange]
  )

  // Handler para cambiar toPlayerId
  const handleToPlayerChange = useCallback(
    (value: string) => {
      onToPlayerChange(value)
      // Si es creador y no hay fromPlayerId seleccionado, seleccionar automáticamente su jugador
      if (isCreator && !fromPlayerId && currentPlayerId) {
        onFromPlayerChange(currentPlayerId)
      }
    },
    [isCreator, fromPlayerId, currentPlayerId, onToPlayerChange, onFromPlayerChange]
  )

  // Acción del formulario
  const handleSubmit = useCallback(
    async (formData: FormData) => {
      startTransition(async () => {
        const result = await actionCreateTransaction(null, formData)

        if (result?.error) {
          toast.error(result.error)
          return
        }

        if (result?.success) {
          // Disparar animación
          setAnimationTrigger(prev => prev + 1)
          onSuccess()
          router.refresh()
        }
      })
    },
    [onSuccess, router]
  )

  return (
    <>
      <TransactionAnimation trigger={animationTrigger > 0} />
      <form
        ref={formRef}
        action={handleSubmit}
        className="flex flex-col gap-4 px-4 pb-8"
      >
      <input type="hidden" name="tableroId" value={tableroId} />

      <div className="space-y-2">
        <AmountInput
          amount={amount}
          onAmountChange={onAmountChange}
          disabled={isLoading}
        />
        <QuickAmountButtons
          onQuickAmount={handleQuickAmount}
          disabled={isLoading}
          showBankAmount={!!isFromBank}
        />
      </div>

      {isCreator ? (
        <PlayerSelector
          label="Desde:"
          name="fromPlayerId"
          value={fromPlayerId}
          players={fromPlayers}
          currentPlayerId={currentPlayerId}
          onValueChange={handleFromPlayerChange}
          disabled={isLoading}
          required
        />
      ) : (
        <input type="hidden" name="fromPlayerId" value={currentPlayerId || ''} />
      )}

      <PlayerSelector
        label="Hacia:"
        name="toPlayerId"
        value={toPlayerId}
        players={toPlayers}
        currentPlayerId={currentPlayerId}
        onValueChange={handleToPlayerChange}
        disabled={isLoading}
        required
      />

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional):</Label>
        <Input
          type="text"
          id="description"
          name="description"
          disabled={isLoading}
          placeholder="Concepto de la transferencia"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
        {isLoading ? 'Procesando...' : 'Transferir'}
      </Button>
    </form>
    </>
  )
}

export const TransactionFormContent = memo(TransactionFormContentComponent)
