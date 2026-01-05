'use client'

import { actionCreateTransaction } from '@/src/core/actions/tablero'
import { Button } from '@/src/core/components/ui/button'
import { Input } from '@/src/core/components/ui/input'
import { Label } from '@/src/core/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/core/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/src/core/components/ui/sheet'
import type { TPlayer } from '@/src/core/lib/db/schema'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

interface TransactionFormProps {
  tableroId: string
  players: TPlayer[]
  currentPlayerId?: string
  isCreator?: boolean
  preselectedToPlayerId?: string
  onOpenChange?: (open: boolean) => void
}

export default function TransactionForm ({
  tableroId,
  players,
  currentPlayerId,
  isCreator = false,
  preselectedToPlayerId,
  onOpenChange,
}: TransactionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [fromPlayerId, setFromPlayerId] = useState<string>('')
  const [toPlayerId, setToPlayerId] = useState<string>(() => preselectedToPlayerId || '')
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isOpen, setIsOpen] = useState(() => !!preselectedToPlayerId)
  const [formKey, setFormKey] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  // Abrir el formulario cuando se preselecciona un jugador
  useEffect(() => {
    if (preselectedToPlayerId) {
      startTransition(() => {
        setToPlayerId(preselectedToPlayerId)
        // Si es creador y no hay fromPlayerId seleccionado, seleccionar automáticamente su jugador
        if (isCreator && !fromPlayerId && currentPlayerId) {
          setFromPlayerId(currentPlayerId)
        }
        setIsOpen(true)
      })
      if (onOpenChange) {
        onOpenChange(true)
      }
    }
  }, [preselectedToPlayerId, onOpenChange, isCreator, fromPlayerId, currentPlayerId])

  // Acción del formulario envuelta
  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await actionCreateTransaction(null, formData)

      if (result?.error) {
        toast.error(result.error)
      }

      if (result?.success) {
        // Resetear y cerrar
        setFromPlayerId('')
        setToPlayerId('')
        setAmount('')
        setDescription('')
        setIsOpen(false)
        if (onOpenChange) {
          onOpenChange(false)
        }
        setFormKey(k => k + 1)
        // Actualizar el contenido de la página para el usuario que hace la transacción
        router.refresh()
      }
    })
  }

  // Handler para botones de acceso rápido
  const handleQuickAmount = (quickAmount: number, quickDescription?: string) => {
    const currentAmount = parseFloat(amount) || 0
    const newAmount = currentAmount + quickAmount
    setAmount(newAmount.toString())
    if (quickDescription) {
      setDescription(quickDescription)
    }
  }

  // Filtrar jugadores para el selector "Desde"
  // Solo el creador puede enviar desde banco o parada libre
  const fromPlayers = useMemo(() => players.filter(p => {
    if (p.id === currentPlayerId) return true
    if (p.isSystemPlayer && isCreator) return true
    return false
  }), [players, currentPlayerId, isCreator])

  // Determinar el jugador origen actual (para filtrar en "Hacia")
  const actualFromPlayerId = isCreator ? fromPlayerId : currentPlayerId

  // Obtener el jugador origen seleccionado
  const fromPlayer = useMemo(() => {
    if (!actualFromPlayerId) return null
    return players.find(p => p.id === actualFromPlayerId)
  }, [players, actualFromPlayerId])

  // Verificar si el jugador origen es el banco
  const isFromBank = fromPlayer?.isSystemPlayer && fromPlayer?.systemPlayerType === 'bank'

  // Filtrar jugadores para el selector "Hacia"
  // No mostrar el jugador que está enviando
  const toPlayers = useMemo(() =>
    players.filter(p => p.id !== actualFromPlayerId),
    [players, actualFromPlayerId]
  )

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

  // Handler para cambiar fromPlayerId y resetear toPlayerId si es necesario
  const handleFromPlayerChange = (value: string) => {
    setFromPlayerId(value)
    // Si el toPlayerId actual es igual al nuevo fromPlayerId, resetearlo
    if (toPlayerId === value) {
      setToPlayerId('')
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        // Resetear cuando se cierra
        setAmount('')
        setDescription('')
        if (preselectedToPlayerId) {
          setToPlayerId('')
        }
      }
      if (onOpenChange) {
        onOpenChange(open)
      }
    }}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Transferir dinero</SheetTitle>
          <SheetDescription>
            Envía dinero a otro jugador del tablero
          </SheetDescription>
        </SheetHeader>

        <motion.form
          key={formKey}
          ref={formRef}
          action={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4 p-4"
        >
          <input type="hidden" name="tableroId" value={tableroId} />

          <div className="space-y-2">
            <input
              type="number"
              id="amount"
              name="amount"
              min="1"
              required
              disabled={isPending}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-center text-4xl font-semibold bg-transparent border-0 outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none disabled:opacity-50"
            />
            <div className="flex gap-2 flex-wrap mt-2">
              {[5, 10, 20, 50, 100].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                  disabled={isPending}
                  className="flex-1 min-w-[60px]"
                >
                  ${quickAmount}
                </Button>
              ))}
              {isFromBank && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(200, 'Salida')}
                  disabled={isPending}
                  className="flex-1 min-w-[60px] bg-primary/10 border-primary/20"
                >
                  $200
                </Button>
              )}
            </div>
          </div>

          {isCreator ? (
            <div className="space-y-2">
              <Label htmlFor="fromPlayerId">Desde:</Label>
              <Select
                name="fromPlayerId"
                value={fromPlayerId}
                onValueChange={handleFromPlayerChange}
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
              onValueChange={(value) => {
                setToPlayerId(value)
                // Si es creador y no hay fromPlayerId seleccionado, seleccionar automáticamente su jugador
                if (isCreator && !fromPlayerId && currentPlayerId) {
                  setFromPlayerId(currentPlayerId)
                }
              }}
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
            <Label htmlFor="description">Descripción (opcional):</Label>
            <Input
              type="text"
              id="description"
              name="description"
              disabled={isPending}
              placeholder="Concepto de la transferencia"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? 'Procesando...' : 'Transferir'}
          </Button>
        </motion.form>
      </SheetContent>
    </Sheet>
  )
}
