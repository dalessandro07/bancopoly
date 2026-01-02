'use client'

import { actionCreateTransaction } from '@/src/core/actions/tablero'
import { Button } from '@/src/core/components/ui/button'
import { Input } from '@/src/core/components/ui/input'
import { Label } from '@/src/core/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/core/components/ui/select'
import type { TPlayer } from '@/src/core/lib/db/schema'
import { useActionState, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export default function TransactionForm ({
  tableroId,
  players,
  currentPlayerId,
  isCreator = false
}: {
  tableroId: string
  players: TPlayer[]
  currentPlayerId?: string
  isCreator?: boolean
}) {
  const [state, formAction, isPending] = useActionState(actionCreateTransaction, null)
  const [fromPlayerId, setFromPlayerId] = useState<string>('')
  const [toPlayerId, setToPlayerId] = useState<string>('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  useEffect(() => {
    if (state?.success) {
      // Resetear el formulario después de una transacción exitosa
      const timer = setTimeout(() => {
        setFromPlayerId('')
        setToPlayerId('')
        if (formRef.current) {
          formRef.current.reset()
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [state?.success])

  // Filtrar jugadores para el selector "Desde"
  // Solo el creador puede enviar desde banco o parada libre
  const fromPlayers = players.filter(p => {
    if (p.id === currentPlayerId) return true
    if (p.isSystemPlayer && isCreator) return true
    return false
  })

  // Filtrar jugadores para el selector "Hacia"
  const toPlayers = players

  const formatBalance = (player: TPlayer) => {
    if (player.isSystemPlayer && player.systemPlayerType === 'bank') {
      return '∞'
    }
    return `$${player.balance}`
  }

  const formatPlayerOption = (player: TPlayer) => {
    // Mostrar balance si es jugador del sistema o el jugador actual
    if (player.isSystemPlayer || player.id === currentPlayerId) {
      return `${player.name} (${formatBalance(player)})`
    }
    // Ocultar balance de otros jugadores
    return player.name
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Transferir dinero</h2>
      <form ref={formRef} action={formAction} className="flex flex-col gap-4 max-w-md">
        <input type="hidden" name="tableroId" value={tableroId} />

        {isCreator ? (
          <div className="space-y-2">
            <Label htmlFor="fromPlayerId">Desde:</Label>
            <Select
              name="fromPlayerId"
              value={fromPlayerId}
              onValueChange={setFromPlayerId}
              disabled={isPending}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar jugador" />
              </SelectTrigger>
              <SelectContent>
                {fromPlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {formatPlayerOption(player)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <input type="hidden" name="fromPlayerId" value={currentPlayerId || ''} />
        )}

        <div className="space-y-2">
          <Label htmlFor="toPlayerId">Hacia:</Label>
          <Select
            name="toPlayerId"
            value={toPlayerId}
            onValueChange={setToPlayerId}
            disabled={isPending}
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar jugador" />
            </SelectTrigger>
            <SelectContent>
              {toPlayers.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {formatPlayerOption(player)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Monto:</Label>
          <Input
            type="number"
            id="amount"
            name="amount"
            min="1"
            required
            disabled={isPending}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción (opcional):</Label>
          <Input
            type="text"
            id="description"
            name="description"
            disabled={isPending}
            placeholder="Concepto de la transferencia"
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
        >
          {isPending ? 'Procesando...' : 'Transferir'}
        </Button>
      </form>
    </section>
  )
}
