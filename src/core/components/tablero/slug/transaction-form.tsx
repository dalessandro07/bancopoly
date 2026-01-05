'use client'

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/src/core/components/ui/drawer'
import type { TPlayer } from '@/src/core/lib/db/schema'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { TransactionFormContent } from './transaction-form/transaction-form-content'

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
  const [fromPlayerId, setFromPlayerId] = useState<string>('')
  const [toPlayerId, setToPlayerId] = useState<string>(() => preselectedToPlayerId || '')
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isOpen, setIsOpen] = useState(() => !!preselectedToPlayerId)
  const [, startTransition] = useTransition()

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

  // Handler para cerrar y resetear
  const handleClose = useCallback(
    (open: boolean) => {
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
    },
    [preselectedToPlayerId, onOpenChange]
  )

  // Handler para éxito de la transacción
  const handleSuccess = useCallback(() => {
    setFromPlayerId('')
    setToPlayerId('')
    setAmount('')
    setDescription('')
    setIsOpen(false)
    if (onOpenChange) {
      onOpenChange(false)
    }
  }, [onOpenChange])


  return (
    <Drawer open={isOpen} onOpenChange={handleClose} direction="bottom">
      <DrawerContent className="rounded-t-xl border-t">
        <DrawerHeader className="text-center">
          <DrawerTitle>Transferir dinero</DrawerTitle>
          <DrawerDescription>
            Envía dinero a otro jugador del tablero
          </DrawerDescription>
        </DrawerHeader>

        <TransactionFormContent
          tableroId={tableroId}
          players={players}
          currentPlayerId={currentPlayerId}
          isCreator={isCreator}
          fromPlayerId={fromPlayerId}
          toPlayerId={toPlayerId}
          amount={amount}
          description={description}
          isPending={false}
          onFromPlayerChange={setFromPlayerId}
          onToPlayerChange={setToPlayerId}
          onAmountChange={setAmount}
          onDescriptionChange={setDescription}
          onSuccess={handleSuccess}
        />
      </DrawerContent>
    </Drawer>
  )
}
